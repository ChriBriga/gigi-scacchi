import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'

/**
 * Lo stile di gioco di un bot. Non è un copione: il motore propone le sue mosse migliori (con la solita
 * forza e i soliti errori del bot) e lo stile dà soltanto una piccola preferenza fra mosse *quasi equivalenti*.
 * Una mossa chiaramente peggiore non viene mai scelta per stile, e più il bot è forte più la preferenza è sottile.
 *
 * Questo file importa solo chess.js, così lo usano anche gli script da riga di comando (scripts/measure-style.mjs).
 */
export type StyleId = 'aggressive' | 'positional' | 'tactical' | 'solid' | 'balanced'

export interface StyleInfo {
  label: string
  /** com'è fatto questo modo di giocare */
  blurb: string
  /** come si affronta */
  tip: string
}

export const STYLES: Record<StyleId, StyleInfo> = {
  aggressive: {
    label: 'Attaccante',
    blurb: 'Dà scacco, cattura e porta i pezzi contro il tuo re.',
    tip: 'Tieni il re al sicuro: arrocca presto, non muovere i pedoni davanti al re e scambia i pezzi con cui attacca.',
  },
  positional: {
    label: 'Posizionale',
    blurb: 'Sviluppa in fretta, controlla il centro e mette i pezzi nelle case migliori.',
    tip: 'Non perdere tempo: sviluppa i pezzi, occupa il centro anche tu e porta le torri sulle colonne aperte.',
  },
  tactical: {
    label: 'Tattico',
    blurb: 'Cerca minacce doppie, forchette e trappole.',
    tip: 'Prima di ogni mossa chiediti cosa minaccia adesso: pezzi non difesi e forchette sono il suo pane.',
  },
  solid: {
    label: 'Solido',
    blurb: 'Arrocca, difende bene e semplifica con gli scambi.',
    tip: 'Ci vuole pazienza: non basta un colpo solo. Costruisci un piano, migliora i pezzi e cerca i finali.',
  },
  balanced: {
    label: 'Senza stile',
    blurb: 'Gioca quello che gli viene, senza un piano preciso.',
    tip: 'Ottimo per allenare le basi: pezzi in presa, matti in una mossa e le tre domande prima di muovere.',
  },
}

const VAL: Record<PieceSymbol, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const fileOf = (s: Square) => s.charCodeAt(0) - 97
const rankOf = (s: Square) => Number(s[1]) - 1
const cheb = (a: Square, b: Square) => Math.max(Math.abs(fileOf(a) - fileOf(b)), Math.abs(rankOf(a) - rankOf(b)))
const other = (c: Color): Color => (c === 'w' ? 'b' : 'w')

const CENTER = new Set(['d4', 'e4', 'd5', 'e5'])
const RING = new Set(['c3', 'd3', 'e3', 'f3', 'c4', 'f4', 'c5', 'f5', 'c6', 'd6', 'e6', 'f6'])

function kingSquare(g: Chess, color: Color): Square | null {
  for (const row of g.board()) for (const p of row) if (p && p.type === 'k' && p.color === color) return p.square
  return null
}

/** Quanti pezzi di `color` (re escluso) sono in presa: attaccati e non difesi, o attaccati da un pezzo che vale meno. */
function hangingCount(g: Chess, color: Color): number {
  const opp = other(color)
  let n = 0
  for (const row of g.board()) {
    for (const p of row) {
      if (!p || p.color !== color || p.type === 'k') continue
      const att = g.attackers(p.square, opp)
      if (att.length === 0) continue
      const cheapest = Math.min(...att.map((s) => VAL[g.get(s)!.type]))
      if (g.attackers(p.square, color).length === 0 || cheapest < VAL[p.type]) n++
    }
  }
  return n
}

/** Le caratteristiche della mossa (0/1, o piccoli conteggi) su cui ragionano gli stili. */
export interface MoveFeatures {
  check: boolean
  capture: boolean
  trade: boolean
  castle: boolean
  develop: boolean
  /** 1 = una delle 4 case centrali, 0.5 = la cornice intorno */
  centre: number
  rimKnight: boolean
  nearKing: boolean
  pawnStorm: boolean
  newThreats: number
  fork: boolean
  risky: boolean
  shieldPush: boolean
  kingMove: boolean
  openFileRook: boolean
  defended: boolean
  piece: PieceSymbol
}

