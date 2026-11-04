import { useSyncExternalStore } from 'react'
import type { Tone } from './coach/lines'
import type { ThemeId } from './themes'
import type { Outfit } from './coach/outfits'

export type DangerMode = 'off' | 'threats' | 'full'

export interface Settings {
  theme: ThemeId
  tone: Tone
  danger: DangerMode
  sound: boolean
  geminiKey: string
  /** giudica ogni mossa durante la partita */
  liveJudging: boolean
  /** accessori indossati da Gigi */
  outfit: Outfit
}

export interface DayLog {
  day: string
  lesson: boolean
  puzzles: number
  game: boolean
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
  /** conteggio errori per categoria (es. "pezzo in presa") */
  mistakeTags: Record<string, number>
  today: DayLog
  /** ultima modifica locale (ms): serve alla sincronizzazione per capire chi è più recente */
  modified?: number
}

/** Impostazioni che viaggiano con la sincronizzazione (la chiave Gemini no, resta solo sul dispositivo). */
export type SyncedSettings = Pick<Settings, 'theme' | 'tone' | 'danger' | 'sound' | 'liveJudging' | 'outfit'>
export const pickSynced = (s: Settings): SyncedSettings => ({ theme: s.theme, tone: s.tone, danger: s.danger, sound: s.sound, liveJudging: s.liveJudging, outfit: s.outfit })

export interface AppState {
  settings: Settings
  progress: Progress
}

const KEY = 'gigi-scacchi-v1'

export const todayStr = () => new Date().toLocaleDateString('sv-SE')

const emptyDay = (): DayLog => ({ day: todayStr(), lesson: false, puzzles: 0, game: false })

const defaults = (): AppState => ({
  settings: { theme: 'notte', tone: 'spicy', danger: 'threats', sound: true, geminiKey: '', liveJudging: true, outfit: {} },
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

export function nudgeSkill(delta: number) {
  update((s) => {
    s.progress.skill = Math.max(0, Math.min(100, s.progress.skill + delta))
  })
}

export function exportCode(): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify({ progress: state.progress }))))
}

export function importCode(code: string): boolean {
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(code.trim())))) as { progress: Progress }
    if (!parsed.progress) return false
    update((s) => {
      s.progress = { ...s.progress, ...parsed.progress }
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
