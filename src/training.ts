import type { Puzzle } from './screens/Puzzles'
import { DRILLS, type Drill } from './data/drills'
import { LESSONS, type Lesson } from './data/lessons'
import { MISTAKE_INFO, weakSpots, type MistakeKind } from './engine/mistakes'
import { dueNotebook, type Progress } from './store'

/** Il terzo passo dell'allenamento: un finale da giocare o gli errori del quaderno da ripassare. */
export type ThirdStep = { kind: 'drill'; drill: Drill; repeat: boolean } | { kind: 'notebook'; due: number }

export interface TrainingPlan {
  /** il punto debole su cui è costruito (null se le partite sono ancora troppo poche) */
  spot: MistakeKind | null
  reason: string
  lesson: Lesson
  /** true se la lezione è un ripasso (le hai già fatte tutte) */
  lessonReview: boolean
  puzzleThemes?: Puzzle['theme'][]
  puzzleTitle: string
  third: ThirdStep
}

/**
 * L'allenamento di oggi (10 minuti circa): una mini-lezione, 5 puzzle e un finale o il quaderno,
 * tutti scelti sul punto debole che emerge dalle ultime partite. Senza storico si parte dalle basi.
 */
export function trainingPlan(p: Progress): TrainingPlan {
  const history = p.history ?? []
  const spot = history.length >= 2 ? (weakSpots(history)[0]?.kind ?? null) : null
  const info = spot ? MISTAKE_INFO[spot] : null

  const spotLesson = info?.lesson ? LESSONS.find((l) => l.id === info.lesson) : undefined
  const nextUndone = LESSONS.find((l) => !p.lessonsDone.includes(l.id))
  let lesson: Lesson
  let lessonReview = false
  if (spotLesson && !p.lessonsDone.includes(spotLesson.id)) lesson = spotLesson
  else if (nextUndone) lesson = nextUndone
  else {
    lessonReview = true
    lesson = spotLesson ?? LESSONS[Math.floor(p.xp) % LESSONS.length]
  }

  const due = dueNotebook(p).length
  const nextDrill = DRILLS.find((d) => !(p.drills ?? {})[d.id])
  let third: ThirdStep
  if (info?.drills && nextDrill) third = { kind: 'drill', drill: nextDrill, repeat: false }
  else if (due > 0) third = { kind: 'notebook', due }
  else if (nextDrill) third = { kind: 'drill', drill: nextDrill, repeat: false }
  else third = { kind: 'drill', drill: DRILLS[Math.floor(p.xp) % DRILLS.length], repeat: true }

  return {
    spot,
    reason: info ? `Il tuo punto debole adesso: ${info.label.toLowerCase()}.` : 'Un po’ di tutto, finché non ho abbastanza partite per capire dove migliorare.',
    lesson,
    lessonReview,
    puzzleThemes: info?.themes,
    puzzleTitle: info ? `Allenamento: ${info.label}` : 'Puzzle del giorno',
    third,
  }
}

const PLAN_KEY = 'gigi-training-v1'

interface StoredPlan {
  day: string
  spot: MistakeKind | null
  reason: string
  lessonId: string
  lessonReview: boolean
  puzzleThemes?: Puzzle['theme'][]
  puzzleTitle: string
  third: { kind: 'drill'; drillId: string; repeat: boolean } | { kind: 'notebook'; due: number }
}

/**
 * Il piano resta lo stesso per tutta la giornata (anche se esci e rientri, o ricarichi la pagina):
 * altrimenti, finita la lezione, la carta cambierebbe lezione sotto gli occhi. Si ricalcola il giorno dopo.
 */
export function todaysPlan(p: Progress): TrainingPlan {
  try {
    const raw = localStorage.getItem(PLAN_KEY)
    if (raw) {
      const s = JSON.parse(raw) as StoredPlan
      const lesson = LESSONS.find((l) => l.id === s.lessonId)
      const drill = s.third.kind === 'drill' ? DRILLS.find((d) => d.id === (s.third as { drillId: string }).drillId) : undefined
      if (s.day === p.today.day && lesson && (s.third.kind === 'notebook' || drill)) {
        return {
          spot: s.spot,
          reason: s.reason,
          lesson,
          lessonReview: s.lessonReview,
          puzzleThemes: s.puzzleThemes,
          puzzleTitle: s.puzzleTitle,
          third: s.third.kind === 'drill' ? { kind: 'drill', drill: drill!, repeat: s.third.repeat } : { kind: 'notebook', due: s.third.due },
        }
      }
    }
  } catch {
    /* piano salvato illeggibile: se ne fa uno nuovo */
  }
  const plan = trainingPlan(p)
  const stored: StoredPlan = {
    day: p.today.day,
    spot: plan.spot,
    reason: plan.reason,
    lessonId: plan.lesson.id,
    lessonReview: plan.lessonReview,
    puzzleThemes: plan.puzzleThemes,
    puzzleTitle: plan.puzzleTitle,
    third: plan.third.kind === 'drill' ? { kind: 'drill', drillId: plan.third.drill.id, repeat: plan.third.repeat } : { kind: 'notebook', due: plan.third.due },
  }
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(stored))
  } catch {
    /* storage non disponibile: il piano vale solo finché la schermata è aperta */
  }
  return plan
}
