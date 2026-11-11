import { useMemo, useState } from 'react'
import type { Color } from 'chess.js'
import { ArrowRight, BookOpen, CaretRight, Check, Binoculars, Fire, FlagCheckered, Lightning, Notebook as NotebookIcon, PuzzlePiece, Star } from '@phosphor-icons/react'
import { clearSavedGame, loadSavedGame, type SavedGame } from '../savedGame'
import { Avatar } from '../components/Avatar'
import { Hero } from '../components/Hero'
import { confirmDialog } from '../ui/Dialog'
import { BotAvatar } from '../components/BotAvatar'
import { LessonIcon } from '../components/icons'
import { pickGreeting } from '../coach/greeting'
import { BOTS, botById, recommendedBot, type Bot } from '../engine/bots'
import { LESSONS, type Lesson } from '../data/lessons'
import { DRILLS, type Drill } from '../data/drills'
import { currentStreak, levelName, useApp } from '../store'
import { todaysPlan } from '../training'
import type { Puzzle } from './Puzzles'
import type { Tab } from '../App'

const DAILY_PUZZLES = 5

export function Home({
  onLesson,
  onPuzzles,
  onDrill,
  onTest,
  onNotebook,
  onWeak,
  onDrills,
  startGame,
  resumeGame,
  go,
}: {
  onLesson: (l: Lesson) => void
  onPuzzles: (themes?: Puzzle['theme'][], title?: string) => void
  onDrill: (d: Drill) => void
  onTest: () => void
  onNotebook: () => void
  onWeak: () => void
  onDrills: () => void
  startGame: (b: Bot, c: Color) => void
  resumeGame: (g: SavedGame) => void
  go: (tab: Tab) => void
}) {
  const { progress, settings } = useApp()
  const [saved, setSaved] = useState(() => loadSavedGame())
  const savedBot = saved ? botById(saved.botId) : undefined
  const rec = recommendedBot(progress.skill)
  const t = progress.today
  // il piano resta lo stesso per tutta la giornata
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const plan = useMemo(() => todaysPlan(progress), [progress.today.day])
  const puzzleCount = Math.min(t.puzzles, DAILY_PUZZLES)
  const puzzlesDone = puzzleCount >= DAILY_PUZZLES
  const doneToday = [t.lesson, puzzlesDone, !!t.train].filter(Boolean).length
  const streak = currentStreak(progress)
  // il saluto si sceglie una volta sola per visita: non cambia a ogni aggiornamento della pagina
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const greet = useMemo(() => pickGreeting(settings.tone, progress), [settings.tone])

  const third = plan.third
  const thirdTitle = third.kind === 'drill' ? `Finale: ${third.drill.title}` : `Quaderno: ${third.due === 1 ? '1 errore' : `${third.due} errori`} da ripassare`
  const openThird = () => (third.kind === 'drill' ? onDrill(third.drill) : onNotebook())

  // L'azione primaria: una sola, enorme, che cambia col momento
  type Cta = { key: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void }
  let cta: Cta | null = null
  let resuming = false
  if (!progress.placementDone) {
    cta = null // resta il tasto del test
  } else if (saved && savedBot) {
    resuming = true
    const n = Math.ceil(saved.moves.length / 2)
    cta = {
      key: 'resume',
      icon: <BotAvatar id={savedBot.id} size={52} />,
      title: 'Riprendi la partita',
      sub: `contro ${savedBot.name} · ${n === 1 ? '1 mossa giocata' : `${n} mosse giocate`} · ${saved.color === 'w' ? 'hai il Bianco' : 'hai il Nero'}`,
      onClick: () => resumeGame(saved),
    }
  } else if (doneToday < 3) {
    let sub: string
    let icon: React.ReactNode
    let onClick: () => void
    if (!t.lesson) {
      sub = `${plan.lessonReview ? 'Ripasso' : 'Lezione'}: ${plan.lesson.title}`
      icon = <LessonIcon id={plan.lesson.id} size={32} />
      onClick = () => onLesson(plan.lesson)
    } else if (!puzzlesDone) {
      sub = `${DAILY_PUZZLES} puzzle · ${puzzleCount}/${DAILY_PUZZLES} fatti`
      icon = <PuzzlePiece size={32} weight="duotone" />
      onClick = () => onPuzzles(plan.puzzleThemes, plan.puzzleTitle)
    } else {
      sub = thirdTitle
      icon = third.kind === 'drill' ? <FlagCheckered size={32} weight="duotone" /> : <NotebookIcon size={32} weight="duotone" />
      onClick = openThird
    }
    cta = { key: 'train', icon, title: `Continua l’allenamento · ${doneToday}/3`, sub, onClick }
  } else {
    cta = {
      key: 'game',
      icon: <BotAvatar id={rec.id} size={52} />,
      title: `Gioca contro ${rec.name}`,
      sub: 'Allenamento fatto: ora si gioca, con coach e mappa del pericolo',
      onClick: () => startGame(rec, 'w'),
    }
  }

  const abandon = async () => {
    if (!saved || !savedBot) return
    const yes = await confirmDialog({
      title: 'Abbandonare la partita?',
      text: `La partita contro ${savedBot.name} viene cancellata. Non conterà come sconfitta.`,
      ok: 'Abbandona',
      cancel: 'Tienila',
      danger: true,
    })
    if (yes) {
      clearSavedGame()
      setSaved(null)
    }
  }

  return (
    <div className="screen">
      <Hero greeting={greet} tod={greet.tod} />

      {!progress.placementDone && (
        <button className="btn primary big" onClick={onTest}>
          <Lightning size={24} weight="fill" /> Fai il test iniziale (2 minuti)
        </button>
      )}

      {cta && (
        <div className="home-cta-wrap">
          <button className="home-cta" onClick={cta.onClick}>
            <span className="home-cta-icon">{cta.icon}</span>
            <span className="home-cta-info">
              <strong>{cta.title}</strong>
              <small>{cta.sub}</small>
            </span>
            <ArrowRight className="go" size={28} weight="bold" />
          </button>
          {resuming && (
            <button className="ghost home-cta-abandon" onClick={abandon}>
              Abbandona
            </button>
          )}
        </div>
      )}

      <h3 className="plan-title">Allenamento di oggi · {doneToday}/3</h3>
      <p className="plan-why">
        {plan.reason} <span className="muted">Circa 10 minuti.</span>
      </p>
      <div className="plan-list">
        <button className={`plan-card${t.lesson ? ' done' : ''}`} onClick={() => onLesson(plan.lesson)}>
          <span className={`tile${t.lesson ? ' done' : ''}`}>{t.lesson ? <Check size={28} weight="bold" /> : <LessonIcon id={plan.lesson.id} size={28} />}</span>
          <span className="plan-info">
            <strong>
              {plan.lessonReview ? 'Ripasso' : 'Lezione'}: {plan.lesson.title}
            </strong>
            <small>1-2 minuti · {plan.lesson.blurb}</small>
          </span>
          <CaretRight className="go" size={20} weight="bold" />
        </button>
        <button className={`plan-card${puzzlesDone ? ' done' : ''}`} onClick={() => onPuzzles(plan.puzzleThemes, plan.puzzleTitle)}>
          <span className={`tile${puzzlesDone ? ' done' : ''}`}>{puzzlesDone ? <Check size={28} weight="bold" /> : <PuzzlePiece size={28} weight="duotone" />}</span>
          <span className="plan-info">
            <strong>{DAILY_PUZZLES} puzzle</strong>
            <small>
              {puzzleCount}/{DAILY_PUZZLES} · {plan.spot ? 'sul tuo punto debole' : 'scelti sui temi in cui sbagli di più'}
            </small>
          </span>
          <CaretRight className="go" size={20} weight="bold" />
        </button>
        <button className={`plan-card${third.kind === 'drill' ? '' : ' notebook'}${t.train ? ' done' : ''}`} onClick={openThird}>
          <span className={`tile${t.train ? ' done' : ''}`}>
            {t.train ? (
              <Check size={28} weight="bold" />
            ) : third.kind === 'drill' ? (
              <FlagCheckered size={28} weight="duotone" />
            ) : (
              <NotebookIcon size={28} weight="duotone" />
            )}
          </span>
          <span className="plan-info">
            <strong>{thirdTitle}</strong>
            <small>{third.kind === 'drill' ? `2-5 minuti · ${third.drill.blurb}` : 'Errori tuoi, uno alla volta: stavolta li risolvi'}</small>
          </span>
          <CaretRight className="go" size={20} weight="bold" />
        </button>
      </div>

      <div className="home-more">
        {cta?.key !== 'game' && (
          <button className={`plan-card${t.game ? ' done' : ''}`} onClick={() => startGame(rec, 'w')}>
            {t.game ? (
              <span className="tile done">
                <Check size={28} weight="bold" />
              </span>
            ) : (
              <BotAvatar id={rec.id} size={52} />
            )}
            <span className="plan-info">
              <strong>Gioca contro {rec.name}</strong>
              <small>Con coach e mappa del pericolo</small>
            </span>
            <CaretRight className="go" size={20} weight="bold" />
          </button>
        )}
        <button className="plan-card" onClick={() => go('play')}>
          <span className="tile alt">
            <BotAvatar id={rec.id} size={36} />
          </span>
          <span className="plan-info">
            <strong>Scegli un altro avversario</strong>
            <small>{BOTS.length} bot, dal più facile al più duro</small>
          </span>
          <CaretRight className="go" size={20} weight="bold" />
        </button>
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
        {(progress.history?.length ?? 0) > 0 && (
          <button className="plan-card" onClick={onWeak}>
            <span className="tile">
              <Binoculars size={28} weight="duotone" />
            </span>
            <span className="plan-info">
              <strong>Il tuo punto debole</strong>
              <small>
                Ultima precisione {progress.history![progress.history!.length - 1].acc}% · dove perdi punti e come migliorare
              </small>
            </span>
            <CaretRight className="go" size={20} weight="bold" />
          </button>
        )}
      </div>

      <div className="home-foot">
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
  )
}
