import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { Board, type Tint } from '../components/Board'
import { CoachBubble } from '../components/CoachBubble'
import { chooseBotMove, type Bot } from '../engine/bots'
import { QUALITY_INFO, bestMoveFor, evaluate, judgeMove, type Judgement, type Quality } from '../engine/analysis'
import { dangerTints, hangingPieces } from '../chess/danger'
import { PIECE_NAME, opposite, parseUci } from '../chess/util'
import { EVENT_MOOD, sayLine, type CoachEvent, type Mood } from '../coach/lines'
import { explainWithGemini } from '../coach/gemini'
import { addXp, bumpMistake, nudgeSkill, touchDay, update, useApp, type DangerMode } from '../store'
import { sfx } from '../sound'

interface MoveRec {
  san: string
  uci: string
  fenBefore: string
  color: Color
  judgement?: Judgement
}

type Phase = 'player' | 'thinking' | 'decide' | 'over'

const DANGER_CYCLE: DangerMode[] = ['off', 'threats', 'full']
const DANGER_LABEL: Record<DangerMode, string> = { off: 'Mappa: off', threats: 'Mappa: minacce', full: 'Mappa: completa' }

function isBad(q: Quality) {
  return q === 'mistake' || q === 'blunder'
}

export function Play({ bot, color, onExit }: { bot: Bot; color: Color; onExit: () => void }) {
  const app = useApp()
  const settings = app.settings
  const game = useRef(new Chess())
  const [fen, setFen] = useState(game.current.fen())
  const [moves, setMoves] = useState<MoveRec[]>([])
  const [last, setLast] = useState<[Square, Square] | null>(null)
  const [phase, setPhase] = useState<Phase>('player')
  const [badge, setBadge] = useState<{ square: Square; icon: string; color: string } | null>(null)
  const [coach, setCoach] = useState<{ text: string; mood: Mood }>({ text: sayLine('start', settings.tone), mood: 'cool' })
  const [hintLevel, setHintLevel] = useState(0)
  const [hint, setHint] = useState<{ from?: Square; to?: Square } | null>(null)
  const [takeback, setTakeback] = useState<{ botUci: string; rec: MoveRec } | null>(null)
  const [result, setResult] = useState<{ outcome: 'win' | 'lose' | 'draw'; reason: string } | null>(null)
  const [explaining, setExplaining] = useState(false)
  const [shake, setShake] = useState(false)
  const started = useRef(false)

  const say = (event: CoachEvent, vars?: { piece?: string; sq?: string }, extra?: string) =>
    setCoach({ text: sayLine(event, settings.tone, vars) + (extra ? ' ' + extra : ''), mood: EVENT_MOOD[event] })

  const finish = (outcome: 'win' | 'lose' | 'draw', reason: string) => {
    setPhase('over')
    setResult({ outcome, reason })
    say(outcome)
    if (outcome === 'win') sfx.win()
    else if (outcome === 'lose') sfx.lose()
    update((s) => {
      const p = s.progress
      touchDay(p)
      p.games += 1
      p.today.game = true
      if (outcome === 'win') {
        p.wins += 1
        if (!p.botsBeaten.includes(bot.id)) p.botsBeaten.push(bot.id)
      }
      p.xp += outcome === 'win' ? 40 + bot.id * 5 : outcome === 'draw' ? 20 : 10
    })
    const diff = bot.id * 10 - 5 - app.progress.skill
    if (outcome === 'win') nudgeSkill(diff > 10 ? 4 : diff > -10 ? 2.5 : 1)
    else if (outcome === 'lose') nudgeSkill(diff < -10 ? -3 : diff < 10 ? -1.5 : -0.5)
  }

  const checkOver = (): boolean => {
    const g = game.current
    if (!g.isGameOver()) return false
    if (g.isCheckmate()) {
      const winner = opposite(g.turn())
      finish(winner === color ? 'win' : 'lose', 'scacco matto')
    } else finish('draw', g.isStalemate() ? 'stallo' : 'patta')
    return true
  }

  const applyBot = (uci: string) => {
    const g = game.current
    const fenBefore = g.fen()
    const { from, to, promotion } = parseUci(uci)
    const mv = g.move({ from, to, promotion })
    setFen(g.fen())
    setLast([from, to])
    setMoves((m) => [...m, { san: mv.san, uci, fenBefore, color: opposite(color) }])
    mv.captured ? sfx.capture() : sfx.move()
    if (!checkOver()) {
      setPhase('player')
      evaluate(g.fen()).catch(() => undefined)
    }
  }

  // se il giocatore è il Nero, muove prima il bot
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (color === 'b') {
      setPhase('thinking')
      chooseBotMove(game.current.fen(), bot).then(applyBot)
    } else evaluate(game.current.fen()).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onUserMove = async (from: Square, to: Square, promotion?: PieceSymbol) => {
    const g = game.current
    if (phase !== 'player' || g.turn() !== color) return
    const fenBefore = g.fen()
    let mv
    try {
      mv = g.move({ from, to, promotion })
    } catch {
      return
    }
    const uci = from + to + (promotion ?? '')
    const rec: MoveRec = { san: mv.san, uci, fenBefore, color }
    setFen(g.fen())
    setLast([from, to])
    setHint(null)
    setHintLevel(0)
    setBadge(null)
    mv.captured ? sfx.capture() : sfx.move()
    setMoves((m) => [...m, rec])
    if (checkOver()) return
    setPhase('thinking')

    const botP = chooseBotMove(g.fen(), bot)
    const judgeP = settings.liveJudging ? judgeMove(fenBefore, uci).catch(() => undefined) : Promise.resolve(undefined)
    const [botUci, j] = await Promise.all([botP, judgeP])

    if (j) {
      rec.judgement = j
      setMoves((m) => m.map((x) => (x === rec || (x.uci === rec.uci && x.fenBefore === rec.fenBefore) ? { ...rec } : x)))
      const info = QUALITY_INFO[j.quality]
      setBadge({ square: to, icon: info.icon, color: info.color })
      if (j.quality === 'brilliant') sfx.brilliant()
      else if (isBad(j.quality)) sfx.bad()
      else if (j.quality === 'best' || j.quality === 'great') sfx.good()

      const hang = hangingPieces(g, color)
      if (isBad(j.quality)) {
        bumpMistake(hang.length ? 'Pezzi lasciati in presa' : 'Mosse distratte')
        const h = hang[0]
        if (h) {
          setCoach({
            text: sayLine(j.quality === 'blunder' ? 'blunder' : 'mistake', settings.tone) + ' ' + sayLine('hanging', settings.tone, { piece: h.piece, sq: h.square }),
            mood: EVENT_MOOD[j.quality === 'blunder' ? 'blunder' : 'mistake'],
          })
        } else say(j.quality === 'blunder' ? 'blunder' : 'mistake')
        setTakeback({ botUci, rec })
        setPhase('decide')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      if (j.quality === 'inaccuracy') say('inaccuracy')
      else if (j.quality === 'brilliant') say('brilliant')
      else if (j.quality === 'best' || j.quality === 'great') say('best')
      else say('good')
      addXp(j.quality === 'brilliant' ? 8 : j.quality === 'best' ? 3 : 1)
    }
    applyBot(botUci)
  }

  const doTakeback = () => {
    if (!takeback) return
    const g = game.current
    g.undo()
    setFen(g.fen())
    setMoves((m) => m.slice(0, -1))
    setLast(null)
    setBadge(null)
    setTakeback(null)
    setPhase('player')
    setCoach({ text: sayLine('puzzleFail', settings.tone), mood: 'neutral' })
  }
  const keepMove = () => {
    if (!takeback) return
    const { botUci } = takeback
    setTakeback(null)
    setBadge(null)
    applyBot(botUci)
  }

  const showHint = async () => {
    if (phase !== 'player') return
    const best = await bestMoveFor(game.current.fen())
    if (!best) return
    const { from, to } = parseUci(best)
    const piece = game.current.get(from)
    const level = Math.min(hintLevel + 1, 3)
    setHintLevel(level)
    if (level === 1) {
      setCoach({ text: `Indizio: guarda ${piece ? 'il tuo ' + PIECE_NAME[piece.type] : 'un tuo pezzo'}. Ha qualcosa da fare.`, mood: 'neutral' })
    } else if (level === 2) {
      setHint({ from })
      setCoach({ text: 'Ecco il pezzo. Ora trova dove va!', mood: 'neutral' })
    } else {
      setHint({ from, to })
      setCoach({ text: 'Ti ho mostrato la mossa. Alla prossima ci provi da solo.', mood: 'cool' })
    }
  }

  const explain = async (rec: MoveRec) => {
    const j = rec.judgement
    if (!j) return
    setExplaining(true)
    const base = new Chess(rec.fenBefore)
    let bestSan: string | undefined
    if (j.bestUci) {
      try {
        const p = parseUci(j.bestUci)
        bestSan = base.move({ from: p.from, to: p.to, promotion: p.promotion }).san
      } catch {
        bestSan = undefined
      }
    }
    const facts: string[] = []
    const after = new Chess(rec.fenBefore)
    try {
      const p = parseUci(rec.uci)
      after.move({ from: p.from, to: p.to, promotion: p.promotion })
      const h = hangingPieces(after, rec.color)
      if (h.length) facts.push(`Dopo la mossa il pezzo ${PIECE_NAME[h[0].piece as PieceSymbol]} in ${h[0].square} resta attaccato e non protetto.`)
    } catch {
      /* ignora */
    }
    const ai = await explainWithGemini(settings.geminiKey, {
      fen: rec.fenBefore,
      playedSan: rec.san,
      bestSan,
      quality: QUALITY_INFO[j.quality].label,
      tone: settings.tone,
      facts,
    })
    setExplaining(false)
    setCoach({
      text: ai ?? `${QUALITY_INFO[j.quality].label}.${bestSan ? ` La mossa migliore era ${bestSan}.` : ''}${facts[0] ? ' ' + facts[0] : ''}`,
      mood: isBad(j.quality) ? 'angry' : 'cool',
    })
  }

  const { tints, rings } = useMemo(() => {
    let t: Partial<Record<Square, Tint>> = {}
    let r: Square[] = []
    if (settings.danger !== 'off') {
      try {
        const c = new Chess(fen)
        t = dangerTints(c, color, settings.danger)
        r = hangingPieces(c, color).map((h) => h.square)
      } catch {
        /* fen non valido: niente overlay */
      }
    }
    return { tints: t, rings: r }
  }, [fen, settings.danger, color])

  const worst = useMemo(() => {
    const judged = moves.filter((m) => m.judgement && m.color === color)
    return judged.sort((a, b) => b.judgement!.loss - a.judgement!.loss)[0]
  }, [moves, color])

  const lastUserMove = useMemo(() => [...moves].reverse().find((m) => m.color === color), [moves, color])

  const counts = useMemo(() => {
    const c: Partial<Record<Quality, number>> = {}
    for (const m of moves) if (m.judgement && m.color === color) c[m.judgement.quality] = (c[m.judgement.quality] ?? 0) + 1
    return c
  }, [moves, color])

  const cycleDanger = () => {
    const next = DANGER_CYCLE[(DANGER_CYCLE.indexOf(settings.danger) + 1) % DANGER_CYCLE.length]
    update((s) => {
      s.settings.danger = next
    })
  }

  const movable = phase === 'player' ? color : null

  return (
    <div className="screen play">
      <div className="topbar">
        <button className="ghost" onClick={onExit}>← Esci</button>
        <div className="opp">
          <span className="opp-emoji">{bot.emoji}</span> {bot.name}
          {phase === 'thinking' && <span className="thinking">pensa…</span>}
        </div>
      </div>

      <Board
        fen={fen}
        orientation={color}
        movable={movable}
        onMove={onUserMove}
        lastMove={last}
        tints={tints}
        rings={rings}
        hint={hint}
        badge={badge}
        shake={shake}
      />

      <CoachBubble text={explaining ? 'Fammi pensare…' : coach.text} mood={coach.mood}>
        {phase === 'decide' && takeback && (
          <div className="row">
            <button className="btn primary" onClick={doTakeback}>↩ Ritira la mossa</button>
            <button className="btn" onClick={keepMove}>Lascia stare</button>
          </div>
        )}
        {phase === 'over' && result && (
          <div className="result">
            <div className="summary">
              {(Object.keys(counts) as Quality[]).map((q) => (
                <span key={q} className="chip" style={{ background: QUALITY_INFO[q].color }}>
                  {QUALITY_INFO[q].icon} {counts[q]}
                </span>
              ))}
            </div>
            {worst && worst.judgement && isBad(worst.judgement.quality) && (
              <button className="btn" onClick={() => explain(worst)}>🔍 Spiegami il tuo errore peggiore</button>
            )}
            <div className="row">
              <button className="btn primary" onClick={onExit}>Continua</button>
            </div>
          </div>
        )}
      </CoachBubble>

      {phase !== 'over' && (
        <div className="row actions">
          <button className="btn" onClick={showHint} disabled={phase !== 'player'}>💡 Aiuto{hintLevel ? ` (${hintLevel}/3)` : ''}</button>
          {lastUserMove?.judgement && phase === 'player' && (
            <button className="btn" onClick={() => explain(lastUserMove)}>🔍 Perché?</button>
          )}
          <button className="btn" onClick={cycleDanger}>🗺️ {DANGER_LABEL[settings.danger].replace('Mappa: ', '')}</button>
          <button
            className="btn"
            onClick={() => {
              if (confirm('Ti arrendi?')) finish('lose', 'resa')
            }}
          >
            🏳️ Resa
          </button>
        </div>
      )}
      {settings.danger !== 'off' && phase !== 'over' && (
        <div className="legend">
          <span className="lg danger" /> casa attaccata dall’avversario
          {settings.danger === 'full' && (
            <>
              <span className="lg safe" /> controllata da te
            </>
          )}
          <span className="lg ring" /> tuo pezzo in presa
        </div>
      )}
    </div>
  )
}
