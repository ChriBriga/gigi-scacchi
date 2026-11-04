import { useEffect, useState } from 'react'
import { Pigeon } from '../coach/Pigeon'
import type { Mood } from '../coach/lines'

/** Mostra il testo come se Gigi lo stesse scrivendo (accorciato se l'utente preferisce meno animazioni). */
export function useTypewriter(text: string): string {
  const [n, setN] = useState(0)
  useEffect(() => {
    setN(0)
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setN(text.length)
      return
    }
    const step = Math.max(1, Math.ceil(text.length / 70))
    const t = setInterval(() => {
      setN((v) => {
        if (v + step >= text.length) {
          clearInterval(t)
          return text.length
        }
        return v + step
      })
    }, 16)
    return () => clearInterval(t)
  }, [text])
  return text.slice(0, n)
}

export function CoachBubble({
  text,
  mood,
  size = 76,
  children,
  name = 'Gigi',
}: {
  text: string
  mood: Mood
  size?: number
  children?: React.ReactNode
  name?: string
}) {
  const shown = useTypewriter(text)
  return (
    <div className="coach">
      <div className="coach-avatar">
        <Pigeon mood={mood} size={size} />
      </div>
      <div className="coach-bubble">
        <span className="coach-name">{name}</span>
        <div className="coach-text">
          <span className="ghost-text" aria-hidden="true">{text}</span>
          <span className="live-text">{shown}</span>
        </div>
        {children}
      </div>
    </div>
  )
}
