import { GIGI } from './voices/gigi'

export type Tone = 'gentle' | 'spicy' | 'ruthless'

export type CoachEvent =
  // giudizio delle mosse
  | 'brilliant'
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'hanging'
  | 'missedFree'
  // fine partita, puzzle, lezioni
  | 'win'
  | 'lose'
  | 'draw'
  | 'start'
  | 'puzzleOk'
  | 'puzzleFail'
  | 'lessonDone'
  // momenti particolari in partita
  | 'nonsense'
  | 'queenTake'
  | 'castle'
  | 'promote'
  | 'check'
  | 'retract'
  | 'idleNap'
  | 'thinking'
  | 'firstWin'
  | 'botBeaten'
  // Gigi punzecchiato nella Home
  | 'poke'
  | 'pokeMany'
  // saluti della Home
  | 'greetNew'
  | 'greetMorning'
  | 'greetAfternoon'
  | 'greetEvening'
  | 'greetNight'
  | 'greetBack'
  | 'greetStreak'
  | 'greetWonLast'
  | 'greetLostLast'
  | 'greetRetracts'

export type Mood = 'happy' | 'neutral' | 'angry' | 'shocked' | 'cool' | 'confused' | 'sleepy' | 'sad' | 'thinking' | 'smug'

export const EVENT_MOOD: Record<CoachEvent, Mood> = {
  brilliant: 'shocked',
  best: 'cool',
  good: 'happy',
  inaccuracy: 'smug',
  mistake: 'angry',
  blunder: 'angry',
  hanging: 'shocked',
  missedFree: 'confused',
  win: 'happy',
  lose: 'sad',
  draw: 'neutral',
  start: 'cool',
  puzzleOk: 'happy',
  puzzleFail: 'confused',
  lessonDone: 'happy',
  nonsense: 'confused',
  queenTake: 'happy',
  castle: 'smug',
  promote: 'happy',
  check: 'smug',
  retract: 'neutral',
  idleNap: 'sleepy',
  thinking: 'thinking',
  firstWin: 'happy',
  botBeaten: 'happy',
  poke: 'happy',
  pokeMany: 'angry',
  greetNew: 'cool',
  greetMorning: 'cool',
  greetAfternoon: 'cool',
  greetEvening: 'cool',
  greetNight: 'sleepy',
  greetBack: 'sad',
  greetStreak: 'happy',
  greetWonLast: 'smug',
  greetLostLast: 'neutral',
  greetRetracts: 'smug',
}

/** Tutte le battute di un coach: per ogni evento e per ogni tono, un mazzo di frasi. */
export type Voice = Record<CoachEvent, Record<Tone, string[]>>

/**
 * Segnaposto: {pezzo} = "il cavallo", {Pezzo} = "Il cavallo", {sq} = "f3",
 * {bot} = nome dell'avversario, {n} = un numero (giorni, ritiri…).
 */
export interface LineVars {
  piece?: string
  sq?: string
  bot?: string
  n?: number
}

export function pieceWithArticle(type: string): string {
  switch (type) {
    case 'p': return 'il pedone'
    case 'n': return 'il cavallo'
    case 'b': return "l'alfiere"
    case 'r': return 'la torre'
    case 'q': return 'la regina'
    default: return 'il re'
  }
}

/* ---------------------------------------------------------------
   Memoria delle ultime frasi dette: così Gigi non si ripete
   (nemmeno dopo aver chiuso e riaperto l'app).
   --------------------------------------------------------------- */
const RECENT_KEY = 'gigi-lines-recent'
let recent: Record<string, number[]> | null = null

function loadRecent(): Record<string, number[]> {
  if (recent) return recent
  try {
    recent = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '{}') as Record<string, number[]>
  } catch {
    recent = {}
  }
  return recent
}

function saveRecent() {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(recent))
  } catch {
    /* pazienza: al massimo si ripete */
  }
}

/** Sceglie una frase a caso evitando quelle usate da poco. */
function pick(key: string, pool: string[]): string {
  if (pool.length === 0) return ''
  if (pool.length === 1) return pool[0]
  const mem = loadRecent()
  const used = mem[key] ?? []
  const keep = Math.min(pool.length - 1, Math.max(3, Math.floor(pool.length * 0.6)))
  let candidates = pool.map((_, i) => i).filter((i) => !used.includes(i))
  if (candidates.length === 0) candidates = pool.map((_, i) => i)
  const idx = candidates[Math.floor(Math.random() * candidates.length)]
  mem[key] = [idx, ...used.filter((i) => i !== idx)].slice(0, keep)
  saveRecent()
  return pool[idx]
}

export function sayLine(event: CoachEvent, tone: Tone, vars: LineVars = {}): string {
  const line = pick(`${event}:${tone}`, GIGI[event]?.[tone] ?? [])
  const the = vars.piece ? pieceWithArticle(vars.piece) : 'il pezzo'
  return line
    .replaceAll('{Pezzo}', the.charAt(0).toUpperCase() + the.slice(1))
    .replaceAll('{pezzo}', the)
    .replaceAll('{sq}', vars.sq ?? '')
    .replaceAll('{bot}', vars.bot ?? 'il bot')
    .replaceAll('{n}', String(vars.n ?? ''))
}
