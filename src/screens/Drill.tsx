import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ArrowClockwise, ArrowCounterClockwise, ArrowLeft, ArrowRight, Lightbulb } from '@phosphor-icons/react'
import { Board } from '../components/Board'
import { CoachBubble } from '../components/CoachBubble'
import { Confetti } from '../components/GameParts'
import { bestMoveFor, evaluate } from '../engine/analysis'
import { botByRank, chooseBotMove } from '../engine/bots'
import { GOAL_TEXT, type Drill } from '../data/drills'
import { opposite, parseUci } from '../chess/util'
import { EVENT_MOOD, sayLine, type Mood } from '../coach/lines'
import { getState, touchDay, update, useApp } from '../store'
import { sfx } from '../sound'

/** durata dell'animazione del pezzo dell'avversario (vedi .board.slow in styles.css) */
const SLIDE_MS = 700
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Quanti pezzi (donne, torri, alfieri, cavalli) ha un colore: serve a capire se il pedone è stato promosso. */
function heavyCount(g: Chess, color: Color): number {
  let n = 0
  for (const row of g.board()) for (const p of row) if (p && p.color === color && p.type !== 'p' && p.type !== 'k') n++
  return n
}

type Phase = 'player' | 'thinking' | 'over'

/** Un finale contro il bot: parti da una posizione fissa e devi raggiungere l'obiettivo entro un certo numero di mosse. */
export function DrillPlay({ drill, onExit, onNext }: { drill: Drill; onExit: () => void; onNext?: () => void }) {
  const { settings } = useApp()
  const bot = useMemo(() => botByRank(drill.botRank), [drill])
  const me: Color = useMemo(() => new Chess(drill.fen).turn(), [drill])
  const startHeavy = useMemo(() => heavyCount(new Chess(drill.fen), me), [drill, me])
  const game = useRef(new Chess(drill.fen))
  const alive = useRef(true)
  /** cambia a ogni ricomincia/annulla: le risposte del bot arrivate in ritardo non fanno nulla */
  const token = useRef(0)

  const [fen, setFen] = useState(drill.fen)
  const [phase, setPhase] = useState<Phase>('player')
  const [moves, setMoves] = useState(0)
  const [last, setLast] = useState<[Square, Square] | null>(null)
  const [lastBy, setLastBy] = useState<'me' | 'opp'>('me')
  const [hintLevel, setHintLevel] = useState(0)
  const [hint, setHint] = useState<{ from?: Square; to?: Square } | null>(null)
  const [coach, setCoach] = useState<{ text: string; mood: Mood }>({ text: drill.tip, mood: 'cool' })
  const [result, setResult] = useState<{ ok: boolean; moves: number; first: boolean } | null>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const finish = (ok: boolean, text: string, n: number) => {
    const first = !getState().progress.drills?.[drill.id]
    setResult({ ok, moves: n, first })
    setPhase('over')
    if (ok) {
      sfx.win()
      update((s) => {
        touchDay(s.progress)
        s.progress.today.train = true
        const d = (s.progress.drills ??= {})
        d[drill.id] = d[drill.id] ? Math.min(d[drill.id], n) : n
        s.progress.xp += first ? 25 : 5
      })
      setCoach({ text: `${text} ${sayLine('puzzleOk', settings.tone)}`, mood: EVENT_MOOD.puzzleOk })
    } else {
      sfx.lose()
      setCoach({ text: `${text} ${sayLine('puzzleFail', settings.tone)}`, mood: EVENT_MOOD.puzzleFail })
    }
  }

  /** Controlla se la partita è finita (matto, patta) o se l'obiettivo è raggiunto. Restituisce l'esito, oppure null. */
  const judge = (g: Chess, afterBot: boolean, n: number): { ok: boolean; text: string } | null => {
    if (g.isCheckmate()) {
      return opposite(g.turn()) === me ? { ok: true, text: `Scacco matto in ${n} ${n === 1 ? 'mossa' : 'mosse'}!` } : { ok: false, text: 'Ti hanno dato matto.' }
    }
    if (g.isDraw()) {
      if (drill.goal === 'draw') return { ok: true, text: 'Patta! Il finale è salvo.' }
      return { ok: false, text: g.isStalemate() ? 'Stallo! Il re avversario non ha mosse ma non è sotto scacco: è patta, non vittoria.' : 'È patta: non hai portato a casa la vittoria.' }
    }
    if (afterBot && drill.goal === 'promote' && heavyCount(g, me) > startHeavy) return { ok: true, text: `Pedone promosso in ${n} ${n === 1 ? 'mossa' : 'mosse'}!` }
    return null
  }

  const onUserMove = async (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (phase !== 'player') return
    const g = game.current
    let mv
    try {
      mv = g.move({ from, to, promotion })
    } catch {
      return
    }
    const n = moves + 1
    setMoves(n)
    setFen(g.fen())
    setLast([from, to])
    setLastBy('me')
    setHint(null)
    setHintLevel(0)
    if (mv.captured) sfx.capture()
    else sfx.move()
    const end = judge(g, false, n)
    if (end) return finish(end.ok, end.text, n)

    setPhase('thinking')
    const my = ++token.current
    const [uci] = await Promise.all([chooseBotMove(g.fen(), bot), sleep(450)])
    if (!alive.current || my !== token.current) return
    const r = parseUci(uci)
    const bm = g.move({ from: r.from, to: r.to, promotion: r.promotion })
    setFen(g.fen())
    setLast([r.from, r.to])
    setLastBy('opp')
    setTimeout(() => {
      if (alive.current && my === token.current) bm.captured ? sfx.capture() : sfx.move()
    }, SLIDE_MS * 0.7)
    await sleep(SLIDE_MS + 100)
    if (!alive.current || my !== token.current) return

    const end2 = judge(g, true, n)
    if (end2) return finish(end2.ok, end2.text, n)
    if (n >= drill.maxMoves) {
      if (drill.goal === 'draw') {
        // se resisti fino alla fine senza essere in svantaggio netto, il finale è salvo
        const ev = await evaluate(g.fen()).catch(() => undefined)
        if (!alive.current || my !== token.current) return
        if (!ev || ev.cp > -150) return finish(true, `Hai resistito ${n} mosse: il finale è salvo.`, n)
        return finish(false, 'Il pedone sta per passare: non sei riuscito a fermarlo.', n)
      }
      return finish(false, `Le ${drill.maxMoves} mosse sono finite.`, n)
    }
    setPhase('player')
  }

  const restart = () => {
    token.current++
    game.current = new Chess(drill.fen)
    setFen(drill.fen)
    setPhase('player')
    setMoves(0)
    setLast(null)
    setHint(null)
    setHintLevel(0)
    setResult(null)
    setCoach({ text: drill.tip, mood: 'cool' })
  }

  /** Torna indietro di una tua mossa (e della risposta del bot): qui allenarsi è lecito. */
  const undo = () => {
    if (phase !== 'player' || moves === 0) return
    token.current++
    game.current.undo()
    game.current.undo()
    setFen(game.current.fen())
    setMoves(moves - 1)
    setLast(null)
    setHint(null)
    setHintLevel(0)
    setCoach({ text: 'Rimessa a posto. Riprova con un’altra idea.', mood: 'neutral' })
  }

  const showHint = async () => {
    if (phase !== 'player') return
    const level = Math.min(hintLevel + 1, 2)
    const best = await bestMoveFor(game.current.fen())
    if (!best || !alive.current) return
    setHintLevel(level)
    setHint({ from: best.slice(0, 2) as Square, to: level >= 2 ? (best.slice(2, 4) as Square) : undefined })
    setCoach({ text: level === 1 ? 'Indizio: muovi il pezzo evidenziato.' : 'Ecco la mossa! La prossima volta la trovi da solo.', mood: 'neutral' })
  }

  const left = drill.maxMoves - moves
  return (
    <div className="screen play">
      <div className="topbar">
        <button className="ghost" onClick={onExit}>
          <ArrowLeft size={20} weight="bold" /> Esci
        </button>
        <div className="title">{drill.title}</div>
      </div>

      <div className="game-shell">
        <div className="game-main">
          <div className="card drill-goal">
            <span>
              <b>Obiettivo</b> · {GOAL_TEXT[drill.goal](drill.maxMoves)}
            </span>
            <span className={`chip${left <= 3 && phase !== 'over' ? ' warn' : ''}`}>
              {moves}/{drill.maxMoves}
            </span>
          </div>
          <Board
            fen={fen}
            orientation={me}
            movable={phase === 'player' ? me : null}
            onMove={onUserMove}
            lastMove={last}
            lastBy={lastBy}
            slowMove={lastBy === 'opp'}
            hint={hint}
          />
        </div>

        <div className="game-side">
          <CoachBubble text={coach.text} mood={coach.mood}>
            {phase === 'over' && result && (
              <div className="row">
                {result.ok && onNext && (
                  <button className="btn primary" onClick={onNext}>
                    Prossimo finale <ArrowRight size={18} weight="bold" />
                  </button>
                )}
                <button className={`btn${result.ok && onNext ? '' : ' primary'}`} onClick={restart}>
                  <ArrowClockwise size={18} weight="bold" /> Riprova
                </button>
                <button className="btn" onClick={onExit}>
                  Esci
                </button>
              </div>
            )}
          </CoachBubble>
          {phase !== 'over' && (
            <div className="actions">
              <button className="btn" onClick={showHint} disabled={phase !== 'player'}>
                <Lightbulb size={20} weight="fill" /> Aiuto{hintLevel ? ` ${hintLevel}/2` : ''}
              </button>
              <button className="btn" onClick={undo} disabled={phase !== 'player' || moves === 0}>
                <ArrowCounterClockwise size={20} weight="bold" /> Annulla
              </button>
              <button className="btn" onClick={restart}>
                <ArrowClockwise size={20} weight="bold" /> Ricomincia
              </button>
            </div>
          )}
          {result?.ok && (
            <p className="muted" style={{ margin: 0 }}>
              {result.first ? '+25 XP per il primo successo.' : '+5 XP.'} Il tuo record: {getState().progress.drills?.[drill.id] ?? result.moves} mosse.
            </p>
          )}
        </div>
      </div>
      {result?.ok && <Confetti />}
    </div>
  )
}
