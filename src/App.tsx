import { useEffect, useState } from 'react'
import type { Color } from 'chess.js'
import { BookOpen, Checkerboard, Fire, Gear, House, PuzzlePiece, Star, type Icon } from '@phosphor-icons/react'
import { Play } from './screens/Play'
import { PlaySetup } from './screens/PlaySetup'
import { Settings } from './screens/Settings'
import { Home } from './screens/Home'
import { Learn, LessonPlayer } from './screens/Learn'
import { PuzzleRunner, Puzzles, pickPuzzle } from './screens/Puzzles'
import { PlacementTest } from './screens/Test'
import { Logo } from './components/Logo'
import type { Bot } from './engine/bots'
import type { Lesson } from './data/lessons'
import { getState, levelName, useApp } from './store'
import { THEMES } from './themes'

export type Tab = 'home' | 'play' | 'puzzles' | 'learn' | 'settings'

const TABS: { id: Tab; Icon: Icon; label: string }[] = [
  { id: 'home', Icon: House, label: 'Oggi' },
  { id: 'play', Icon: Checkerboard, label: 'Gioca' },
  { id: 'puzzles', Icon: PuzzlePiece, label: 'Puzzle' },
  { id: 'learn', Icon: BookOpen, label: 'Impara' },
  { id: 'settings', Icon: Gear, label: 'Altro' },
]

type Overlay =
  | { kind: 'game'; bot: Bot; color: Color; key: number }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'puzzles5'; key: number }
  | { kind: 'test' }

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const { settings, progress } = useApp()

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    const info = THEMES.find((t) => t.id === settings.theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', info?.themeColor ?? '#0e0720')
  }, [settings.theme])

  const close = () => setOverlay(null)
  const startGame = (bot: Bot, color: Color) => setOverlay({ kind: 'game', bot, color, key: Date.now() })
  const openLesson = (lesson: Lesson) => setOverlay({ kind: 'lesson', lesson })
  const goTab = (t: Tab) => {
    setOverlay(null)
    setTab(t)
  }

  let content
  let narrow = false
  if (overlay?.kind === 'game') content = <Play key={overlay.key} bot={overlay.bot} color={overlay.color} onExit={close} />
  else if (overlay?.kind === 'lesson') content = <LessonPlayer key={overlay.lesson.id} lesson={overlay.lesson} onExit={close} />
  else if (overlay?.kind === 'puzzles5')
    content = (
      <PuzzleRunner
        key={overlay.key}
        total={5}
        title="Puzzle del giorno"
        next={(_, res) => pickPuzzle(getState().progress, res.map((r) => r.id))}
        onFinish={close}
        onExit={close}
      />
    )
  else if (overlay?.kind === 'test') content = <PlacementTest onExit={close} startGame={startGame} />
  else if (tab === 'home')
    content = (
      <Home
        onLesson={openLesson}
        onPuzzles={() => setOverlay({ kind: 'puzzles5', key: Date.now() })}
        onTest={() => setOverlay({ kind: 'test' })}
        startGame={startGame}
        go={goTab}
      />
    )
  else if (tab === 'play') content = <PlaySetup onStart={startGame} />
  else if (tab === 'puzzles') content = <Puzzles onExit={() => setTab('home')} />
  else if (tab === 'learn') content = <Learn onOpen={openLesson} />
  else {
    content = <Settings />
    narrow = true
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo size={48} />
        <nav className="nav">
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} className={`nav-item${tab === id && !overlay ? ' on' : ''}`} onClick={() => goTab(id)}>
              <Icon size={24} weight={tab === id && !overlay ? 'fill' : 'duotone'} />
              {label}
            </button>
          ))}
        </nav>
        <div className="side-foot card">
          <div className="stats">
            <div className="stat">
              <Fire size={18} weight="fill" /> <b>{progress.streak}</b> {progress.streak === 1 ? 'giorno' : 'giorni'}
            </div>
            <div className="stat">
              <Star size={18} weight="fill" /> <b>{Math.round(progress.xp)}</b> XP
            </div>
          </div>
          <p className="muted" style={{ margin: '10px 0 0' }}>
            {levelName(progress.skill)}
          </p>
        </div>
      </aside>

      <main>
        <div className={`page${narrow ? ' narrow' : ''}`}>{content}</div>
      </main>

      <nav className="tabs">
        {TABS.map(({ id, Icon, label }) => (
          <button key={id} className={tab === id && !overlay ? 'on' : ''} onClick={() => goTab(id)}>
            <Icon size={26} weight={tab === id && !overlay ? 'fill' : 'duotone'} />
            <span className="tl">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
