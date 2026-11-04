import { Chess } from 'chess.js'
import { UciEngine } from './uci'

export interface Bot {
  id: number
  name: string
  emoji: string
  tagline: string
  depth: number
  multipv: number
  /** più è alto, più sbaglia (in centipawn) */
  temp: number
  /** probabilità di muovere a caso */
  randomChance: number
  movetime: number
}

export const BOTS: Bot[] = [
  { id: 1, name: 'Pedone Pigro', emoji: '🐌', tagline: 'Muove a caso e si dimentica pure cosa sta facendo.', depth: 1, multipv: 6, temp: 500, randomChance: 0.4, movetime: 100 },
  { id: 2, name: 'Nonna Gertrude', emoji: '👵', tagline: 'Dolce, ma ti frega con la torta e col matto.', depth: 1, multipv: 5, temp: 260, randomChance: 0.18, movetime: 100 },
  { id: 3, name: 'Tony il Cavallo', emoji: '🐴', tagline: 'Salta ovunque. A volte ha pure un piano.', depth: 2, multipv: 5, temp: 170, randomChance: 0.07, movetime: 150 },
  { id: 4, name: 'Alfiere Ale', emoji: '😎', tagline: 'Diagonale per vocazione, prudente per sbaglio.', depth: 3, multipv: 4, temp: 110, randomChance: 0.03, movetime: 200 },
  { id: 5, name: 'Torre di Controllo', emoji: '🏰', tagline: 'Pochi errori, tanta pazienza.', depth: 5, multipv: 4, temp: 65, randomChance: 0, movetime: 300 },
  { id: 6, name: 'Lady Matta', emoji: '🔥', tagline: 'Attacca sempre. Se la fermi, ti sorride.', depth: 8, multipv: 3, temp: 38, randomChance: 0, movetime: 500 },
  { id: 7, name: 'Il Professore', emoji: '🎓', tagline: 'Ha letto tutti i libri. Anche quelli che non esistono.', depth: 11, multipv: 3, temp: 20, randomChance: 0, movetime: 800 },
  { id: 8, name: 'Re Stoccafisso', emoji: '👑', tagline: 'Il boss finale. Non fa regali.', depth: 14, multipv: 2, temp: 8, randomChance: 0, movetime: 1200 },
]

let botEngine: UciEngine | null = null
export function getBotEngine(): UciEngine {
  if (!botEngine) botEngine = new UciEngine()
  return botEngine
}

/** Sceglie la mossa del bot (UCI) in modo "umano": forte quanto basta, con errori plausibili. */
export async function chooseBotMove(fen: string, bot: Bot): Promise<string> {
  const chess = new Chess(fen)
  const legal = chess.moves({ verbose: true })
  if (legal.length === 0) throw new Error('nessuna mossa legale')

  if (Math.random() < bot.randomChance) {
    const m = legal[Math.floor(Math.random() * legal.length)]
    return m.from + m.to + (m.promotion ?? '')
  }

  const res = await getBotEngine().search(fen, { depth: bot.depth, multipv: bot.multipv, movetime: bot.movetime })
  const lines = res.lines.filter((l) => l.pv.length > 0)
  if (lines.length === 0) return res.bestmove
  const best = lines[0].cp
  const weights = lines.map((l) => Math.exp(-(best - l.cp) / bot.temp))
  const total = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < lines.length; i++) {
    r -= weights[i]
    if (r <= 0) return lines[i].pv[0]
  }
  return lines[0].pv[0]
}
