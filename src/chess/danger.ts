import { Chess, type Color, type Square } from 'chess.js'
import { ALL_SQUARES, VALUE, opposite } from './util'

export interface SquareControl {
  w: number
  b: number
}

export type ControlMap = Record<Square, SquareControl>

/** Quanti pezzi di ciascun colore "vedono" ogni casa. */
export function controlMap(chess: Chess): ControlMap {
  const map = {} as ControlMap
  for (const sq of ALL_SQUARES) {
    map[sq] = { w: chess.attackers(sq, 'w').length, b: chess.attackers(sq, 'b').length }
  }
  return map
}

export type TintMap = Partial<Record<Square, { kind: 'danger' | 'safe' | 'both'; n: number }>>

/**
 * Colora la scacchiera dal punto di vista di `me`: rosso = case controllate dall'avversario,
 * verde = case controllate solo da te (modalità "full"), arancio = contese.
 */
export function dangerTints(chess: Chess, me: Color, mode: 'threats' | 'full'): TintMap {
  const out: TintMap = {}
  const map = controlMap(chess)
  const them = opposite(me)
  for (const sq of ALL_SQUARES) {
    if (chess.get(sq)?.color === them) continue
    const a = map[sq][them]
    const b = map[sq][me]
    if (a > 0 && b > 0 && mode === 'full') out[sq] = { kind: 'both', n: a }
    else if (a > 0) out[sq] = { kind: 'danger', n: a }
    else if (b > 0 && mode === 'full') out[sq] = { kind: 'safe', n: b }
  }
  return out
}

export interface Hanging {
  square: Square
  piece: string
  color: Color
}

/** Pezzi di `color` che l'avversario può prendere in vantaggio (non difesi, o attaccati da un pezzo di valore minore). */
export function hangingPieces(chess: Chess, color: Color): Hanging[] {
  const opp = opposite(color)
  const out: Hanging[] = []
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.color !== color || p.type === 'k') continue
      const attackers = chess.attackers(p.square, opp)
      if (attackers.length === 0) continue
      const defenders = chess.attackers(p.square, color).length
      const cheapest = Math.min(...attackers.map((s) => VALUE[chess.get(s)!.type]))
      if (defenders === 0 || cheapest < VALUE[p.type]) {
        out.push({ square: p.square, piece: p.type, color })
      }
    }
  }
  return out
}

export interface MateMove {
  from: Square
  to: Square
  san: string
}

/** Una mossa che dà scacco matto subito a chi ha la mossa nella posizione (se esiste). */
export function mateInOne(chess: Chess): MateMove | null {
  for (const m of chess.moves({ verbose: true })) {
    const t = new Chess(chess.fen())
    t.move(m)
    if (t.isCheckmate()) return { from: m.from, to: m.to, san: m.san }
  }
  return null
}

export interface Threats {
  /** tuoi pezzi che l'avversario può prendere in vantaggio */
  hanging: Hanging[]
  /** il matto in una che l'avversario avrebbe se fosse il suo turno, con la casa del tuo re */
  mate: (MateMove & { king: Square }) | null
}

/**
 * Cosa minaccia l'avversario, quando tocca a `me`: pezzi in presa e matto in una.
 * Per il matto si "passa il turno" all'avversario nella stessa posizione (se non sei sotto scacco).
 */
export function threatsFor(chess: Chess, me: Color): Threats {
  const hanging = hangingPieces(chess, me)
  let mate: Threats['mate'] = null
  if (chess.turn() === me && !chess.inCheck()) {
    try {
      const parts = chess.fen().split(' ')
      parts[1] = opposite(me)
      parts[3] = '-'
      const flipped = new Chess(parts.join(' '))
      const m = mateInOne(flipped)
      const king = chess.board().flat().find((p) => p?.type === 'k' && p.color === me)?.square
      if (m && king) mate = { ...m, king }
    } catch {
      /* posizione non rigirabile (es. l'avversario sarebbe in scacco): nessuna minaccia di matto */
    }
  }
  return { hanging, mate }
}
