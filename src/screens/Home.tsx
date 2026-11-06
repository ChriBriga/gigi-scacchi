import { useMemo, useState } from 'react'
import type { Color } from 'chess.js'
import { BookOpen, CaretRight, Check, Fire, FlagCheckered, Lightning, Notebook as NotebookIcon, Play, PuzzlePiece, Star } from '@phosphor-icons/react'
import { clearSavedGame, loadSavedGame, type SavedGame } from '../savedGame'
import { Avatar } from '../components/Avatar'
import { Hero } from '../components/Hero'
import { BotAvatar } from '../components/BotAvatar'
import { LessonIcon } from '../components/icons'
import { pickGreeting } from '../coach/greeting'
import { BOTS, botById, recommendedBot, type Bot } from '../engine/bots'
import { LESSONS, nextLesson, type Lesson } from '../data/lessons'
import { DRILLS } from '../data/drills'
import { currentStreak, dueNotebook, levelName, useApp } from '../store'
import type { Tab } from '../App'

const DAILY_PUZZLES = 5

export function Home({
  onLesson,
  onPuzzles,
  onTest,
  onNotebook,
  onDrills,
  startGame,
  resumeGame,
  go,
}: {
  onLesson: (l: Lesson) => void
  onPuzzles: () => void
  onTest: () => void
  onNotebook: () => void
  onDrills: () => void
  startGame: (b: Bot, c: Color) => void
  resumeGame: (g: SavedGame) => void
  go: (tab: Tab) => void
}) {
  const { progress, settings } = useApp()
  const [saved, setSaved] = useState(() => loadSavedGame())
  const savedBot = saved ? botById(saved.botId) : undefined
  const rec = recommendedBot(progress.skill)
  const next = nextLesson(progress.lessonsDone)
  const t = progress.today
  const lesson = next ?? LESSONS[Math.floor(progress.xp) % LESSONS.length]
  const puzzleCount = Math.min(t.puzzles, DAILY_PUZZLES)
  const doneToday = [t.lesson, puzzleCount >= DAILY_PUZZLES, t.game].filter(Boolean).length
  const streak = currentStreak(progress)
  const due = dueNotebook(progress).length
  // il saluto si sceglie una volta sola per visita: non cambia a ogni aggiornamento della pagina
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const greet = useMemo(() => pickGreeting(settings.tone, progress), [settings.tone])

  return (
    <div className="screen">
      <Hero greeting={greet} tod={greet.tod} />

      {!progress.placementDone && (
        <button className="btn primary big" onClick={onTest}>
          <Lightning size={24} weight="fill" /> Fai il test iniziale (2 minuti)
        </button>
      )}

      {saved && savedBot && (
        <div className="plan-card resume">
          <BotAvatar id={savedBot.id} size={52} />
          <span className="plan-info">
            <strong>Partita in corso contro {savedBot.name}</strong>
            <small>
              {Math.ceil(saved.moves.length / 2) === 1 ? '1 mossa giocata' : `${Math.ceil(saved.moves.length / 2)} mosse giocate`} ·{saved.color === 'w' ? 'hai il Bianco' : 'hai il Nero'}
            </small>
          </span>
          <button
            className="ghost"
            onClick={() => {
              if (confirm('Abbandoni la partita lasciata a metà? Non conterà come sconfitta.')) {
                clearSavedGame()
                setSaved(null)
              }
            }}
          >
            Abbandona
          </button>
          <button className="btn primary" onClick={() => resumeGame(saved)}>
            <Play size={18} weight="fill" /> Riprendi
          </button>
        </div>
      )}

      <div className="home-grid">
        <div className="screen">
          <h3 className="plan-title">Piano di oggi · {doneToday}/3</h3>
          <div className="plan-list">
            <button className={`plan-card${t.lesson ? ' done' : ''}`} onClick={() => onLesson(lesson)}>
              <span className={`tile${t.lesson ? ' done' : ''}`}>{t.lesson ? <Check size={28} weight="bold" /> : <LessonIcon id={lesson.id} size={28} />}</span>
              <span className="plan-info">
                <strong>
                  {next ? 'Lezione' : 'Ripasso'}: {lesson.title}
                </strong>
                <small>1-2 minuti · {lesson.blurb}</small>
              </span>
              <CaretRight className="go" size={20} weight="bold" />
            </button>
            <button className={`plan-card${puzzleCount >= DAILY_PUZZLES ? ' done' : ''}`} onClick={onPuzzles}>
              <span className={`tile${puzzleCount >= DAILY_PUZZLES ? ' done' : ''}`}>
                {puzzleCount >= DAILY_PUZZLES ? <Check size={28} weight="bold" /> : <PuzzlePiece size={28} weight="duotone" />}
              </span>
              <span className="plan-info">
                <strong>{DAILY_PUZZLES} puzzle</strong>
                <small>
                  {puzzleCount}/{DAILY_PUZZLES} · scelti sui tuoi punti deboli
                </small>
              </span>
              <CaretRight className="go" size={20} weight="bold" />
            </button>
            <button className={`plan-card${t.game ? ' done' : ''}`} onClick={() => startGame(rec, 'w')}>
              {t.game ? (
                <span className="tile done">
                  <Check size={28} weight="bold" />
                </span>
              ) : (
                <BotAvatar id={rec.id} size={52} />
              )}
              <span className="plan-info">
                <strong>Una partita contro {rec.name}</strong>
                <small>Con coach e mappa del pericolo</small>
              </span>
              <CaretRight className="go" size={20} weight="bold" />
            </button>
            {due > 0 && (
              <button className="plan-card notebook" onClick={onNotebook}>
                <span className="tile">
                  <NotebookIcon size={28} weight="duotone" />
                </span>
                <span className="plan-info">
                  <strong>Quaderno: {due === 1 ? '1 errore' : `${due} errori`} da ripassare</strong>
                  <small>Errori tuoi, uno alla volta: stavolta li risolvi</small>
                </span>
                <CaretRight className="go" size={20} weight="bold" />
              </button>
            )}
          </div>
          <button className="ghost" onClick={() => go('play')}>
            Scegli un altro avversario <CaretRight size={16} weight="bold" />
          </button>
        </div>

        <div className="screen">
          <div className="card level-card">
            <div className="level-head">
              <Avatar size={46} ring />
              <div>
                <strong>{levelName(progress.skill)}</strong>
                <small>Il tuo livello</small>
              </div>
            </div>
            <div className="bar" aria-label="Progresso di livello">
              <i style={{ width: `${Math.max(4, progress.skill)}%` }} />
            </div>
            <div className="stats">
              <div className="stat">
                <Fire size={18} weight="fill" /> <b>{streak}</b> {streak === 1 ? 'giorno' : 'giorni'}
              </div>
              <div className="stat">
                <Star size={18} weight="fill" /> <b>{Math.round(progress.xp)}</b> XP
              </div>
              <div className="stat">
                <BookOpen size={18} weight="fill" /> <b>{progress.lessonsDone.length}</b>/{LESSONS.length} lezioni
              </div>
            </div>
          </div>
          <button className="plan-card" onClick={onDrills}>
            <span className="tile">
              <FlagCheckered size={28} weight="duotone" />
            </span>
            <span className="plan-info">
              <strong>Finali contro il bot</strong>
              <small>
                {Object.keys(progress.drills ?? {}).length}/{DRILLS.length} superati · matti base, pedoni, Lucena
              </small>
            </span>
            <CaretRight className="go" size={20} weight="bold" />
          </button>
          <div className="card">
            <h3>Avversari battuti</h3>
            <div className="mini-bots">
              {BOTS.map((b) => (
                <span key={b.id} title={b.name} className={progress.botsBeaten.includes(b.id) ? '' : 'locked'}>
                  <BotAvatar id={b.id} size={38} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
