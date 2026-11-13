import type { ReactNode } from 'react'
import { Pigeon } from '../coach/Pigeon'
import type { Mood } from '../coach/lines'

/** Stato vuoto: Gigi fermo, una frase breve e (se ha senso) un tasto. */
export function EmptyState({ text, mood = 'neutral', action }: { text: string; mood?: Mood; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Pigeon mood={mood} size={72} still />
      <p>{text}</p>
      {action}
    </div>
  )
}
