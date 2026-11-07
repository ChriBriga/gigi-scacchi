import type { GigiMemory, NotebookItem, Progress, SyncedSettings } from '../store'
import type { GameRecord } from '../engine/mistakes'

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

/** Il quaderno: unione per posizione (vince la versione modificata più di recente); gli errori imparati restano fuori. */
function mergeNotebook(a: Progress, b: Progress): Pick<Progress, 'notebook' | 'notebookGone'> {
  const gone = union(a.notebookGone, b.notebookGone)
  const byId = new Map<string, NotebookItem>()
  for (const it of [...(a.notebook ?? []), ...(b.notebook ?? [])]) {
    if (gone.includes(it.id)) continue
    const cur = byId.get(it.id)
    if (!cur || it.upd > cur.upd) byId.set(it.id, it)
  }
  return { notebook: [...byId.values()].sort((x, y) => x.added.localeCompare(y.added)).slice(-100), notebookGone: gone.slice(-300) }
}

/** Lo storico delle partite: unione per id (la stessa partita non si conta due volte), le più recenti restano. */
function mergeHistory(a: GameRecord[] = [], b: GameRecord[] = []): GameRecord[] {
  const byId = new Map<number, GameRecord>()
  for (const g of [...a, ...b]) byId.set(g.id, g)
  return [...byId.values()].sort((x, y) => x.id - y.id).slice(-60)
}

/** La memoria di Gigi: i contatori più alti vincono, la "ultima partita" è la più recente. */
function mergeGigi(a: GigiMemory = { record: {}, firsts: [] }, b: GigiMemory = { record: {}, firsts: [] }): GigiMemory {
  const lastGame = !a.lastGame ? b.lastGame : !b.lastGame ? a.lastGame : a.lastGame.day >= b.lastGame.day ? a.lastGame : b.lastGame
  return {
    lastGame,
    record: maxByKey(a.record, b.record, (x, y) => ({ w: Math.max(x.w, y.w), l: Math.max(x.l, y.l), d: Math.max(x.d, y.d) })),
    firsts: union(a.firsts, b.firsts),
  }
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
      train: a.today.train || b.today.train,
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
    // dopo un "azzeramento" dei puzzle visti vince il ciclo più recente, altrimenti l'altro dispositivo lo annullerebbe
    puzzleCycle: Math.max(a.puzzleCycle ?? 0, b.puzzleCycle ?? 0),
    puzzleSeen:
      (a.puzzleCycle ?? 0) === (b.puzzleCycle ?? 0) ? union(a.puzzleSeen, b.puzzleSeen) : (a.puzzleCycle ?? 0) > (b.puzzleCycle ?? 0) ? a.puzzleSeen : b.puzzleSeen,
    cleanGames: Math.max(a.cleanGames ?? 0, b.cleanGames ?? 0),
    // finali superati: li unisce tutti, con il record migliore (meno mosse)
    drills: maxByKey(a.drills, b.drills, (x, y) => Math.min(x, y)),
    ...mergeNotebook(a, b),
    gigi: mergeGigi(a.gigi, b.gigi),
    history: mergeHistory(a.history, b.history),
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
