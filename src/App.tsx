import { Suspense, lazy, useEffect, useState } from 'react'
import type { Color } from 'chess.js'
import { BookOpen, Checkerboard, Fire, Gear, House, PuzzlePiece, Star, type Icon } from '@phosphor-icons/react'
import { Home } from './screens/Home'
import { Logo } from './components/Logo'
import { Avatar, useProfile } from './components/Avatar'
import type { Bot } from './engine/bots'
import type { Lesson } from './data/lessons'
import { currentStreak, levelName, useApp } from './store'
import { THEMES } from './themes'

// le schermate pesanti si caricano solo quando servono (la Home e la barra restano subito pronte)
const Play = lazy(() => import('./screens/Play').then((m) => ({ default: m.Play })))
const PlaySetup = lazy(() => import('./screens/PlaySetup').then((m) => ({ default: m.PlaySetup })))
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })))
const Learn = lazy(() => import('./screens/Learn').then((m) => ({ default: m.Learn })))
const LessonPlayer = lazy(() => import('./screens/Learn').then((m) => ({ default: m.LessonPlayer })))
const Puzzles = lazy(() => import('./screens/Puzzles').then((m) => ({ default: m.Puzzles })))
const DailyPuzzles = lazy(() => import('./screens/DailyPuzzles').then((m) => ({ default: m.DailyPuzzles })))
const PlacementTest = lazy(() => import('./screens/Test').then((m) => ({ default: m.PlacementTest })))
const NotebookSession = lazy(() => import('./screens/Notebook').then((m) => ({ default: m.NotebookSession })))

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
  | { kind: 'notebook' }

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const { settings, progress } = useApp()
  const profile = useProfile()
  const streak = currentStreak(progress)

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
  else if (overlay?.kind === 'puzzles5') content = <DailyPuzzles key={overlay.key} onClose={close} />
  else if (overlay?.kind === 'test') content = <PlacementTest onExit={close} startGame={startGame} />
  else if (overlay?.kind === 'notebook') content = <NotebookSession onExit={close} />
  else if (tab === 'home')
    content = (
      <Home
        onLesson={openLesson}
        onPuzzles={() => setOverlay({ kind: 'puzzles5', key: Date.now() })}
        onTest={() => setOverlay({ kind: 'test' })}
        onNotebook={() => setOverlay({ kind: 'notebook' })}
        startGame={startGame}
        go={goTab}
      />
    )
  else if (tab === 'play') content = <PlaySetup onStart={startGame} />
  else if (tab === 'puzzles') content = <Puzzles onExit={() => setTab('home')} onNotebook={() => setOverlay({ kind: 'notebook' })} />
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
        <div className="side-foot card profile">
          <button className="profile-head" onClick={() => goTab('settings')} title="Cambia nome e avatar">
            <Avatar size={46} ring />
            <span className="profile-id">
              <strong>{profile.name}</strong>
              <small>{levelName(progress.skill)}</small>
            </span>
          </button>
          <div className="stats">
            <div className="stat">
              <Fire size={18} weight="fill" /> <b>{streak}</b> {streak === 1 ? 'giorno' : 'giorni'}
            </div>
            <div className="stat">
              <Star size={18} weight="fill" /> <b>{Math.round(progress.xp)}</b> XP
            </div>
          </div>
        </div>
      </aside>

      <main>
        <div className={`page${narrow ? ' narrow' : ''}`}>
          <Suspense fallback={<div className="screen-loading" aria-label="Carico…" />}>{content}</Suspense>
        </div>
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
