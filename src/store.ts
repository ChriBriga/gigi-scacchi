import { useSyncExternalStore } from 'react'
import type { Tone } from './coach/lines'
import type { ThemeId } from './themes'
import type { Outfit } from './coach/outfits'
import type { Quality } from './engine/analysis'
import { activeCoach, type CoachId } from './coach/coaches'
import { mergeProgress } from './sync/merge'
import type { GameRecord } from './engine/mistakes'

export type DangerMode = 'off' | 'threats' | 'full'

/** Come si gioca una partita: con gli aiuti, senza poter ritirare, o in silenzio fino alla fine. */
export type GameMode = 'training' | 'nonet' | 'tournament'
export const GAME_MODES: { id: GameMode; name: string; blurb: string; medal: 1 | 2 | 3; medalName: string }[] = [
  { id: 'training', name: 'Allenamento', blurb: 'Il coach ti avvisa e puoi ritirare la mossa. Aiuti a disposizione.', medal: 1, medalName: 'di bronzo' },
  { id: 'nonet', name: 'Senza rete', blurb: 'Il coach ti dice se sbagli, ma la mossa resta. Niente aiuti.', medal: 2, medalName: 'd’argento' },
  { id: 'tournament', name: 'Torneo', blurb: 'Silenzio totale, niente barra né aiuti. Se ne parla alla fine.', medal: 3, medalName: 'd’oro' },
]
export const gameModeInfo = (m: GameMode) => GAME_MODES.find((x) => x.id === m) ?? GAME_MODES[0]

export interface Settings {
  theme: ThemeId
  tone: Tone
  danger: DangerMode
  sound: boolean
  geminiKey: string
  /** giudica ogni mossa durante la partita */
  liveJudging: boolean
  /** barra di valutazione accanto alla scacchiera (resta sul dispositivo) */
  evalBar: boolean
  /** accessori indossati da Gigi */
  outfit: Outfit
  /** accessori degli altri coach (Gigi usa `outfit`) */
  outfits: Partial<Record<CoachId, Outfit>>
  /** colori della scacchiera ('tema' = quelli del tema) */
  board: string
  /** set di pezzi */
  pieces: string
  /** vibrazione sul telefono (resta sul dispositivo, non si sincronizza) */
  haptics: boolean
  /** volume dei suoni 0-1 (resta sul dispositivo; `sound` false = muto) */
  volume: number
  /** nome mostrato nel profilo (vuoto = quello dell'account Google) */
  nickname: string
  /** avatar scelto: 'gigi', 'google', 'piece:wN', 'bot:3', 'coach:gufo' */
  avatar: string
  /** il coach che ti parla (se non è sbloccato si usa Gigi) */
  coach: CoachId
  /** l'ultimo modo di gioco scelto (resta sul dispositivo) */
  gameMode: GameMode
}

/** Un errore tuo segnato sul quaderno: torna come esercizio a intervalli crescenti finché non lo hai imparato. */
export interface NotebookItem {
  /** la posizione (senza contatori delle mosse): un errore per posizione */
  id: string
  /** posizione prima della mossa sbagliata, tocca a `color` */
  fen: string
  color: 'w' | 'b'
  best: string
  played: string
  playedSan: string
  tag: string
  added: string
  /** livello di apprendimento 0-4; superato il 4 l'errore esce dal quaderno */
  box: number
  /** giorno da cui torna da ripassare */
  due: string
  ok: number
  fail: number
  /** ultima modifica (ms), serve alla sincronizzazione */
  upd: number
  j: { quality: Quality; loss: number; cpAfter: number; missedMate?: boolean }
}

/** Cosa Gigi si ricorda di te: serve per saluti e battute personalizzate. */
export interface GigiMemory {
  lastGame?: { day: string; bot: number; outcome: 'win' | 'lose' | 'draw'; retracts: number; blunders: number }
  /** vittorie, sconfitte e patte contro ogni bot (chiave = id del bot) */
  record: Record<string, { w: number; l: number; d: number }>
  /** prime volte già celebrate (es. 'firstWin') */
  firsts: string[]
}

export interface DayLog {
  day: string
  lesson: boolean
  puzzles: number
  game: boolean
  /** finale superato o errore del quaderno ripassato oggi: è il terzo passo dell'allenamento */
  train?: boolean
}

