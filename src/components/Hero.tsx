import { useRef, useState } from 'react'
import { CloudSun, MoonStars, Sun, SunHorizon, type Icon } from '@phosphor-icons/react'
import { Pigeon } from '../coach/Pigeon'
import { sayLine, type Mood } from '../coach/lines'
import type { TimeOfDay } from '../coach/greeting'
import { useTypewriter } from './CoachBubble'
import { useApp } from '../store'

const TOD_ICON: Record<TimeOfDay, Icon> = { morning: Sun, afternoon: CloudSun, evening: SunHorizon, night: MoonStars }
const POKE_MOODS: Mood[] = ['happy', 'shocked', 'confused', 'smug', 'cool', 'happy']

/**
 * Il cuore della Home: Gigi grande con il suo saluto. Cambia colore con l'ora del giorno
 * e se lo tocchi reagisce (se esageri, si arrabbia).
 */
export function Hero({ greeting, tod }: { greeting: { text: string; mood: Mood }; tod: TimeOfDay }) {
  const { settings } = useApp()
  const [say, setSay] = useState(greeting)
  const pokes = useRef<number[]>([])
  const shown = useTypewriter(say.text)
  const TodIcon = TOD_ICON[tod]

  const poke = () => {
    const now = Date.now()
    pokes.current = [...pokes.current.filter((t) => now - t < 7000), now]
    const many = pokes.current.length >= 5
    if (many) pokes.current = []
    setSay({
      text: sayLine(many ? 'pokeMany' : 'poke', settings.tone),
      mood: many ? 'angry' : POKE_MOODS[Math.floor(Math.random() * POKE_MOODS.length)],
    })
  }

  return (
    <div className="hero-big" data-tod={tod}>
      <span className="hero-sky" aria-hidden="true">
        <TodIcon size={26} weight="fill" />
      </span>
      <button className="hero-gigi" onClick={poke} aria-label="Gigi il piccione: toccalo per farlo parlare">
        <Pigeon mood={say.mood} size={240} />
        <span className="hero-floor" />
      </button>
      <div className="hero-bubble">
        <span className="coach-name">Gigi</span>
        <div className="coach-text">
          <span className="ghost-text" aria-hidden="true">
            {say.text}
          </span>
          <span className="live-text">{shown}</span>
        </div>
      </div>
    </div>
  )
}
