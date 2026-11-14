import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import type { Judgement, Quality } from './analysis'
import type { Puzzle } from '../screens/Puzzles'
import { hangingPieces } from '../chess/danger'
import { VALUE, parseUci } from '../chess/util'

/** Di che tipo è un tuo errore: serve a capire dove perdi più punti. */
export type MistakeKind = 'mate' | 'hang' | 'free' | 'king' | 'opening' | 'endgame' | 'other'

export interface MistakeInfo {
  label: string
  /** come lo chiama il coach quando te lo spiega */
  what: string
  /** cosa fare per migliorare */
  tip: string
  /** lezione da (ri)vedere */
  lesson?: string
  /** temi dei puzzle che lo allenano */
  themes?: Puzzle['theme'][]
  /** si allena anche con i finali contro il bot */
  drills?: boolean
}

export const MISTAKE_INFO: Record<MistakeKind, MistakeInfo> = {
  hang: {
    label: 'Pezzi lasciati in presa',
    what: 'dopo la tua mossa un pezzo restava attaccato e non protetto',
    tip: 'Prima di muovere, guarda i pezzi che puoi perdere: quello che sposti resta protetto? E gli altri?',
    lesson: 'presa',
    themes: ['free', 'defend'],
  },
  mate: {
    label: 'Matti lasciati scappare',
    what: 'avevi un matto forzato e non lo hai giocato',
    tip: 'Quando l’avversario ha il re scoperto, cerca per prima cosa tutti gli scacchi: spesso uno è matto.',
    lesson: 'matto1',
    themes: ['mate1', 'mate2', 'backrank', 'matepat'],
  },
  free: {
    label: 'Occasioni non colte',
    what: 'c’era un pezzo da prendere o una tattica che hai lasciato lì',
    tip: 'A ogni mossa chiediti: l’avversario ha lasciato qualcosa in presa? Controlla catture e scacchi prima del resto.',
    lesson: 'forchetta',
    themes: ['free', 'fork', 'tactic'],
  },
  king: {
    label: 'Re in pericolo',
    what: 'la tua mossa lasciava il re esposto a un matto',
    tip: 'Arrocca presto e non aprire il gioco davanti al tuo re se l’avversario ha pezzi pronti ad attaccare.',
    lesson: 'arrocco',
    themes: ['defend', 'backrank'],
  },
  opening: {
    label: 'Aperture',
    what: 'l’errore è arrivato nelle prime mosse',
    tip: 'Nelle prime 10 mosse: centro, sviluppo dei pezzi, arrocco. Non muovere due volte lo stesso pezzo senza motivo.',
    lesson: 'principi',
  },
  endgame: {
    label: 'Finali',
    what: 'sbagli quando restano pochi pezzi',
    tip: 'Nei finali il re diventa un pezzo che combatte: portalo al centro e conta bene i tempi dei pedoni.',
    themes: ['endgame'],
    drills: true,
  },
  other: {
    label: 'Mosse distratte',
    what: 'mosse che sembravano normali ma lasciavano qualcosa al caso',
    tip: 'Prima di ogni mossa le tre domande: che cosa minaccia lui? Cosa lascio scoperto? C’è qualcosa da prendere?',
    lesson: 'occhio',
    themes: ['tactic'],
  },
}

export const MISTAKE_ORDER: MistakeKind[] = ['hang', 'mate', 'free', 'king', 'opening', 'endgame', 'other']

/** Un errore che conta: svarione, errore o matto lasciato scappare. */
export function isMistake(j: Judgement): boolean {
  return j.quality === 'blunder' || j.quality === 'mistake' || !!j.missedMate
}

/** Materiale dei pezzi (re e pedoni esclusi) di entrambi i colori: 62 all'inizio. */
function pieceMaterial(g: Chess): number {
  let t = 0
  for (const row of g.board()) for (const p of row) if (p && p.type !== 'p' && p.type !== 'k') t += VALUE[p.type]
  return t
}