export interface Progress {
  placementDone: boolean
  /** stima interna 0-100, non mostrata come numero */
  skill: number
  xp: number
  streak: number
  lastActiveDay: string
  lessonsDone: string[]
  puzzlesSolved: number
  puzzleStats: Record<string, { ok: number; fail: number }>
  puzzleSeen: string[]
  games: number
  wins: number
  botsBeaten: number[]
  /** la medaglia migliore contro ogni bot (chiave = id del bot): 1 bronzo (Allenamento), 2 argento (Senza rete), 3 oro (Torneo) */
  medals?: Record<string, number>
  /** il punteggio del giocatore sulla scala dei bot: si muove solo con le partite Senza rete e Torneo (assente = ancora stimato) */
  rating?: number
  /** quante partite hanno già mosso il punteggio */
  ratedGames?: number
  /** conteggio errori per categoria (es. "pezzo in presa") */
  mistakeTags: Record<string, number>
  /** quante volte i puzzle sono stati "azzerati" dopo averli visti tutti (serve alla sincronizzazione) */
  puzzleCycle?: number
  /** partite giocate senza ritirare nessuna mossa */
  cleanGames?: number
  /** finali superati: id del finale -> meno mosse con cui ci sei riuscito */
  drills?: Record<string, number>
  /** il quaderno degli errori */
  notebook?: NotebookItem[]
  /** errori del quaderno ormai imparati (servono perché la sincronizzazione non li faccia tornare) */
  notebookGone?: string[]
  gigi?: GigiMemory
  /** le ultime partite in piccolo (precisione, tipi di errore): servono a "Il tuo punto debole" */
  history?: GameRecord[]
  today: DayLog
  /** ultima modifica locale (ms): serve alla sincronizzazione per capire chi è più recente */
  modified?: number
}

/** Impostazioni che viaggiano con la sincronizzazione (la chiave Gemini no, resta solo sul dispositivo). */
export type SyncedSettings = Pick<Settings, 'theme' | 'tone' | 'danger' | 'sound' | 'liveJudging' | 'outfit' | 'outfits' | 'board' | 'pieces' | 'nickname' | 'avatar' | 'coach'>
export const pickSynced = (s: Settings): SyncedSettings => ({
  theme: s.theme,
  tone: s.tone,
  danger: s.danger,
  sound: s.sound,
  liveJudging: s.liveJudging,
  outfit: s.outfit,
  outfits: s.outfits ?? {},
  board: s.board,
  pieces: s.pieces,
  nickname: s.nickname,
  avatar: s.avatar,
  coach: s.coach,
})

/** Il coach attivo adesso (leggibile anche fuori da React, per scegliere le battute). */
export const currentCoach = (): CoachId => activeCoach(state.settings, state.progress)

export interface AppState {
  settings: Settings
  progress: Progress
}

const KEY = 'gigi-scacchi-v1'

export const todayStr = () => new Date().toLocaleDateString('sv-SE')

const emptyDay = (): DayLog => ({ day: todayStr(), lesson: false, puzzles: 0, game: false })

const defaults = (): AppState => ({
  settings: { theme: 'notte', tone: 'spicy', danger: 'threats', sound: true, geminiKey: '', liveJudging: true, evalBar: true, outfit: {}, outfits: {}, board: 'tema', pieces: 'classico', haptics: true, volume: 0.7, nickname: '', avatar: 'gigi', coach: 'gigi', gameMode: 'training' },
  progress: {
    placementDone: false,
    skill: 10,
    xp: 0,
    streak: 0,
    lastActiveDay: '',
    lessonsDone: [],
    puzzlesSolved: 0,
    puzzleStats: {},
    puzzleSeen: [],
    games: 0,
    wins: 0,
    botsBeaten: [],
    mistakeTags: {},
    puzzleCycle: 0,
    gigi: { record: {}, firsts: [] },
    today: emptyDay(),
  },
})

function load(): AppState {
  const d = defaults()
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return d
    const parsed = JSON.parse(raw) as Partial<AppState>
    const s: AppState = {
      settings: { ...d.settings, ...parsed.settings },
      progress: { ...d.progress, ...parsed.progress },
    }
    if (s.progress.today.day !== todayStr()) s.progress.today = emptyDay()
    return s
  } catch {
    return d
  }
}

let state: AppState = load()
const listeners = new Set<() => void>()

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* modalità privata o storage pieno: pazienza */
  }
}

export function update(fn: (s: AppState) => AppState | void) {
  const next = structuredClone(state)
  const r = fn(next)
  state = r ?? next
  state.progress.modified = Date.now()
  persist()
  listeners.forEach((l) => l())
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** Applica i dati arrivati dal cloud senza segnarli come modifica locale. */
export function applySynced(progress: Progress, settings: SyncedSettings) {
  const p = { ...progress }
  if (p.today.day !== todayStr()) p.today = emptyDay()
  state = { settings: { ...state.settings, ...settings }, progress: p }
  persist()
  listeners.forEach((l) => l())
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => state,
  )
}

