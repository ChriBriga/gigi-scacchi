import { Chess, type Color } from 'chess.js'
import type { Judgement } from './engine/analysis'
import { botById } from './engine/bots'
import { parseUci } from './chess/util'

/** Una mossa della partita, con il giudizio se c'è già. */
export interface SavedMove {
  san: string
  uci: string
  fenBefore: string
  color: Color
  judgement?: Judgement
}

/** La partita lasciata a metà: un solo posto, solo su questo dispositivo (non viaggia con la sincronizzazione). */
export interface SavedGame {
  v: 1
  botId: number
  color: Color
  moves: SavedMove[]
  retracts: number
  badMoves: number
  savedAt: number
}

const KEY = 'gigi-scacchi-game-v1'
/** una partita lasciata lì da più di un mese non si riprende più */
const MAX_AGE_MS = 30 * 24 * 3600 * 1000

/** Rigioca le mosse dall'inizio. Restituisce null se una mossa non è legale. */
export function replayMoves(moves: SavedMove[]): Chess | null {
  const g = new Chess()
  try {
    for (const m of moves) {
      const p = parseUci(m.uci)
      g.move({ from: p.from, to: p.to, promotion: p.promotion })
    }
  } catch {
    return null
  }
  return g
}

export function saveGame(game: Omit<SavedGame, 'v' | 'savedAt'>): void {
  try {
    const data: SavedGame = { v: 1, savedAt: Date.now(), ...game }
    localStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* memoria piena o bloccata: la partita funziona lo stesso, solo non si potrà riprendere */
  }
}

export function clearSavedGame(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* niente da fare */
  }
}

/** La partita da riprendere, se esiste ed è valida (altrimenti viene buttata via). */
export function loadSavedGame(): SavedGame | null {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(KEY)
  } catch {
    return null
  }
  if (!raw) return null
  try {
    const d = JSON.parse(raw) as SavedGame
    const ok =
      d?.v === 1 &&
      botById(d.botId) &&
      (d.color === 'w' || d.color === 'b') &&
      Array.isArray(d.moves) &&
      d.moves.length > 0 &&
      Date.now() - d.savedAt < MAX_AGE_MS
    const g = ok ? replayMoves(d.moves) : null
    if (g && !g.isGameOver()) return d
  } catch {
    /* dati rovinati */
  }
  clearSavedGame()
  return null
}
