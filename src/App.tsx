import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Color } from 'chess.js'
import { BookOpen, Checkerboard, Fire, Gear, House, Keyboard, PuzzlePiece, Star, type Icon } from '@phosphor-icons/react'
import { Home } from './screens/Home'
import { Logo } from './components/Logo'
import { Avatar, useProfile } from './components/Avatar'
import { botById, type Bot } from './engine/bots'
import { clearSavedGame, loadSavedGame, type SavedGame } from './savedGame'
import type { Lesson } from './data/lessons'
import type { Puzzle } from './screens/Puzzles'
import { nextDrill, type Drill } from './data/drills'
import { currentStreak, levelName, useApp } from './store'
import { THEMES } from './themes'
import { DialogHost, confirmDialog } from './ui/Dialog'
import { ToastHost, toast } from './ui/Toast'
import { Shortcuts } from './ui/Shortcuts'

// le schermate pesanti si caricano solo quando servono (la Home e la barra restano subito pronte)
const Play = lazy(() => import('./screens/Play').then((m) => ({ default: m.Play })))
const PlaySetup = lazy(() => import('./screens/PlaySetup').then((m) => ({ default: m.PlaySetup })))
const DrillPlay = lazy(() => import('./screens/Drill').then((m) => ({ default: m.DrillPlay })))
const Settings = lazy(() => import('./screens/Settings').then((m) => ({ default: m.Settings })))
const Learn = lazy(() => import('./screens/Learn').then((m) => ({ default: m.Learn })))
const LessonPlayer = lazy(() => import('./screens/Learn').then((m) => ({ default: m.LessonPlayer })))
const Puzzles = lazy(() => import('./screens/Puzzles').then((m) => ({ default: m.Puzzles })))
const DailyPuzzles = lazy(() => import('./screens/DailyPuzzles').then((m) => ({ default: m.DailyPuzzles })))
const PlacementTest = lazy(() => import('./screens/Test').then((m) => ({ default: m.PlacementTest })))
const WeakSpots = lazy(() => import('./screens/WeakSpots').then((m) => ({ default: m.WeakSpots })))
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
  | { kind: 'game'; bot: Bot; color: Color; key: number; resume?: SavedGame }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'drill'; drill: Drill }
  | { kind: 'puzzles5'; key: number; themes?: Puzzle['theme'][]; title?: string }
  | { kind: 'weak' }
  | { kind: 'test' }
  | { kind: 'notebook' }