/**
 * Come useApp, ma ridisegna il componente solo quando cambia il valore scelto.
 * Il selettore deve restituire un valore semplice (stringa, numero, booleano): non un oggetto nuovo a ogni chiamata.
 */
export function useAppSelector<T extends string | number | boolean | undefined>(select: (s: AppState) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => select(state),
  )
}

export function getState(): AppState {
  return state
}

/** Segna l'attività di oggi e aggiorna la serie di giorni consecutivi. */
export function touchDay(p: Progress) {
  const t = todayStr()
  if (p.today.day !== t) p.today = emptyDay()
  if (p.lastActiveDay === t) return
  const y = new Date()
  y.setDate(y.getDate() - 1)
  p.streak = p.lastActiveDay === y.toLocaleDateString('sv-SE') ? p.streak + 1 : 1
  p.lastActiveDay = t
}

export function addXp(n: number) {
  update((s) => {
    touchDay(s.progress)
    s.progress.xp += n
  })
}

export function bumpMistake(tag: string) {
  update((s) => {
    s.progress.mistakeTags[tag] = (s.progress.mistakeTags[tag] ?? 0) + 1
  })
}

/** Quante partite si ricordano per le statistiche. */
export const HISTORY_MAX = 60

export function addGameRecord(rec: GameRecord) {
  update((s) => {
    const list = (s.progress.history ??= [])
    if (list.some((g) => g.id === rec.id)) return
    list.push(rec)
    list.sort((a, b) => a.id - b.id)
    if (list.length > HISTORY_MAX) list.splice(0, list.length - HISTORY_MAX)
  })
}

/** Il punteggio da mostrare: quello vero se hai già giocato partite che contano, altrimenti una stima dal livello. */
export const ratingOf = (p: Progress): number => Math.round(p.rating ?? 400 + p.skill * 15)

/**
 * Aggiorna il punteggio dopo una partita che conta (Senza rete o Torneo), con la formula dell'Elo:
 * battere chi ha più punti vale tanto, perdere con chi ne ha meno costa tanto. Le prime 10 partite pesano di più.
 */
export function rateGame(botPoints: number, outcome: 'win' | 'lose' | 'draw'): { before: number; after: number } {
  const p = state.progress
  const before = ratingOf(p)
  const expected = 1 / (1 + 10 ** ((botPoints - before) / 400))
  const k = (p.ratedGames ?? 0) < 10 ? 40 : 24
  const score = outcome === 'win' ? 1 : outcome === 'draw' ? 0.5 : 0
  const after = Math.max(100, Math.round(before + k * (score - expected)))
  update((s) => {
    s.progress.rating = after
    s.progress.ratedGames = (s.progress.ratedGames ?? 0) + 1
  })
  return { before, after }
}

export function nudgeSkill(delta: number) {
  update((s) => {
    s.progress.skill = Math.max(0, Math.min(100, s.progress.skill + delta))
  })
}

/** La serie di giorni che vale davvero oggi: se hai saltato ieri e oggi, è già finita. */
export function currentStreak(p: Progress): number {
  const t = todayStr()
  if (p.lastActiveDay === t) return p.streak
  const y = new Date()
  y.setDate(y.getDate() - 1)
  return p.lastActiveDay === y.toLocaleDateString('sv-SE') ? p.streak : 0
}

/** Giorni passati dall'ultima volta che hai fatto qualcosa (0 = oggi). */
export function daysAway(p: Progress): number {
  if (!p.lastActiveDay) return 0
  const a = new Date(p.lastActiveDay + 'T12:00:00').getTime()
  const b = new Date(todayStr() + 'T12:00:00').getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/**
 * Se l'app resta aperta a cavallo della mezzanotte, il "piano di oggi" riparte da zero.
 * Non conta come modifica dell'utente: non spinge nulla verso il cloud.
 */
function rolloverDay() {
  if (state.progress.today.day === todayStr()) return
  state = { ...state, progress: { ...state.progress, today: emptyDay() } }
  persist()
  listeners.forEach((l) => l())
}
if (typeof document !== 'undefined') {
  setInterval(rolloverDay, 60_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') rolloverDay()
  })
}

/* ---------------------------------------------------------------
   Quaderno degli errori
   --------------------------------------------------------------- */
const NOTEBOOK_STEPS = [1, 3, 7, 14, 30]
const NOTEBOOK_MAX = 100