export function moveFeatures(fen: string, uci: string): MoveFeatures | null {
  const before = new Chess(fen)
  const after = new Chess(fen)
  let mv
  try {
    mv = after.move({ from: uci.slice(0, 2) as Square, to: uci.slice(2, 4) as Square, promotion: uci.length > 4 ? (uci[4] as PieceSymbol) : undefined })
  } catch {
    return null
  }
  const me = mv.color
  const opp = other(me)
  const piece = mv.piece
  const from = mv.from
  const to = mv.to
  const home = me === 'w' ? 0 : 7
  const myKing = kingSquare(before, me)
  const enemyKing = kingSquare(before, opp)
  const targets = after.board().flat().filter((p) => p && p.color === opp && p.type !== 'k')

  // pezzi avversari attaccati dal pezzo appena mosso e "interessanti": valgono di più o non sono difesi
  let hits = 0
  for (const t of targets) {
    if (!t || !after.attackers(t.square, me).includes(to)) continue
    if (VAL[t.type] > VAL[piece] || after.attackers(t.square, opp).length === 0) hits++
  }

  const attackedBy = after.attackers(to, opp)
  const myDefenders = after.attackers(to, me).length
  const risky = attackedBy.length > 0 && (myDefenders === 0 || Math.min(...attackedBy.map((s) => VAL[after.get(s)!.type])) < VAL[piece])

  const wingsApart = !!myKing && !!enemyKing && Math.abs(fileOf(myKing) - fileOf(enemyKing)) >= 3
  const pawnStorm = piece === 'p' && wingsApart && !!enemyKing && Math.abs(fileOf(to) - fileOf(enemyKing)) <= 2
  const shieldPush = piece === 'p' && !!myKing && rankOf(myKing) === home && rankOf(from) === (me === 'w' ? 1 : 6) && Math.abs(fileOf(from) - fileOf(myKing)) <= 1 && (fileOf(myKing) >= 5 || fileOf(myKing) <= 2)
  const nearKing = !!enemyKing && piece !== 'k' && piece !== 'p' && cheb(to, enemyKing) <= 3 && cheb(to, enemyKing) < cheb(from, enemyKing)

  let openFileRook = false
  if (piece === 'r' && fileOf(from) !== fileOf(to)) {
    openFileRook = !after.board().flat().some((p) => p && p.type === 'p' && p.color === me && fileOf(p.square) === fileOf(to))
  }

  return {
    check: after.inCheck(),
    capture: !!mv.captured,
    trade: !!mv.captured && VAL[mv.captured] === VAL[piece],
    castle: mv.flags.includes('k') || mv.flags.includes('q'),
    develop: (piece === 'n' || piece === 'b') && rankOf(from) === home && rankOf(to) !== home,
    centre: piece === 'p' || piece === 'n' || piece === 'b' ? (CENTER.has(to) ? 1 : RING.has(to) ? 0.5 : 0) : 0,
    rimKnight: piece === 'n' && (fileOf(to) === 0 || fileOf(to) === 7),
    nearKing,
    pawnStorm,
    newThreats: Math.min(2, Math.max(0, hangingCount(after, opp) - hangingCount(before, opp))),
    fork: hits >= 2,
    risky,
    shieldPush,
    kingMove: piece === 'k' && !(mv.flags.includes('k') || mv.flags.includes('q')),
    openFileRook,
    defended: myDefenders > 0,
    piece,
  }
}

/** Quanto la mossa piace allo stile: circa da -1 a +2. */
export function styleScore(f: MoveFeatures, style: StyleId, pet?: PieceSymbol): number {
  let s = 0
  switch (style) {
    case 'aggressive':
      s += (f.check ? 1 : 0) + (f.capture ? 0.5 : 0) + (f.nearKing ? 0.6 : 0) + (f.pawnStorm ? 0.7 : 0) + (f.castle ? 0.2 : 0)
      s -= f.trade ? 0.3 : 0
      s -= f.rimKnight ? 0.3 : 0
      break
    case 'positional':
      s += f.centre * (f.piece === 'p' ? 0.9 : 0.6) + (f.develop ? 0.8 : 0) + (f.castle ? 1 : 0) + (f.openFileRook ? 0.7 : 0)
      s -= (f.rimKnight ? 0.6 : 0) + (f.kingMove ? 0.4 : 0)
      break
    case 'tactical':
      s += f.newThreats * 1 + (f.fork ? 1 : 0) + (f.check ? 0.4 : 0) + (f.capture ? 0.3 : 0)
      break
    case 'solid':
      s += (f.castle ? 1 : 0) + (f.trade ? 0.7 : 0) + (f.defended ? 0.3 : 0) + (f.develop ? 0.4 : 0)
      s -= (f.shieldPush ? 0.6 : 0) + (f.kingMove ? 0.5 : 0) + (f.risky ? 0.4 : 0)
      break
    case 'balanced':
      break
  }
  if (pet && f.piece === pet) s += 0.4
  return Math.max(-1.5, Math.min(2.5, s))
}

export interface Candidate {
  /** valutazione in centipawn dal punto di vista di chi muove */
  cp: number
  /** la mossa in UCI */
  move: string
}

export interface StyleParams {
  /** quanto sbaglia il bot (in cp): scala anche la forza dello stile */
  temp: number
  style: StyleId
  pet?: PieceSymbol
}

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x))

/**
 * I pesi con cui il bot sceglie fra le sue mosse candidate (la prima è la migliore).
 * Senza stile sono quelli di sempre: exp(-perdita / temp). Con lo stile, le mosse entro una "finestra" dalla migliore
 * ricevono un bonus in centipawn; lo stile pesa meno nei bot forti e non vale quando c'è un matto in vista.
 */
export function candidateWeights(fen: string, cands: Candidate[], p: StyleParams): number[] {
  const best = Math.max(...cands.map((c) => c.cp))
  const styled = (p.style !== 'balanced' || !!p.pet) && best < 2500
  const unit = clamp(p.temp * 1.1, 18, 70)
  const window = clamp(p.temp * 2, 35, 110)
  return cands.map((c) => {
    let bonus = 0
    if (styled && c.cp >= best - window) {
      const f = moveFeatures(fen, c.move)
      if (f) bonus = styleScore(f, p.style, p.pet) * unit
    }
    return Math.exp(-(best - c.cp - bonus) / p.temp)
  })
}

/** Sceglie l'indice di una candidata con i pesi dati. */
export function pickIndex(weights: number[], rand: () => number = Math.random): number {
  const total = weights.reduce((a, b) => a + b, 0)
  let r = rand() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return 0
}
