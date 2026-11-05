import { getState } from './store'
import { fxTier } from './perf'

/** Il telefono può vibrare (Android; su iPhone il browser non lo permette). */
export const canVibrate = (): boolean => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function' && (window.matchMedia?.('(pointer: coarse)').matches ?? false)

/** Piccole vibrazioni a tempo con i suoni. Non nel livello Leggero e solo se l'hai lasciata attiva. */
export function buzz(pattern: number | number[]) {
  if (!getState().settings.haptics || fxTier() === 'low' || !canVibrate()) return
  try {
    navigator.vibrate(pattern)
  } catch {
    /* alcuni browser la bloccano: pazienza */
  }
}
