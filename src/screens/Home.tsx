import type { Color } from 'chess.js'
import { CoachBubble } from '../components/CoachBubble'
import { BOTS, type Bot } from '../engine/bots'
import { LESSONS, type Lesson } from '../data/lessons'
import { levelName, useApp } from '../store'
import { nextLesson } from './Learn'

const DAILY_PUZZLES = 5

function greeting(tone: 'gentle' | 'spicy' | 'ruthless', streak: number, placementDone: boolean): string {
  if (!placementDone) {
    return tone === 'gentle'
      ? 'Ciao! Io sono Gigi, il tuo allenatore. Facciamo un test veloce per capire da dove partire?'
      : 'Ciao pivello! Sono Gigi. Facciamo un test veloce così vedo quanto c’è da lavorare.'
  }
  const h = new Date().getHours()
  const day = h < 12 ? 'Buongiorno' : h < 18 ? 'Buon pomeriggio' : 'Buonasera'
  if (streak >= 3) return `${day}! ${streak} giorni di fila: il piccione è fiero di te.`
  if (tone === 'gentle') return `${day}! Ecco il piano di oggi, circa 15 minuti.`
  return `${day}, pivello. Piano di oggi: 15 minuti, zero scuse.`
}

export function Home({
  onLesson,
  onPuzzles,
  onTest,
  startGame,
  go,
}: {
  onLesson: (l: Lesson) => void
  onPuzzles: () => void
  onTest: () => void
  startGame: (b: Bot, c: Color) => void
  go: (tab: 'play') => void
}) {
  const { progress, settings } = useApp()
  const rec = BOTS[Math.max(0, Math.min(7, Math.round(progress.skill / 12)))]
  const next = nextLesson(progress.lessonsDone)
  const t = progress.today
  const lessonDone = t.lesson
  const lesson = next ?? LESSONS[Math.floor(Math.random() * LESSONS.length)]
  const puzzleCount = Math.min(t.puzzles, DAILY_PUZZLES)

  return (
    <div className="screen">
      <div className="stats">
        <div className="stat">🔥 <b>{progress.streak}</b> {progress.streak === 1 ? 'giorno' : 'giorni'}</div>
        <div className="stat">⭐ <b>{Math.round(progress.xp)}</b> XP</div>
        <div className="stat">🎖️ {levelName(progress.skill)}</div>
      </div>

      <CoachBubble text={greeting(settings.tone, progress.streak, progress.placementDone)} mood="cool" size={80} />

      {!progress.placementDone && (
        <button className="btn primary big" onClick={onTest}>⚡ Fai il test iniziale (2 minuti)</button>
      )}

      <h3 className="plan-title">Piano di oggi</h3>
      <button className={`plan-card${lessonDone ? ' done' : ''}`} onClick={() => onLesson(lesson)}>
        <span className="plan-ico">{lessonDone ? '✅' : lesson.emoji}</span>
        <span className="plan-info">
          <strong>{next ? 'Lezione' : 'Ripasso'}: {lesson.title}</strong>
          <small>1-2 minuti · {lesson.blurb}</small>
        </span>
      </button>
      <button className={`plan-card${puzzleCount >= DAILY_PUZZLES ? ' done' : ''}`} onClick={onPuzzles}>
        <span className="plan-ico">{puzzleCount >= DAILY_PUZZLES ? '✅' : '🧩'}</span>
        <span className="plan-info">
          <strong>{DAILY_PUZZLES} puzzle</strong>
          <small>{puzzleCount}/{DAILY_PUZZLES} · scelti sui tuoi punti deboli</small>
        </span>
      </button>
      <button className={`plan-card${t.game ? ' done' : ''}`} onClick={() => startGame(rec, 'w')}>
        <span className="plan-ico">{t.game ? '✅' : rec.emoji}</span>
        <span className="plan-info">
          <strong>Una partita contro {rec.name}</strong>
          <small>Con coach e mappa del pericolo</small>
        </span>
      </button>
      <button className="ghost" onClick={() => go('play')}>Scegli un altro avversario →</button>
    </div>
  )
}
