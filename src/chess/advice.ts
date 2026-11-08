import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { hangingPieces, mateInOne, threatsFor } from './danger'
import { FILES, PIECE_NAME, VALUE, opposite } from './util'

export type GamePhase = 'opening' | 'middle' | 'end'

export interface AdviceLine {
  text: string
  /** warn = pericolo, ok = occasione o via libera */
  level: 'warn' | 'ok'
}

export interface AdviceTip {
  /** la parola chiave in evidenza */
  key: string
  /** il consiglio, in una riga */
  text: string
  /** il principio dietro, in una frase (si apre a richiesta) */
  why: string
}

export interface Advice {
  phase: GamePhase
  phaseLabel: string
  /** cosa guardare adesso: pericoli e occasioni (una riga verde se non c'è niente) */
  urgent: AdviceLine[]
  /** al massimo due consigli adatti alla fase */
  tips: AdviceTip[]
}

const isMinor = (p?: { type: string } | null) => p?.type === 'n' || p?.type === 'b'
const HOME_MINORS: Record<Color, Square[]> = { w: ['b1', 'g1', 'c1', 'f1'], b: ['b8', 'g8', 'c8', 'f8'] }
const the = (t: string) => {
  const n = PIECE_NAME[t as PieceSymbol]
  return n === 'alfiere' ? "l'alfiere" : n === 're' ? 'il re' : n === 'regina' || n === 'torre' ? `la ${n}` : n === 'pedone' ? 'il pedone' : `il ${n}`
}

function pieceValue(chess: Chess): number {
  let v = 0
  for (const row of chess.board()) for (const p of row) if (p && p.type !== 'p' && p.type !== 'k') v += VALUE[p.type]
  return v
}

function material(chess: Chess, c: Color): number {
  let v = 0
  for (const row of chess.board()) for (const p of row) if (p && p.color === c && p.type !== 'k') v += VALUE[p.type]
  return v
}

export function phaseOf(chess: Chess): GamePhase {
  if (pieceValue(chess) <= 14) return 'end'
  const fullmove = Number(chess.fen().split(' ')[5] ?? 1)
  if (fullmove <= 10) {
    const home = (['w', 'b'] as Color[]).reduce((n, c) => n + HOME_MINORS[c].filter((s) => chess.get(s)?.color === c && isMinor(chess.get(s))).length, 0)
    if (home >= 3) return 'opening'
  }
  return 'middle'
}

function fileHasPawn(chess: Chess, file: number, color?: Color): boolean {
  for (let r = 1; r <= 8; r++) {
    const p = chess.get(`${FILES[file]}${r}` as Square)
    if (p?.type === 'p' && (!color || p.color === color)) return true
  }
  return false
}

function kingSquare(chess: Chess, c: Color): Square | undefined {
  return chess.board().flat().find((p) => p?.type === 'k' && p.color === c)?.square
}

/** Pedoni passati di `c`: davanti non hanno pedoni avversari né sulla stessa colonna né su quelle vicine. */
function passedPawns(chess: Chess, c: Color): Square[] {
  const out: Square[] = []
  const opp = opposite(c)
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p || p.type !== 'p' || p.color !== c) continue
      const f = FILES.indexOf(p.square[0])
      const r = Number(p.square[1])
      let blocked = false
      for (let ff = Math.max(0, f - 1); ff <= Math.min(7, f + 1) && !blocked; ff++) {
        for (let rr = r + (c === 'w' ? 1 : -1); rr >= 1 && rr <= 8; rr += c === 'w' ? 1 : -1) {
          const q = chess.get(`${FILES[ff]}${rr}` as Square)
          if (q?.type === 'p' && q.color === opp) {
            blocked = true
            break
          }
        }
      }
      if (!blocked) out.push(p.square)
    }
  }
  return out
}

/** Il pezzo leggero (cavallo/alfiere) con meno mosse: quello da far entrare in gioco. */
function laziestMinor(chess: Chess, c: Color): { square: Square; type: string; moves: number } | null {
  let worst: { square: Square; type: string; moves: number } | null = null
  // le mosse si contano per il colore indicato anche se non tocca a lui
  const fen = chess.fen().split(' ')
  fen[1] = c
  fen[3] = '-'
  let probe: Chess
  try {
    probe = new Chess(fen.join(' '))
  } catch {
    return null
  }
  for (const row of probe.board()) {
    for (const p of row) {
      if (!p || p.color !== c || (p.type !== 'n' && p.type !== 'b')) continue
      const n = probe.moves({ square: p.square }).length
      if (!worst || n < worst.moves) worst = { square: p.square, type: p.type, moves: n }
    }
  }
  return worst
}

/**
 * Cosa fare adesso, in breve: i pericoli e le occasioni di questa mossa, e due consigli adatti alla fase.
 * Non svela la mossa giusta. `chess` è la posizione con la mossa a `me`.
 */