export function App() {
  const [tab, setTab] = useState<Tab>('home')
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [playMode, setPlayMode] = useState<'games' | 'drills'>('games')
  const { settings, progress } = useApp()
  const profile = useProfile()
  const streak = currentStreak(progress)

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme
    const info = THEMES.find((t) => t.id === settings.theme)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', info?.themeColor ?? '#121216')
  }, [settings.theme])

  const [help, setHelp] = useState(false)
  const mainRef = useRef<HTMLElement>(null)

  // --- Tasto indietro (browser e telefono) ---------------------------------------------------
  // La cronologia tiene solo "a che profondità sei": 0 = Oggi, +1 un'altra scheda, +1 una schermata aperta sopra
  // (partita, lezione, puzzle…). Indietro chiude prima la schermata, poi torna a Oggi, poi esce dall'app.
  const depth = (tab !== 'home' ? 1 : 0) + (overlay ? 1 : 0)
  const histDepth = useRef<number>(typeof history.state?.d === 'number' ? (history.state.d as number) : 0)
  /** quanti "indietro" abbiamo chiesto noi: il loro evento popstate non va trattato come un tasto premuto */
  const ownPops = useRef(0)
  const navNow = useRef({ tab, overlay })
  navNow.current = { tab, overlay }
  useEffect(() => {
    if (depth > histDepth.current) {
      for (let d = histDepth.current + 1; d <= depth; d++) history.pushState({ d }, '')
    } else if (depth < histDepth.current) {
      ownPops.current++
      history.go(depth - histDepth.current)
    }
    histDepth.current = depth
  }, [depth])
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      if (ownPops.current > 0) {
        ownPops.current--
        return
      }
      const d = typeof e.state?.d === 'number' ? (e.state.d as number) : 0
      histDepth.current = d
      const now = navNow.current
      const tabDepth = now.tab !== 'home' ? 1 : 0
      if (now.overlay && d <= tabDepth) setOverlay(null)
      if (d === 0 && now.tab !== 'home') setTab('home')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  // --- Scroll: ogni schermata parte dall'alto; tornando indietro a una scheda la ritrovi dove l'avevi lasciata ---
  const screenKey = overlay
    ? `ov:${overlay.kind}:${overlay.kind === 'game' || overlay.kind === 'puzzles5' ? overlay.key : overlay.kind === 'lesson' ? overlay.lesson.id : overlay.kind === 'drill' ? overlay.drill.id : ''}`
    : `tab:${tab}`
  const scrolls = useRef<Record<string, number>>({})
  const shownKey = useRef(screenKey)
  useLayoutEffect(() => {
    const from = shownKey.current
    shownKey.current = screenKey
    const m = mainRef.current
    if (!m || from === screenKey) return
    const back = from.startsWith('ov:') && screenKey.startsWith('tab:')
    m.scrollTop = back ? (scrolls.current[screenKey] ?? 0) : 0
  }, [screenKey])

  // uscendo da una partita non finita: due parole per dire che non è persa
  const wasGame = useRef(false)
  useEffect(() => {
    const isGame = overlay?.kind === 'game'
    if (wasGame.current && !isGame && loadSavedGame()) toast('Partita salvata: la riprendi da Oggi')
    wasGame.current = isGame
  }, [overlay])

  // "?" apre l'elenco delle scorciatoie
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      e.preventDefault()
      setHelp(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const close = () => setOverlay(null)
  const startGame = async (bot: Bot, color: Color) => {
    // una partita nuova prende il posto di quella lasciata a metà: meglio chiederlo
    const saved = loadSavedGame()
    if (saved) {
      const yes = await confirmDialog({
        title: 'Iniziare una partita nuova?',
        text: `Hai una partita in corso contro ${botById(saved.botId)?.name ?? 'un avversario'}. Se ne inizi un’altra, quella va persa.`,
        ok: 'Inizia la nuova',
        cancel: 'Torna indietro',
        danger: true,
      })
      if (!yes) return
    }
    clearSavedGame()
    setOverlay({ kind: 'game', bot, color, key: Date.now() })
  }
  const resumeGame = (saved: SavedGame) => {
    const bot = botById(saved.botId)
    if (bot) setOverlay({ kind: 'game', bot, color: saved.color, key: Date.now(), resume: saved })
  }
  const openLesson = (lesson: Lesson) => setOverlay({ kind: 'lesson', lesson })
  const goTab = (t: Tab) => {
    setOverlay(null)
    setTab(t)
  }

  let content
  let narrow = false
  if (overlay?.kind === 'game') {
    const g = overlay
    content = <Play key={g.key} bot={g.bot} color={g.color} resume={g.resume} onExit={close} onRematch={() => setOverlay({ kind: 'game', bot: g.bot, color: g.color, key: Date.now() })} />
  }
  else if (overlay?.kind === 'lesson') content = <LessonPlayer key={overlay.lesson.id} lesson={overlay.lesson} onExit={close} />
  else if (overlay?.kind === 'drill') {
    const d = overlay.drill
    const nx = nextDrill(d.id)
    content = <DrillPlay key={d.id} drill={d} onExit={close} onNext={nx ? () => setOverlay({ kind: 'drill', drill: nx }) : undefined} />
  } else if (overlay?.kind === 'puzzles5') content = <DailyPuzzles key={overlay.key} onClose={close} themes={overlay.themes} title={overlay.title} />
  else if (overlay?.kind === 'test') content = <PlacementTest onExit={close} startGame={startGame} />
  else if (overlay?.kind === 'notebook') content = <NotebookSession onExit={close} />
  else if (overlay?.kind === 'weak')
    content = (
      <WeakSpots
        onExit={close}
        onLesson={openLesson}
        onPuzzles={(themes, title) => setOverlay({ kind: 'puzzles5', key: Date.now(), themes, title: `Allenamento: ${title}` })}
        onDrills={() => {
          setPlayMode('drills')
          goTab('play')
        }}
        onNotebook={() => setOverlay({ kind: 'notebook' })}
      />
    )
  else if (tab === 'home')
    content = (
      <Home
        onLesson={openLesson}
        onPuzzles={(themes, title) => setOverlay({ kind: 'puzzles5', key: Date.now(), themes, title })}
        onDrill={(d) => setOverlay({ kind: 'drill', drill: d })}
        onTest={() => setOverlay({ kind: 'test' })}
        onNotebook={() => setOverlay({ kind: 'notebook' })}
        onWeak={() => setOverlay({ kind: 'weak' })}
        onDrills={() => {
          setPlayMode('drills')
          goTab('play')
        }}
        startGame={startGame}
        resumeGame={resumeGame}
        go={goTab}
      />
    )
  else if (tab === 'play') content = <PlaySetup onStart={startGame} onDrill={(d) => setOverlay({ kind: 'drill', drill: d })} mode={playMode} onMode={setPlayMode} />
  else if (tab === 'puzzles') content = <Puzzles onExit={() => setTab('home')} onNotebook={() => setOverlay({ kind: 'notebook' })} />
  else if (tab === 'learn') content = <Learn onOpen={openLesson} />
  else {
    content = <Settings />
    narrow = true
  }

  return (
    <div className={`app${overlay?.kind === 'game' || overlay?.kind === 'drill' ? ' in-game' : ''}`}>
      <aside className="sidebar">
        <Logo size={48} />
        <nav className="nav">
          {TABS.map(({ id, Icon, label }) => (
            <button key={id} className={`nav-item${tab === id && !overlay ? ' on' : ''}`} onClick={() => goTab(id)} title={label}>
              <Icon size={24} weight={tab === id && !overlay ? 'fill' : 'duotone'} />
              <span className="nav-label">{label}</span>
            </button>
          ))}
        </nav>
        <button className="nav-help" onClick={() => setHelp(true)} title="Scorciatoie da tastiera (?)">
          <Keyboard size={20} weight="duotone" />
          <span className="nav-label">Scorciatoie</span>
          <kbd className="kbd">?</kbd>
        </button>
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

      <main
        ref={mainRef}
        onScroll={(e) => {
          scrolls.current[shownKey.current] = e.currentTarget.scrollTop
        }}
      >
        <div className={`page${narrow ? ' narrow' : ''}`}>
          <Suspense fallback={<div className="screen-loading" aria-label="Carico…" />}>
            <div className="page-fx" key={screenKey}>
              {content}
            </div>
          </Suspense>
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

      {help && <Shortcuts onClose={() => setHelp(false)} />}
      <DialogHost />
      <ToastHost />
    </div>
  )
}
