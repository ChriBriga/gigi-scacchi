import type { Color, PieceSymbol } from 'chess.js'

/** Set di pezzi: stesse sagome, colori diversi (si generano con scripts/build-pieces.mjs). */
export interface PieceSet {
  id: string
  name: string
  /** colori dell'anteprima: pezzo chiaro e pezzo scuro */
  preview: [string, string]
}

export const PIECE_SETS: PieceSet[] = [
  { id: 'classico', name: 'Classico', preview: ['#ffffff', '#222222'] },
  { id: 'caramella', name: 'Caramella', preview: ['#ffd1ea', '#5fd6bd'] },
  { id: 'oro', name: 'Oro ed ebano', preview: ['#ffe58f', '#3a2a1a'] },
  { id: 'ghiaccio', name: 'Ghiaccio e fuoco', preview: ['#d6f1ff', '#ff7a45'] },
  { id: 'neon', name: 'Neon', preview: ['#f2fffc', '#241660'] },
  { id: 'legno', name: 'Legno', preview: ['#f3d9a8', '#8a5a2b'] },
]

/** Colori della scacchiera: "tema" segue il tema dell'app, gli altri sono fissi. */
export interface BoardStyle {
  id: string
  name: string
  light: string
  dark: string
  /** colore di ultima mossa e selezione, se quello giallo di base non si vede bene su questi colori */
  hl?: string
}

export const BOARD_STYLES: BoardStyle[] = [
  { id: 'tema', name: 'Come il tema', light: '', dark: '' },
  { id: 'classico', name: 'Torneo', light: '#f0d9b5', dark: '#b58863', hl: 'rgba(155, 199, 0, 0.45)' },
  { id: 'verde', name: 'Prato', light: '#eeeed2', dark: '#769656' },
  { id: 'azzurro', name: 'Cielo', light: '#dee3e6', dark: '#8ca2ad' },
  { id: 'rosa', name: 'Confetto', light: '#ffe4ee', dark: '#e07aa6' },
  { id: 'viola', name: 'Notte', light: '#cdbff5', dark: '#5a3fa8' },
  { id: 'grafite', name: 'Grafite', light: '#d9d9de', dark: '#6b6b78' },
]

export const pieceSetOf = (id: string | undefined): PieceSet => PIECE_SETS.find((s) => s.id === id) ?? PIECE_SETS[0]
export const boardStyleOf = (id: string | undefined): BoardStyle => BOARD_STYLES.find((b) => b.id === id) ?? BOARD_STYLES[0]

/** Indirizzo dell'immagine di un pezzo nel set scelto. */
export function pieceUrl(set: string | undefined, color: Color, type: PieceSymbol): string {
  const dir = set && set !== 'classico' && PIECE_SETS.some((s) => s.id === set) ? `${set}/` : ''
  return `${import.meta.env.BASE_URL}pieces/${dir}${color}${type.toUpperCase()}.svg`
}