/** Classifica un errore in base a cosa è successo (solo con quello che si sa senza altre analisi del motore). */
export function classifyMistake(fenBefore: string, uci: string, j: Judgement, moveNo: number): MistakeKind {
  if (j.missedMate) return 'mate'
  try {
    const before = new Chess(fenBefore)
    const mover: Color = before.turn()
    const p = parseUci(uci)
    const after = new Chess(fenBefore)
    after.move({ from: p.from, to: p.to, promotion: p.promotion })
    if (hangingPieces(after, mover).length > 0) return 'hang'

    if (j.bestUci) {
      const b = parseUci(j.bestUci)
      const bm = before.moves({ verbose: true }).find((m) => m.from === b.from && m.to === b.to)
      if (bm?.captured && bm.to !== (p.to as Square)) {
        const target = bm.captured as PieceSymbol
        const piece = bm.piece
        // un pezzo da prendere gratis (non difeso) o in cambio di uno più piccolo
        const defended = before.attackers(bm.to, mover === 'w' ? 'b' : 'w').length > 0
        if (!defended || VALUE[target] > VALUE[piece]) return 'free'
      }
    }
    if (j.cpAfter <= -2500) return 'king'
    if (moveNo <= 10) return 'opening'
    if (pieceMaterial(before) <= 20) return 'endgame'
  } catch {
    /* posizione illeggibile: resta "altro" */
  }
  return 'other'
}

/** Una partita giocata, in piccolo: basta per statistiche e grafici senza tenere tutte le mosse. */
export interface GameRecord {
  /** quando è finita (ms): identifica la partita e serve alla sincronizzazione */
  id: number
  day: string
  bot: number
  color: Color
  outcome: 'win' | 'lose' | 'draw'
  /** quante mosse tue */
  moves: number
  /** precisione 0-100, calcolata sulle mosse giudicate */
  acc: number
  q: Partial<Record<Quality, number>>
  kinds: Partial<Record<MistakeKind, number>>
  /** minacce dell'avversario incontrate (solo se ce ne sono state): quante, parate, ignorate, aiuti "T" usati */
  threats?: { seen: number; handled: number; missed: number; asked: number }
  /** modo di gioco (assente nelle partite di prima dei modi = Allenamento) */
  mode?: 'training' | 'nonet' | 'tournament'
  /** mosse ritirate */
  retracts?: number
  /** il punteggio del giocatore dopo questa partita (solo se contava) */
  rating?: number
}

/** Formula di Lichess: perdita media di probabilità di vittoria (punti %) → precisione. */
export function accuracyFrom(avgLoss: number): number {
  return Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * avgLoss) - 3.1669))
}

export interface JudgedMove {
  san: string
  uci: string
  fenBefore: string
  color: Color
  judgement?: Judgement
}

/** Conta le tue mosse, quelle giudicate, le qualità e i tipi di errore, e calcola la precisione (null se le mosse giudicate sono meno di 4). */
export function summarizeOwn(moves: JudgedMove[], color: Color) {
  const q: GameRecord['q'] = {}
  const kinds: GameRecord['kinds'] = {}
  let loss = 0
  let judged = 0
  let own = 0
  moves.forEach((m, i) => {
    if (m.color !== color) return
    own++
    const j = m.judgement
    if (!j) return
    judged++
    loss += j.loss
    q[j.quality] = (q[j.quality] ?? 0) + 1
    if (isMistake(j)) {
      const k = classifyMistake(m.fenBefore, m.uci, j, Math.floor(i / 2) + 1)
      kinds[k] = (kinds[k] ?? 0) + 1
    }
  })
  const acc = judged >= 4 ? Math.round(accuracyFrom(loss / judged)) : null
  return { own, judged, acc, q, kinds }
}

/** Riassume una partita. Restituisce null se ci sono troppe poche mosse giudicate per dirne qualcosa. */
export function buildRecord(moves: JudgedMove[], color: Color, bot: number, outcome: GameRecord['outcome'], day: string): GameRecord | null {
  const { own, judged, acc, q, kinds } = summarizeOwn(moves, color)
  if (own < 5 || judged < 4 || acc === null) return null
  return { id: Date.now(), day, bot, color, outcome, moves: own, acc, q, kinds }
}

export interface WeakSpot {
  kind: MistakeKind
  /** errori di questo tipo nelle partite considerate */
  count: number
  /** per partita */
  perGame: number
}

/** Dove perdi più punti nelle ultime partite (le più recenti pesano un po' di più). */
export function weakSpots(history: GameRecord[], last = 15): WeakSpot[] {
  const recent = history.slice(-last)
  if (recent.length === 0) return []
  const out = new Map<MistakeKind, { count: number; w: number }>()
  recent.forEach((g, i) => {
    const weight = 0.6 + 0.4 * ((i + 1) / recent.length)
    for (const [k, n] of Object.entries(g.kinds) as [MistakeKind, number][]) {
      const cur = out.get(k) ?? { count: 0, w: 0 }
      cur.count += n
      cur.w += n * weight
      out.set(k, cur)
    }
  })
  return [...out.entries()]
    .sort((a, b) => b[1].w - a[1].w)
    .map(([kind, v]) => ({ kind, count: v.count, perGame: v.count / recent.length }))
}
