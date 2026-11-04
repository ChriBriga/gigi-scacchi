import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'

export const FILES = 'abcdefgh'
export const VALUE: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

export const PIECE_NAME: Record<PieceSymbol, string> = {
  p: 'pedone',
  n: 'cavallo',
  b: 'alfiere',
  r: 'torre',
  q: 'regina',
  k: 're',
}

export const ALL_SQUARES: Square[] = (() => {
  const out: Square[] = []
  for (let r = 8; r >= 1; r--) for (const f of FILES) out.push(`${f}${r}` as Square)
  return out
})()

export function sqToCoords(sq: Square): { col: number; row: number } {
  return { col: FILES.indexOf(sq[0]), row: 8 - Number(sq[1]) }
}

export function coordsToSq(col: number, row: number): Square {
  return `${FILES[col]}${8 - row}` as Square
}

export function parseUci(uci: string): { from: Square; to: Square; promotion?: PieceSymbol } {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : undefined,
  }
}

export function materialFor(chess: Chess, color: Color): number {
  let total = 0
  for (const row of chess.board()) {
    for (const p of row) if (p && p.color === color && p.type !== 'k') total += VALUE[p.type]
  }
  return total
}

export function opposite(c: Color): Color {
  return c === 'w' ? 'b' : 'w'
}

export function safeChess(fen: string): Chess | null {
  try {
    return new Chess(fen)
  } catch {
    return null
  }
}
