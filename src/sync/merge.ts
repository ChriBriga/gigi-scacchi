import type { Progress, SyncedSettings } from '../store'

export interface CloudDoc {
  progress: Progress
  settings: SyncedSettings
}

const union = <T,>(a: T[] = [], b: T[] = []): T[] => [...new Set([...a, ...b])]

function maxByKey<V>(a: Record<string, V> = {}, b: Record<string, V> = {}, pick: (x: V, y: V) => V): Record<string, V> {
  const out: Record<string, V> = { ...a }
  for (const [k, v] of Object.entries(b)) out[k] = k in out ? pick(out[k], v) : v
  return out
}

/**
 * Unisce i progressi di due dispositivi senza perdere nulla di importante:
 * contatori = il più alto, liste = unione, serie di giorni = quella più recente.
 */
export function mergeProgress(a: Progress, b: Progress): Progress {
  const newer = (a.modified ?? 0) >= (b.modified ?? 0) ? a : b
  const laterDay = a.lastActiveDay === b.lastActiveDay ? (a.streak >= b.streak ? a : b) : a.lastActiveDay > b.lastActiveDay ? a : b

  let today = a.today
  if (a.today.day === b.today.day) {
    today = {
      day: a.today.day,
      lesson: a.today.lesson || b.today.lesson,
      puzzles: Math.max(a.today.puzzles, b.today.puzzles),
      game: a.today.game || b.today.game,
    }
  } else if (b.today.day > a.today.day) today = b.today

  return {
    placementDone: a.placementDone || b.placementDone,
    skill: newer.skill,
    xp: Math.max(a.xp, b.xp),
    streak: laterDay.streak,
    lastActiveDay: laterDay.lastActiveDay,
    lessonsDone: union(a.lessonsDone, b.lessonsDone),
    puzzlesSolved: Math.max(a.puzzlesSolved, b.puzzlesSolved),
    puzzleStats: maxByKey(a.puzzleStats, b.puzzleStats, (x, y) => ({ ok: Math.max(x.ok, y.ok), fail: Math.max(x.fail, y.fail) })),
    puzzleSeen: union(a.puzzleSeen, b.puzzleSeen),
    games: Math.max(a.games, b.games),
    wins: Math.max(a.wins, b.wins),
    botsBeaten: union(a.botsBeaten, b.botsBeaten),
    mistakeTags: maxByKey(a.mistakeTags, b.mistakeTags, (x, y) => Math.max(x, y)),
    today,
    modified: Math.max(a.modified ?? 0, b.modified ?? 0),
  }
}

/** Le impostazioni seguono il dispositivo usato più di recente. */
export function mergeDoc(local: CloudDoc, remote: CloudDoc): CloudDoc {
  const localNewer = (local.progress.modified ?? 0) >= (remote.progress.modified ?? 0)
  return {
    progress: mergeProgress(local.progress, remote.progress),
    settings: localNewer ? local.settings : { ...local.settings, ...remote.settings },
  }
}
