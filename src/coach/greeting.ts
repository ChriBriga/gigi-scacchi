import { BOTS } from '../engine/bots'
import { currentStreak, daysAway, todayStr, type Progress } from '../store'
import { EVENT_MOOD, sayLine, type CoachEvent, type LineVars, type Mood, type Tone } from './lines'

export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'

export function timeOfDay(now = new Date()): TimeOfDay {
  const h = now.getHours()
  if (h >= 5 && h < 12) return 'morning'
  if (h >= 12 && h < 18) return 'afternoon'
  if (h >= 18 && h < 23) return 'evening'
  return 'night'
}

const TOD_EVENT: Record<TimeOfDay, CoachEvent> = {
  morning: 'greetMorning',
  afternoon: 'greetAfternoon',
  evening: 'greetEvening',
  night: 'greetNight',
}

function daysSince(day: string): number {
  const a = new Date(day + 'T12:00:00').getTime()
  const b = new Date(todayStr() + 'T12:00:00').getTime()
  return Math.max(0, Math.round((b - a) / 86_400_000))
}

/**
 * Il saluto della Home: dipende da chi sei (nuovo?), da quanto manchi, da come è andata l'ultima partita,
 * dalla tua serie e, in mancanza d'altro, dall'ora del giorno.
 */
export function pickGreeting(tone: Tone, p: Progress): { text: string; mood: Mood; tod: TimeOfDay } {
  const tod = timeOfDay()
  const away = daysAway(p)
  const streak = currentStreak(p)
  const g = p.gigi?.lastGame
  const bot = g ? BOTS.find((b) => b.id === g.bot)?.name : undefined

  let event: CoachEvent = TOD_EVENT[tod]
  const vars: LineVars = {}

  if (!p.placementDone) {
    event = 'greetNew'
  } else if (away >= 3) {
    event = 'greetBack'
    vars.n = away
  } else if (g && bot && daysSince(g.day) <= 3 && Math.random() < 0.6) {
    vars.bot = bot
    if (g.retracts >= 4 && Math.random() < 0.6) {
      event = 'greetRetracts'
      vars.n = g.retracts
    } else if (g.outcome === 'win') event = 'greetWonLast'
    else if (g.outcome === 'lose') event = 'greetLostLast'
  } else if (streak >= 3 && Math.random() < 0.5) {
    event = 'greetStreak'
    vars.n = streak
  }

  return { text: sayLine(event, tone, vars), mood: EVENT_MOOD[event], tod }
}
