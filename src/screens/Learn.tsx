import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { ArrowLeft, ArrowRight, Check, Lightbulb, SkipForward } from '@phosphor-icons/react'
import { Board } from '../components/Board'
import { CoachBubble } from '../components/CoachBubble'
import { Confetti } from '../components/GameParts'
import { LessonIcon } from '../components/icons'
import { LESSONS, nextLesson, type Lesson, type Step } from '../data/lessons'
import { dangerTints } from '../chess/danger'
import { parseUci } from '../chess/util'
import type { Mood } from '../coach/lines'
import { addXp, touchDay, update, useApp } from '../store'
import { sfx } from '../sound'

export function Learn({ onOpen }: { onOpen: (l: Lesson) => void }) {
  const { progress } = useApp()
  const next = nextLesson(progress.lessonsDone)
  return (
    <div className="screen">
      <h2>Impara</h2>
      <p className="sub">Lezioni di 1-2 minuti. Solo lo stretto necessario, dritto al punto.</p>
      <div className="lessons">
        {LESSONS.map((l) => {
          const done = progress.lessonsDone.includes(l.id)
          return (
            <button key={l.id} className={`lesson-card${next?.id === l.id ? ' rec' : ''}`} onClick={() => onOpen(l)}>
              <span className={`tile${done ? ' done' : ''}`}>{done ? <Check size={26} weight="bold" /> : <LessonIcon id={l.id} size={28} />}</span>
              <span className="plan-info">
                <strong>{l.title}</strong>
                <small>{l.blurb}</small>
              </span>
              {next?.id === l.id && <span className="badge-pill tip">prossima</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function LessonPlayer({ lesson, onExit }: { lesson: Lesson; onExit: (completed: boolean) => void }) {
  const app = useApp()
  const [idx, setIdx] = useState(0)
  const step: Step = lesson.steps[idx]
  const [fen, setFen] = useState(step.fen)
  const [solved, setSolved] = useState(step.kind === 'info')
  const [feedback, setFeedback] = useState<{ text: string; mood: Mood }>({ text: step.text, mood: 'cool' })
  const [lineIdx, setLineIdx] = useState(0)
  const [showHint, setShowHint] = useState(false)
  const [wrongs, setWrongs] = useState(0)
  const [shake, setShake] = useState(false)
  const [finished, setFinished] = useState(false)
  const lineRef = useRef<Chess | null>(null)

  useEffect(() => {
    const s = lesson.steps[idx]
    setFen(s.fen)
    setSolved(s.kind === 'info')
    setFeedback({ text: s.text, mood: 'cool' })
    setLineIdx(0)
    setShowHint(false)
    setWrongs(0)
    lineRef.current = s.kind === 'line' ? new Chess(s.fen) : null
  }, [idx, lesson])

  // il colore del giocatore è quello che muove all'inizio dello step, anche dopo che le mosse cambiano il FEN
  const turn = useMemo(() => (step.fen.split(' ')[1] === 'b' ? 'b' : 'w') as 'w' | 'b', [step.fen])
  const interactive = step.kind !== 'info' && !solved

  const tints = useMemo(() => {
    if (step.kind === 'line' || !('danger' in step) || !step.danger) return undefined
    try {
      return dangerTints(new Chess(step.fen), turn, 'threats')
    } catch {
      return undefined
    }
  }, [step, turn])

  const wrong = (text: string) => {
    sfx.bad()
    setShake(true)
    setTimeout(() => setShake(false), 450)
    setWrongs((w) => w + 1)
    setFeedback({ text, mood: 'angry' })
  }

  const onMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (step.kind === 'try') {
      const g = new Chess(step.fen)
      const uci = from + to + (promotion ?? '')
      try {
        g.move({ from, to, promotion })
      } catch {
        return
      }
      const ok =
        (step.accept?.some((a) => uci.startsWith(a)) ?? false) ||
        (step.acceptFrom !== undefined && from === step.acceptFrom) ||
        (step.mate === true && g.isCheckmate())
      if (ok) {
        setFen(g.fen())
        setSolved(true)
        setShowHint(false)
        sfx.good()
        setFeedback({ text: step.ok, mood: 'happy' })
        addXp(5)
      } else {
        wrong(step.wrong)
      }
    } else if (step.kind === 'line') {
      const g = lineRef.current!
      const expected = step.moves[lineIdx]
      const uci = from + to + (promotion ?? '')
      if (uci !== expected) {
        wrong(`Segui il consiglio! Prova con ${expected.slice(0, 2)} → ${expected.slice(2, 4)}.`)
        setShowHint(true)
        return
      }
      g.move({ from, to, promotion })
      setFen(g.fen())
      sfx.move()
      setShowHint(false)
      let next = lineIdx + 1
      const reply = step.moves[next]
      if (reply) {
        setTimeout(() => {
          const p = parseUci(reply)
          g.move({ from: p.from, to: p.to, promotion: p.promotion })
          setFen(g.fen())
          sfx.move()
        }, 450)
        next += 1
      }
      setLineIdx(next)
      if (next >= step.moves.length) {
        setSolved(true)
        setFeedback({ text: step.ok, mood: 'happy' })
        sfx.good()
        addXp(5)
      } else setFeedback({ text: 'Bene! Continua.', mood: 'happy' })
    }
  }

  const hintArrow = useMemo((): [Square, Square][] | undefined => {
    if (!showHint) return undefined
    if (step.kind === 'try' && step.hint) return [step.hint]
    if (step.kind === 'line' && lineIdx < step.moves.length) {
      const m = step.moves[lineIdx]
      return [[m.slice(0, 2) as Square, m.slice(2, 4) as Square]]
    }
    return undefined
  }, [showHint, step, lineIdx])

  const complete = () => {
    update((s) => {
      touchDay(s.progress)
      if (!s.progress.lessonsDone.includes(lesson.id)) {
        s.progress.lessonsDone.push(lesson.id)
        s.progress.xp += 25
        s.progress.skill = Math.min(100, s.progress.skill + 1.5)
      }
      s.progress.today.lesson = true
    })
    sfx.win()
    setFinished(true)
    setFeedback({ text: 'Lezione completata! Gigi è orgoglioso, e non lo dice spesso.', mood: 'happy' })
  }

  const isLast = idx === lesson.steps.length - 1
  const advance = () => (isLast ? complete() : setIdx(idx + 1))

  return (
    <div className="screen">
      <div className="topbar">
        <button className="ghost" onClick={() => onExit(false)}>
          <ArrowLeft size={20} weight="bold" /> Esci
        </button>
        <div className="title">
          <LessonIcon id={lesson.id} size={24} /> {lesson.title}
        </div>
      </div>
      <div className="dots">
        {lesson.steps.map((_, i) => (
          <span key={i} className={i < idx || finished ? 'dot-on' : i === idx ? 'dot-cur' : ''} />
        ))}
      </div>
      <div className="game-shell">
        <div className="game-main">
          <Board
            fen={fen}
            orientation={turn}
            movable={interactive ? turn : null}
            onMove={onMove}
            showRange={step.kind === 'info' && step.range}
            tints={tints}
            arrows={hintArrow}
            marks={step.kind === 'info' ? step.marks : undefined}
            shake={shake}
          />
        </div>
        <div className="game-side">
          <CoachBubble text={feedback.text} mood={feedback.mood}>
            <div className="row">
              {finished ? (
                <button className="btn primary" onClick={() => onExit(true)}>
                  Continua <ArrowRight size={18} weight="bold" />
                </button>
              ) : (
                <>
                  {step.kind !== 'info' && !solved && (
                    <button className="btn" onClick={() => setShowHint(true)}>
                      <Lightbulb size={18} weight="fill" /> Aiuto
                    </button>
                  )}
                  {step.kind !== 'info' && !solved && wrongs >= 2 && (
                    <button className="btn" onClick={advance}>
                      <SkipForward size={18} weight="fill" /> Salta
                    </button>
                  )}
                  {solved && (
                    <button className="btn primary" onClick={advance}>
                      {isLast ? (
                        <>
                          Finito <Check size={18} weight="bold" />
                        </>
                      ) : (
                        <>
                          Avanti <ArrowRight size={18} weight="bold" />
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          </CoachBubble>
          {app.progress.lessonsDone.includes(lesson.id) && idx === 0 && <p className="muted">Hai già completato questa lezione, ripassa pure!</p>}
        </div>
      </div>
      {finished && <Confetti />}
    </div>
  )
}