const addDays = (day: string, n: number) => {
  const d = new Date(day + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('sv-SE')
}

export const notebookId = (fen: string) => fen.split(' ').slice(0, 4).join(' ')

export type NotebookDraft = Pick<NotebookItem, 'fen' | 'color' | 'best' | 'played' | 'playedSan' | 'tag' | 'j'>

/** Segna degli errori sul quaderno (uno per posizione). Restituisce quanti sono davvero nuovi. */
export function addToNotebook(drafts: NotebookDraft[]): number {
  let added = 0
  update((s) => {
    const p = s.progress
    const list = (p.notebook ??= [])
    const gone = p.notebookGone ?? []
    for (const d of drafts) {
      const id = notebookId(d.fen)
      if (list.some((x) => x.id === id) || gone.includes(id)) continue
      list.push({ ...d, id, added: todayStr(), box: 0, due: addDays(todayStr(), NOTEBOOK_STEPS[0]), ok: 0, fail: 0, upd: Date.now() })
      added += 1
    }
    if (list.length > NOTEBOOK_MAX) list.splice(0, list.length - NOTEBOOK_MAX)
  })
  return added
}

/** Registra com'è andato il ripasso di un errore: giusto = sale di livello, sbagliato = riparte da capo. */
export function resolveNotebook(id: string, ok: boolean) {
  update((s) => {
    const p = s.progress
    touchDay(p)
    p.today.train = true
    const list = p.notebook ?? []
    const it = list.find((x) => x.id === id)
    if (!it) return
    it.upd = Date.now()
    if (ok) {
      it.ok += 1
      it.box += 1
      p.xp += 4
      if (it.box >= NOTEBOOK_STEPS.length) {
        p.notebook = list.filter((x) => x.id !== id)
        p.notebookGone = [...(p.notebookGone ?? []), id].slice(-300)
        return
      }
      it.due = addDays(todayStr(), NOTEBOOK_STEPS[it.box])
    } else {
      it.fail += 1
      it.box = 0
      p.xp += 1
      it.due = addDays(todayStr(), NOTEBOOK_STEPS[0])
    }
  })
}

export const dueNotebook = (p: Progress): NotebookItem[] => (p.notebook ?? []).filter((i) => i.due <= todayStr())

/** La medaglia migliore contro un bot: 0 nessuna, 1 bronzo, 2 argento, 3 oro. Le vittorie di prima delle medaglie valgono bronzo. */
export const medalOf = (p: Progress, botId: number): number => Math.max(p.medals?.[String(botId)] ?? 0, p.botsBeaten.includes(botId) ? 1 : 0)

/** Aggiorna la memoria di Gigi a fine partita. */
export function rememberGame(botId: number, outcome: 'win' | 'lose' | 'draw', retracts: number, blunders: number, first?: string) {
  update((s) => {
    const g = (s.progress.gigi ??= { record: {}, firsts: [] })
    const r = (g.record[String(botId)] ??= { w: 0, l: 0, d: 0 })
    if (outcome === 'win') r.w += 1
    else if (outcome === 'lose') r.l += 1
    else r.d += 1
    g.lastGame = { day: todayStr(), bot: botId, outcome, retracts, blunders }
    if (first && !g.firsts.includes(first)) g.firsts.push(first)
  })
}

const toB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}
const fromB64 = (b64: string) => {
  const bin = atob(b64)
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function exportCode(): string {
  return toB64(JSON.stringify({ progress: state.progress }))
}

/** Importa un codice unendolo ai progressi di questo dispositivo (non perde nulla di più recente). */
export function importCode(code: string): boolean {
  try {
    const parsed = JSON.parse(fromB64(code.trim())) as { progress?: Progress }
    if (!parsed.progress || typeof parsed.progress !== 'object') return false
    const incoming = { ...defaults().progress, ...parsed.progress }
    update((s) => {
      s.progress = mergeProgress(s.progress, incoming)
    })
    return true
  } catch {
    return false
  }
}

export function levelName(skill: number): string {
  if (skill < 15) return 'Pivello'
  if (skill < 30) return 'Apprendista'
  if (skill < 50) return 'Giocatore di parco'
  if (skill < 70) return 'Tattico in erba'
  if (skill < 88) return 'Stratega'
  return 'Maestro del piccione'
}

/** Quanto manca al prossimo titolo di livello, da 0 a 100. */
export function levelProgress(skill: number): number {
  const edges = [0, 15, 30, 50, 70, 88, 100]
  for (let i = 0; i < edges.length - 1; i++) {
    if (skill < edges[i + 1]) return Math.round(((skill - edges[i]) / (edges[i + 1] - edges[i])) * 100)
  }
  return 100
}
