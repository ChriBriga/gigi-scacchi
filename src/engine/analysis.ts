import { Chess, type Color } from 'chess.js'
import { UciEngine, type PvLine } from './uci'
import { getBotEngine } from './bots'
import { fxTier } from '../perf'
import { materialFor, opposite, parseUci } from '../chess/util'

export type Quality = 'brilliant' | 'best' | 'great' | 'good' | 'inaccuracy' | 'mistake' | 'blunder'

export const QUALITY_INFO: Record<Quality, { label: string; icon: string; color: string }> = {
  brilliant: { label: 'Geniale', icon: '!!', color: '#26d6c9' },
  best: { label: 'Migliore', icon: '★', color: '#7ed957' },
  great: { label: 'Ottima', icon: '✓', color: '#9be15d' },
  good: { label: 'Buona', icon: '✓', color: '#c7d96f' },
  inaccuracy: { label: 'Imprecisione', icon: '?!', color: '#ffc83d' },
  mistake: { label: 'Errore', icon: '?', color: '#ff8a3d' },
  blunder: { label: 'Svarione', icon: '??', color: '#ff4d5e' },
}

let engine: UciEngine | null = null
function getEngine(): UciEngine {
  // sui dispositivi deboli bot e giudizio dividono lo stesso motore (una sola copia in memoria, le ricerche vanno in fila)
  if (fxTier() === 'low') return getBotEngine()
  if (!engine) engine = new UciEngine()
  return engine
}

/** Quanto a fondo (e per quanto tempo al massimo) il motore giudica una posizione, secondo il livello degli effetti. */
function evalBudget(): { depth: number; movetime: number } {
  switch (fxTier()) {
    case 'low':
      return { depth: 9, movetime: 600 }
    case 'mid':
      return { depth: 11, movetime: 800 }
    default:
      return { depth: 12, movetime: 900 }
  }
}

export interface Evaluation {
  /** centipawn dal punto di vista di chi muove nella posizione */
  cp: number
  mate?: number
  best: string | undefined
  pv: string[]
}

const cache = new Map<string, Promise<Evaluation>>()

export function evaluate(fen: string, depth?: number): Promise<Evaluation> {
  const budget = evalBudget()
  const d = depth ?? budget.depth
  const key = `${fen}|${d}`
  let p = cache.get(key)
  if (!p) {
    p = getEngine()
      .search(fen, { depth: d, movetime: budget.movetime })
      .then((r) => {
        const l: PvLine | undefined = r.lines[0]
        return { cp: l?.cp ?? 0, mate: l?.mate, best: l?.pv[0] ?? (r.bestmove === '(none)' ? undefined : r.bestmove), pv: l?.pv ?? [] }
      })
    cache.set(key, p)
    // un errore del motore non va ricordato: la prossima richiesta riprova
    p.catch(() => cache.delete(key))
    if (cache.size > 300) cache.delete(cache.keys().next().value!)
  }
  return p
}

/** Probabilità di vittoria 0..100 (formula di Lichess). */
export function winPct(cp: number): number {
  const c = Math.max(-1000, Math.min(1000, cp))
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * c)) - 1)
}

export interface Judgement {
  quality: Quality
  /** perdita di probabilità di vittoria (punti %) */
  loss: number
  bestUci: string | undefined
  playedUci: string
  /** valutazione dopo la mossa, dal punto di vista di chi ha mosso, in cp */
  cpAfter: number
  bestWasPlayed: boolean
  /** la mossa ha lasciato scappare un matto o una vittoria netta */
  swing: number
  /** c'era un matto forzato e la mossa l'ha lasciato scappare */
  missedMate?: boolean
}

/** Giudica una mossa confrontando la valutazione prima e dopo. */
export async function judgeMove(fenBefore: string, uci: string): Promise<Judgement> {
  const before = await evaluate(fenBefore)
  const chess = new Chess(fenBefore)
  const mover: Color = chess.turn()
  const { from, to, promotion } = parseUci(uci)
  const matBefore = materialFor(chess, mover)
  chess.move({ from, to, promotion })
  const fenAfter = chess.fen()

  if (chess.isCheckmate()) {
    return { quality: 'best', loss: 0, bestUci: before.best, playedUci: uci, cpAfter: 3000, bestWasPlayed: true, swing: 0 }
  }
  if (chess.isDraw() || chess.isStalemate()) {
    const wb = winPct(before.cp)
    return { quality: wb > 75 ? 'blunder' : wb > 62 ? 'mistake' : 'good', loss: Math.max(0, wb - 50), bestUci: before.best, playedUci: uci, cpAfter: 0, bestWasPlayed: false, swing: 0 }
  }

  const after = await evaluate(fenAfter)
  const cpAfter = -after.cp
  const wBefore = winPct(before.cp)
  const wAfter = winPct(cpAfter)
  const loss = Math.max(0, wBefore - wAfter)
  const bestWasPlayed = before.best === uci

  let quality: Quality
  if (loss > 25) quality = 'blunder'
  else if (loss > 12) quality = 'mistake'
  else if (loss > 5.5) quality = 'inaccuracy'
  else if (bestWasPlayed || loss <= 1) quality = 'best'
  else if (loss <= 2.5) quality = 'great'
  else quality = 'good'

  // Geniale: una mossa (quasi) migliore che regala materiale ma resta ottima.
  if (loss <= 3 && wAfter >= 45 && wBefore < 92) {
    const replay = new Chess(fenAfter)
    let ok = true
    for (const m of after.pv.slice(0, 4)) {
      try {
        const p = parseUci(m)
        replay.move({ from: p.from, to: p.to, promotion: p.promotion })
      } catch {
        ok = false
        break
      }
    }
    if (ok) {
      const gave = matBefore - materialFor(replay, mover)
      const theirDelta = materialFor(new Chess(fenBefore), opposite(mover)) - materialFor(replay, opposite(mover))
      if (gave - theirDelta >= 2) quality = 'brilliant'
    }
  }

  const missedMate = before.mate !== undefined && before.mate > 0 && !(after.mate !== undefined && after.mate < 0)
  return { quality, loss, bestUci: before.best, playedUci: uci, cpAfter, bestWasPlayed, swing: wBefore - wAfter, missedMate }
}

export async function bestMoveFor(fen: string): Promise<string | undefined> {
  return (await evaluate(fen)).best
}
