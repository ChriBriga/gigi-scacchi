import { useRef } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { sqToCoords } from '../chess/util'

export interface PieceSprite {
  id: number
  type: PieceSymbol
  color: Color
  square: Square
}

/**
 * Mantiene un'identità stabile per ogni pezzo tra una posizione e l'altra,
 * così React può animare gli spostamenti invece di ridisegnare tutto.
 */
export function useBoardPieces(fen: string): PieceSprite[] {
  const prev = useRef<PieceSprite[]>([])
  const nextId = useRef(1)
  const lastFen = useRef<string | null>(null)

  if (lastFen.current === fen) return prev.current

  let board
  try {
    board = new Chess(fen).board()
  } catch {
    return prev.current
  }
  const target: { type: PieceSymbol; color: Color; square: Square }[] = []
  for (const row of board) for (const p of row) if (p) target.push({ type: p.type, color: p.color, square: p.square })

  const old = prev.current
  const used = new Set<number>()
  const result: PieceSprite[] = []
  const pending: typeof target = []

  for (const t of target) {
    const same = old.find((o) => !used.has(o.id) && o.square === t.square && o.type === t.type && o.color === t.color)
    if (same) {
      used.add(same.id)
      result.push(same)
    } else pending.push(t)
  }

  for (const t of pending) {
    const tc = sqToCoords(t.square)
    let best: PieceSprite | undefined
    let bestD = Infinity
    for (const o of old) {
      if (used.has(o.id) || o.color !== t.color) continue
      const sameType = o.type === t.type
      const promo = o.type === 'p' && !sameType
      if (!sameType && !promo) continue
      const oc = sqToCoords(o.square)
      const d = Math.abs(oc.col - tc.col) + Math.abs(oc.row - tc.row) + (promo ? 0.5 : 0)
      if (d < bestD) {
        bestD = d
        best = o
      }
    }
    if (best) {
      used.add(best.id)
      result.push({ id: best.id, type: t.type, color: t.color, square: t.square })
    } else {
      result.push({ id: nextId.current++, type: t.type, color: t.color, square: t.square })
    }
  }

  prev.current = result
  lastFen.current = fen
  return result
}
