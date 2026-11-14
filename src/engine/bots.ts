import { Chess, type PieceSymbol } from 'chess.js'
import { UciEngine } from './uci'
import { toast } from '../ui/Toast'
import { candidateWeights, pickIndex, type StyleId } from './style'

export interface Bot {
  /** identità stabile: salvata nei progressi, non va mai cambiata */
  id: number
  /** posizione nella scala di difficoltà (1 = il più facile); da qui vengono i punti (vedi botPoints) e il gruppo */
  rank: number
  name: string
  tagline: string
  /** come gioca: una preferenza fra mosse quasi equivalenti (vedi style.ts), non un copione */
  style: StyleId
  /** pezzo preferito: muoverlo piace un po' di più al bot */
  pet?: PieceSymbol
  depth: number
  multipv: number
  /** più è alto, più sbaglia (in centipawn) */
  temp: number
  /** probabilità di muovere a caso */
  randomChance: number
  movetime: number
}

/**
 * La scala degli avversari, dal più facile al più forte. I primi 8 sono quelli storici (id 1-8);
 * gli altri (id 9-16) sono stati inseriti nei gradini intermedi, soprattutto dove si gioca di più.
 */
export const BOTS: Bot[] = [
  { id: 1, rank: 1, name: 'Pedone Pigro', tagline: 'Muove a caso e si dimentica pure cosa sta facendo.', style: 'balanced', depth: 1, multipv: 6, temp: 500, randomChance: 0.4, movetime: 100 },
  { id: 2, rank: 2, name: 'Nonna Gertrude', tagline: 'Dolce, ma ti frega con la torta e col matto.', style: 'tactical', depth: 1, multipv: 5, temp: 260, randomChance: 0.18, movetime: 100 },
  { id: 9, rank: 3, name: 'Cuoco Cosimo', tagline: 'Cucina trappole al sugo. Ogni tanto brucia il re.', style: 'tactical', depth: 1, multipv: 5, temp: 215, randomChance: 0.12, movetime: 120 },
  { id: 3, rank: 4, name: 'Tony il Cavallo', tagline: 'Salta ovunque. A volte ha pure un piano.', style: 'balanced', pet: 'n', depth: 2, multipv: 5, temp: 170, randomChance: 0.07, movetime: 150 },
  { id: 10, rank: 5, name: 'Skater Sasha', tagline: 'Fa mosse spericolate in monopattino e atterra (quasi) sempre in piedi.', style: 'aggressive', depth: 2, multipv: 5, temp: 150, randomChance: 0.05, movetime: 150 },
  { id: 11, rank: 6, name: 'Detective Dino', tagline: 'Indaga sulle tue mosse. Di solito sbaglia colpevole.', style: 'tactical', depth: 3, multipv: 4, temp: 128, randomChance: 0.04, movetime: 180 },
  { id: 4, rank: 7, name: 'Alfiere Ale', tagline: 'Diagonale per vocazione, prudente per sbaglio.', style: 'solid', pet: 'b', depth: 3, multipv: 4, temp: 110, randomChance: 0.03, movetime: 200 },
  { id: 12, rank: 8, name: 'Astronauta Ada', tagline: 'Pensa in orbita: lontanissima dalle tue idee, vicinissima al tuo re.', style: 'aggressive', depth: 3, multipv: 4, temp: 95, randomChance: 0.02, movetime: 230 },
  { id: 13, rank: 9, name: 'Mago Merlo', tagline: 'Fa sparire i pezzi. Soprattutto i suoi.', style: 'tactical', depth: 4, multipv: 4, temp: 80, randomChance: 0.01, movetime: 260 },
  { id: 5, rank: 10, name: 'Torre di Controllo', tagline: 'Pochi errori, tanta pazienza.', style: 'solid', pet: 'r', depth: 5, multipv: 4, temp: 65, randomChance: 0, movetime: 300 },
  { id: 14, rank: 11, name: 'Vichinga Vera', tagline: 'Conquista il centro e non fa prigionieri.', style: 'positional', depth: 6, multipv: 3, temp: 52, randomChance: 0, movetime: 380 },
  { id: 15, rank: 12, name: 'Barone Von Scacco', tagline: 'Elegante, gentile, spietato nei finali.', style: 'positional', depth: 7, multipv: 3, temp: 45, randomChance: 0, movetime: 440 },
  { id: 6, rank: 13, name: 'Lady Matta', tagline: 'Attacca sempre. Se la fermi, ti sorride.', style: 'aggressive', depth: 8, multipv: 3, temp: 38, randomChance: 0, movetime: 500 },
  { id: 16, rank: 14, name: 'Sfinge Serafina', tagline: 'Ti pone enigmi. La risposta è quasi sempre scacco.', style: 'aggressive', depth: 9, multipv: 3, temp: 30, randomChance: 0, movetime: 600 },
  { id: 7, rank: 15, name: 'Il Professore', tagline: 'Ha letto tutti i libri. Anche quelli che non esistono.', style: 'positional', depth: 11, multipv: 3, temp: 20, randomChance: 0, movetime: 800 },
  { id: 8, rank: 16, name: 'Re Stoccafisso', tagline: 'Il boss finale. Non fa regali.', style: 'solid', depth: 14, multipv: 2, temp: 8, randomChance: 0, movetime: 1200 },
]

