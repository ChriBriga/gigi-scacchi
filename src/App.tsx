import { useState } from 'react'
import type { Color } from 'chess.js'
import { Play } from './screens/Play'
import { PlaySetup } from './screens/PlaySetup'
import { Settings } from './screens/Settings'
import { Home } from './screens/Home'
import { Learn, LessonPlayer } from './screens/Learn'
import { PuzzleRunner, Puzzles, pickPuzzle } from './screens/Puzzles'
import { PlacementTest } from './screens/Test'
import type { Bot } from './engine/bots'
import type { Lesson } from './data/lessons'
import { getState } from './store'

export type Tab = 'home' | 'play' | 'puzzles' | 'learn' | 'settings'

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'home', icon: '🏠', label: 'Oggi' },
  { id: 'play', icon: '♟️', label: 'Gioca' },
  { id: 'puzzles', icon: '🧩', label: 'Puzzle' },
  { id: 'learn', icon: '📚', label: 'Impara' },
  { id: 'settings', icon: '⚙️', label: 'Altro' },
]

type Overlay =
  | { kind: 'game'; bot: Bot; color: Color; key: number }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'puzzles5'; key: number }
  | { kind: 'test' }

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay | null>(null)

  const close = () => setOverlay(null)
  const startGame = (bot: Bot, color: Color) => setOverlay({ kind: 'game', bot, color, key: Date.now() })
  const openLesson = (lesson: Lesson) => setOverlay({ kind: 'lesson', lesson })

  let content
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
        go={setTab}
      />
    )
  else if (tab === 'play') content = <PlaySetup onStart={startGame} />
  else if (tab === 'puzzles') content = <Puzzles onExit={() => setTab('home')} />
  else if (tab === 'learn') content = <Learn onOpen={openLesson} />
  else content = <Settings />

  return (
    <div className="app">
      <main>{content}</main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id && !overlay ? 'on' : ''}
            onClick={() => {
              setOverlay(null)
              setTab(t.id)
            }}
          >
            <span className="ti">{t.icon}</span>
            <span className="tl">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