export function adviceFor(chess: Chess, me: Color): Advice {
  const opp = opposite(me)
  const phase = phaseOf(chess)
  const urgent: AdviceLine[] = []

  const t = threatsFor(chess, me)
  if (chess.inCheck()) urgent.push({ level: 'warn', text: 'Sei sotto scacco: pàralo.' })
  else if (t.mate) urgent.push({ level: 'warn', text: `Minaccia matto con ${t.mate.san}!` })
  const mine = hangingPieces(chess, me)
  if (mine.length) urgent.push({ level: 'warn', text: `In presa: ${mine.slice(0, 3).map((h) => `${the(h.piece)} in ${h.square}`).join(', ')}.` })
  if (mateInOne(chess)) urgent.push({ level: 'ok', text: 'C’è un matto in una mossa!' })
  else {
    const theirs = hangingPieces(chess, opp).filter((h) => h.piece !== 'k')
    if (theirs.length) urgent.push({ level: 'ok', text: `Puoi attaccare ${the(theirs[0].piece)} in ${theirs[0].square}.` })
  }
  if (urgent.length === 0) urgent.push({ level: 'ok', text: 'Nessuna minaccia e nessun tuo pezzo in presa.' })

  const tips: AdviceTip[] = []
  const diff = material(chess, me) - material(chess, opp)
  if (phase === 'opening') {
    const centre = (['d4', 'e4', 'd5', 'e5'] as Square[]).filter((s) => chess.get(s)?.type === 'p' && chess.get(s)?.color === me).length
    const homeLeft = HOME_MINORS[me].filter((s) => chess.get(s)?.color === me && isMinor(chess.get(s)))
    const rights = chess.getCastlingRights(me)
    if (centre === 0) tips.push({ key: 'Centro', text: 'Occupa il centro con un pedone (e4/d4).', why: 'Dal centro i pezzi controllano più case e arrivano ovunque in fretta.' })
    if (homeLeft.length >= 2) tips.push({ key: 'Sviluppo', text: `Fai uscire i pezzi leggeri (ancora a casa: ${homeLeft.join(', ')}).`, why: 'Più pezzi in gioco di te che di lui = più forza dove si combatte. Non muovere due volte lo stesso pezzo.' })
    if ((rights.k || rights.q) && tips.length < 2) tips.push({ key: 'Arrocco', text: 'Arrocca presto.', why: 'Il re al centro è facile da attaccare; arroccando si mette al sicuro e la torre entra in gioco.' })
  } else if (phase === 'middle') {
    const ks = kingSquare(chess, me)
    const rights = chess.getCastlingRights(me)
    if (ks && (rights.k || rights.q) && (ks === 'e1' || ks === 'e8')) tips.push({ key: 'Re', text: 'Il re è ancora al centro: arrocca.', why: 'Quando si aprono le colonne il re al centro diventa un bersaglio.' })
    const lazy = laziestMinor(chess, me)
    if (lazy && lazy.moves <= 3) tips.push({ key: 'Attività', text: `Migliora ${the(lazy.type)} in ${lazy.square} (ha solo ${lazy.moves} mosse).`, why: 'Il tuo pezzo più passivo è quello che conviene far lavorare: ogni mossa deve rendere un pezzo più utile.' })
    const rooks = chess.board().flat().filter((p) => p?.type === 'r' && p.color === me) as { square: Square }[]
    const openFile = [...Array(8).keys()].find((f) => !fileHasPawn(chess, f))
    const semi = [...Array(8).keys()].find((f) => !fileHasPawn(chess, f, me) && fileHasPawn(chess, f, opp))
    const target = openFile ?? semi
    if (target !== undefined && rooks.length && !rooks.some((r) => FILES.indexOf(r.square[0]) === target)) {
      tips.push({ key: 'Torri', text: `Torre sulla colonna ${FILES[target]} (${openFile !== undefined ? 'aperta' : 'semiaperta'}).`, why: 'Le torri sono forti dove non ci sono pedoni in mezzo: da lì entrano nel campo avversario.' })
    }
    if (diff >= 3) tips.push({ key: 'Scambi', text: 'Sei avanti: scambia i pezzi.', why: 'Con meno pezzi il vantaggio di materiale pesa di più e l’avversario ha meno trucchi.' })
    else if (diff <= -3) tips.push({ key: 'Complica', text: 'Sei indietro: evita gli scambi, cerca tattiche.', why: 'Scambiando resti con meno materiale e basta; le complicazioni portano errori.' })
    else if (tips.length === 0) tips.push({ key: 'Piano', text: 'Scegli un piano: un pezzo da migliorare o un punto debole da attaccare.', why: 'Muovere a caso regala tempo all’avversario; ogni mossa dovrebbe servire a qualcosa.' })
  } else {
    const ks = kingSquare(chess, me)
    const myP = passedPawns(chess, me)
    const theirP = passedPawns(chess, opp)
    if (ks) {
      const d = Math.max(Math.abs(FILES.indexOf(ks[0]) - 3.5), Math.abs(Number(ks[1]) - 4.5))
      if (d > 2) tips.push({ key: 'Re', text: 'Porta il re verso il centro.', why: 'Nel finale non ci sono più matti facili: il re diventa un pezzo d’attacco.' })
    }
    if (myP.length) tips.push({ key: 'Passato', text: `Spingi il pedone passato in ${myP[0]}, con il re vicino.`, why: 'Un pedone passato nessuno lo può fermare coi pedoni: costringe l’avversario a difenderlo.' })
    if (theirP.length) tips.push({ key: 'Fermalo', text: `Blocca il pedone passato in ${theirP[0]}.`, why: 'Un pedone passato lasciato libero arriva a promuovere.' })
    if (tips.length === 0)
      tips.push(
        diff <= -3
          ? { key: 'Patta', text: 'Sei indietro: cerca la patta (re attivo).', why: 'Un re attivo e le torri attive spesso salvano finali peggiori.' }
          : { key: 'Pedoni', text: 'Crea un pedone passato o attacca i pedoni deboli.', why: 'Nel finale vince spesso chi arriva a promuovere per primo.' },
      )
  }

  const phaseLabel = phase === 'opening' ? 'Apertura' : phase === 'middle' ? 'Mediogioco' : 'Finale'
  return { phase, phaseLabel, urgent, tips: tips.slice(0, 2) }
}