export const botById = (id: number): Bot | undefined => BOTS.find((b) => b.id === id)
export const botByRank = (rank: number): Bot => BOTS[Math.max(1, Math.min(BOTS.length, Math.round(rank))) - 1]
export const rankOfId = (id: number): number => botById(id)?.rank ?? 0
/**
 * I punti di forza di un bot sulla scala interna dell'app (400-1900, cento per gradino).
 * Non sono un Elo vero: servono a far salire e scendere il punteggio del giocatore.
 */
export const botPoints = (b: Bot): number => 300 + b.rank * 100

/** La scala divisa in quattro gruppi da quattro: l'ultimo di ogni gruppo è il boss. */
export const BOT_GROUPS: { name: string; blurb: string; bots: Bot[] }[] = [
  { name: 'Il parco', blurb: 'Per cominciare: sbagliano spesso, basta non regalare pezzi.' },
  { name: 'Il circolo', blurb: 'Qui le sviste si pagano quasi sempre.' },
  { name: 'I maestri', blurb: 'Pochi errori: serve un piano, non solo attenzione.' },
  { name: 'Le leggende', blurb: 'Il gradino più alto. Non fanno regali.' },
].map((g, i) => ({ ...g, bots: BOTS.slice(i * 4, i * 4 + 4) }))
export const isBoss = (b: Bot): boolean => b.rank % 4 === 0

/** L'avversario consigliato per un certo livello di abilità (0-100). */
export function recommendedBot(skill: number): Bot {
  return botByRank(Math.round(skill / 6.2))
}

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

  let res
  try {
    // chi ha uno stile guarda qualche mossa in più: la preferenza si esercita fra le candidate
    const styled = bot.style !== 'balanced' || !!bot.pet
    const opts = { depth: bot.depth, multipv: styled ? Math.max(bot.multipv, 4) : bot.multipv, movetime: bot.movetime }
    try {
      res = await getBotEngine().search(fen, opts)
    } catch {
      // il motore si riavvia da solo alla ricerca dopo: un secondo tentativo, con un avviso
      toast('Il motore non risponde. Riprovo…', 'bad')
      res = await getBotEngine().search(fen, opts)
    }
  } catch {
    // motore ancora in panne: il bot gioca a caso piuttosto che bloccare la partita
    toast('Il motore non parte: l’avversario muove a caso. Prova a ricaricare la pagina.', 'bad', 6000)
    const m = legal[Math.floor(Math.random() * legal.length)]
    return m.from + m.to + (m.promotion ?? '')
  }
  const lines = res.lines.filter((l) => l.pv.length > 0)
  if (lines.length === 0) return res.bestmove
  const weights = candidateWeights(
    fen,
    lines.map((l) => ({ cp: l.cp, move: l.pv[0] })),
    { temp: bot.temp, style: bot.style, pet: bot.pet },
  )
  return lines[pickIndex(weights)].pv[0]
}
