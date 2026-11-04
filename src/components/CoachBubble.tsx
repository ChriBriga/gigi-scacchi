import { Pigeon } from '../coach/Pigeon'
import type { Mood } from '../coach/lines'

export function CoachBubble({
  text,
  mood,
  size = 72,
  children,
}: {
  text: string
  mood: Mood
  size?: number
  children?: React.ReactNode
}) {
  return (
    <div className="coach">
      <div className="coach-avatar">
        <Pigeon mood={mood} size={size} />
      </div>
      <div className="coach-bubble" key={text}>
        <div className="coach-text">{text}</div>
        {children}
      </div>
    </div>
  )
}
