import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, Flag, GraduationCap, Lightbulb, MagnifyingGlass, MapTrifold } from '@phosphor-icons/react'
import { Board, type Tint } from '../components/Board'
import { BotAvatar } from '../components/BotAvatar'
import { Confetti, MoveList, PlayerBar, type MoveRow } from '../components/GameParts'
import { CoachBubble } from '../components/CoachBubble'
import { GameReview, pickReviewItems } from '../components/GameReview'
import { chooseBotMove, type Bot } from '../engine/bots'
import { QUALITY_INFO, bestMoveFor, evaluate, judgeMove, type Judgement, type Quality } from '../engine/analysis'
import { dangerTints, hangingPieces } from '../chess/danger'
import { PIECE_NAME, opposite, parseUci } from '../chess/util'
import { EVENT_MOOD, sayLine, type CoachEvent, type Mood } from '../coach/lines'
import { explainWithGemini } from '../coach/gemini'
import { addXp, bumpMistake, getState, nudgeSkill, rememberGame, touchDay, update, useApp, type DangerMode } from '../store'
import { sfx } from '../sound'

interface MoveRec {
  san: string
  uci: string
  fenBefore: string
  color: Color
  judgement?: Judgement
}

type Phase = 'player' | 'thinking' | 'reply' | 'decide' | 'over'

/** pausa minima prima della mossa dell'avversario, così la sua mossa non è istantanea */
const THINK_MS = 900
/** durata dell'animazione del pezzo che si muove (vedi .board.slow in styles.css) */
const SLIDE_MS = 700
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const DANGER_CYCLE: DangerMode[] = ['off', 'threats', 'full']
const DANGER_LABEL: Record<DangerMode, string> = { off: 'Spenta', threats: 'Minacce', full: 'Completa' }

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
  const [lastBy, setLastBy] = useState<'me' | 'opp'>('me')
  const [botSan, setBotSan] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('player')
  const [badge, setBadge] = useState<{ square: Square; icon: string; color: string } | null>(null)
  const [coach, setCoach] = useState<{ text: string; mood: Mood }>({ text: sayLine('start', settings.tone), mood: 'cool' })
  const [hintLevel, setHintLevel] = useState(0)
  const [hint, setHint] = useState<{ from?: Square; to?: Square } | null>(null)
  const [takeback, setTakeback] = useState<{ botUci: string; rec: MoveRec } | null>(null)
  const [result, setResult] = useState<{ outcome: 'win' | 'lose' | 'draw'; reason: string } | null>(null)
  const [shake, setShake] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const started = useRef(false)
  /** false dopo l'uscita dalla partita: i timer e le risposte del motore arrivati in ritardo non devono più fare nulla */
  const alive = useRef(true)
  const retracts = useRef(0)
  const badMoves = useRef(0)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  const say = (event: CoachEvent, vars?: { piece?: string; sq?: string }, extra?: string) =>
    setCoach({ text: sayLine(event, settings.tone, vars) + (extra ? ' ' + extra : ''), mood: EVENT_MOOD[event] })

  const finish = (outcome: 'win' | 'lose' | 'draw', reason: string) => {
    if (!alive.current) return
    setPhase('over')
    setResult({ outcome, reason })
    const before = getState().progress
    const isFirstWin = outcome === 'win' && before.wins === 0 && !(before.gigi?.firsts ?? []).includes('firstWin')
    const isNewBot = outcome === 'win' && !before.botsBeaten.includes(bot.id)
    if (isFirstWin) say('firstWin')
    else if (isNewBot) setCoach({ text: sayLine('botBeaten', settings.tone, { bot: bot.name }), mood: EVENT_MOOD.botBeaten })
    else say(outcome)
    if (outcome === 'win') sfx.win()
    else if (outcome === 'lose') sfx.lose()
    rememberGame(bot.id, outcome, retracts.current, badMoves.current, isFirstWin ? 'firstWin' : undefined)
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
    const diff = bot.id * 10 - 5 - before.skill
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
    setPhase('reply')
    setFen(g.fen())
    setLast([from, to])
    setLastBy('opp')
    setBotSan(mv.san)
    setMoves((m) => [...m, { san: mv.san, uci, fenBefore, color: opposite(color) }])
    // il suono parte quando il pezzo arriva, la partita riprende a movimento finito
    setTimeout(() => {
      if (alive.current) mv.captured ? sfx.capture() : sfx.move()
    }, SLIDE_MS * 0.7)
    setTimeout(() => {
      if (!alive.current) return
      if (!checkOver()) {
        setPhase('player')
        evaluate(g.fen()).catch(() => undefined)
      }
    }, SLIDE_MS + 120)
  }

  // se il giocatore è il Nero, muove prima il bot
  useEffect(() => {
    if (started.current) return
    started.current = true
    if (color === 'b') {
      setPhase('thinking')
      Promise.all([chooseBotMove(game.current.fen(), bot), sleep(700)]).then(([uci]) => {
        if (alive.current) applyBot(uci)
      })
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
    setLastBy('me')
    setHint(null)
    setHintLevel(0)
    setBadge(null)
    mv.captured ? sfx.capture() : sfx.move()
    setMoves((m) => [...m, rec])
    if (checkOver()) return
    setPhase('thinking')

    const botP = chooseBotMove(g.fen(), bot)
    const judgeP = settings.liveJudging ? judgeMove(fenBefore, uci).catch(() => undefined) : Promise.resolve(undefined)
    const [botUci, j] = await Promise.all([botP, judgeP, sleep(THINK_MS)]).then(([b, jj]) => [b, jj] as const)
    if (!alive.current) return

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
        badMoves.current += 1
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
      // un momento particolare (cattura della regina, arrocco, scacco…) rimpiazza il commento generico: Gigi non parla di più, parla meglio
      const prevOwn = [...moves].reverse().find((m) => m.color === color)
      const shuffled = !!prevOwn && prevOwn.uci.slice(0, 2) === to && prevOwn.uci.slice(2, 4) === from
      const best = j.quality === 'best' || j.quality === 'great'
      const special: CoachEvent | null =
        mv.captured === 'q'
          ? 'queenTake'
          : mv.promotion
            ? 'promote'
            : mv.flags.includes('k') || mv.flags.includes('q')
              ? 'castle'
              : g.inCheck()
                ? 'check'
                : null
      if (j.quality === 'brilliant') say('brilliant')
      else if (shuffled && !best) say('nonsense')
      else if (j.quality === 'inaccuracy') say('inaccuracy')
      else if (special) say(special)
      else if (best) say('best')
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
    setLastBy('me')
    setBadge(null)
    setTakeback(null)
    setPhase('player')
    retracts.current += 1
    say('retract')
  }
  const keepMove = () => {
    if (!takeback) return
    const { botUci } = takeback
    setTakeback(null)
    setBadge(null)
    setPhase('thinking')
    sleep(450).then(() => {
      if (alive.current) applyBot(botUci)
    })
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
    setCoach({ text: sayLine('thinking', settings.tone), mood: 'thinking' })
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
    if (!alive.current) return
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

  // a partita finita: se il giudizio live era spento, Gigi riguarda in silenzio le tue mosse
  useEffect(() => {
    if (phase !== 'over') return
    const todo = moves.filter((m) => m.color === color && !m.judgement).slice(0, 50)
    if (todo.length === 0) return
    let alive = true
    setAnalysing(true)
    ;(async () => {
      for (const m of todo) {
        try {
          const j = await judgeMove(m.fenBefore, m.uci)
          if (!alive) return
          setMoves((ms) => ms.map((x) => (x.fenBefore === m.fenBefore && x.uci === m.uci ? { ...x, judgement: j } : x)))
        } catch {
          /* mossa non analizzabile: pazienza */
        }
      }
      if (alive) setAnalysing(false)
    })()
    return () => {
      alive = false
      setAnalysing(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // se resti fermo a lungo, Gigi si appisola (solo se tocca a te e la partita è in corso)
  useEffect(() => {
    if (phase !== 'player') return
    const t = setTimeout(() => {
      if (alive.current) setCoach({ text: sayLine('idleNap', settings.tone), mood: 'sleepy' })
    }, 100_000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, fen])

  const reviewItems = useMemo(() => (phase === 'over' ? pickReviewItems(moves, color) : []), [moves, color, phase])

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

  const moveRows: MoveRow[] = moves.map((m) => ({ san: m.san, color: m.color, quality: m.color === color ? m.judgement?.quality : undefined }))
  const oppColor: Color = opposite(color)
  const myTurn = phase === 'player'
  const meAvatar = (
    <span className="me-avatar">
      <img src={`${import.meta.env.BASE_URL}pieces/${color}P.svg`} width={28} height={28} alt="" />
    </span>
  )

  return (
    <div className="screen play">
      <div className="topbar">
        <button className="ghost" onClick={onExit}>
          <ArrowLeft size={20} weight="bold" /> Esci
        </button>
        <div className="title">Partita contro {bot.name}</div>
      </div>

      <div className="game-shell">
        <div className="game-main">
          <PlayerBar
            avatar={<BotAvatar id={bot.id} size={40} />}
            name={bot.name}
            sub={phase === 'thinking' ? 'Sta pensando…' : botSan ? `Ha giocato ${botSan}` : 'Avversario'}
            color={oppColor}
            fen={fen}
            active={phase === 'thinking' || phase === 'reply'}
          />
          <Board
            fen={fen}
            orientation={color}
            movable={movable}
            onMove={onUserMove}
            lastMove={last}
            lastBy={lastBy}
            slowMove={lastBy === 'opp'}
            tints={tints}
            rings={rings}
            hint={hint}
            badge={badge}
            shake={shake}
          />
          <PlayerBar avatar={meAvatar} name="Tu" sub={myTurn ? 'Tocca a te' : undefined} color={color} fen={fen} active={myTurn} />
        </div>

        <div className="game-side">
          <CoachBubble text={coach.text} mood={coach.mood}>
            {phase === 'decide' && takeback && (
              <div className="row">
                <button className="btn primary" onClick={doTakeback}>
                  <ArrowCounterClockwise size={18} weight="bold" /> Ritira la mossa
                </button>
                <button className="btn" onClick={keepMove}>
                  Lascia stare
                </button>
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
                {analysing && <p className="review-note">Gigi sta riguardando la partita…</p>}
                {!analysing && reviewItems.length > 0 && (
                  <button className="btn primary" onClick={() => setReviewOpen(true)}>
                    <GraduationCap size={18} weight="bold" /> Rivedi {reviewItems.length === 1 ? 'il tuo errore' : `i tuoi ${reviewItems.length} errori`}
                  </button>
                )}
                {!analysing && reviewItems.length === 0 && moves.some((m) => m.judgement) && <p className="review-note">Nessun errore grave da rivedere. Niente male!</p>}
                <div className="row">
                  <button className="btn primary" onClick={onExit}>
                    Continua <ArrowRight size={18} weight="bold" />
                  </button>
                </div>
              </div>
            )}
          </CoachBubble>

          {phase !== 'over' && (
            <div className="actions">
              <button className="btn" onClick={showHint} disabled={phase !== 'player'}>
                <Lightbulb size={20} weight="fill" /> Aiuto{hintLevel ? ` ${hintLevel}/3` : ''}
              </button>
              {lastUserMove?.judgement && phase === 'player' && (
                <button className="btn" onClick={() => explain(lastUserMove)}>
                  <MagnifyingGlass size={20} weight="bold" /> Perché?
                </button>
              )}
              <button className="btn" onClick={cycleDanger}>
                <MapTrifold size={20} weight="duotone" /> Mappa: {DANGER_LABEL[settings.danger]}
              </button>
              <button
                className="btn"
                onClick={() => {
                  if (confirm('Ti arrendi?')) finish('lose', 'resa')
                }}
              >
                <Flag size={20} weight="fill" /> Resa
              </button>
            </div>
          )}

          {settings.danger !== 'off' && phase !== 'over' && (
            <div className="legend">
              <span>
                <span className="lg danger" />
                attaccata dall’avversario
              </span>
              {settings.danger === 'full' && (
                <span>
                  <span className="lg safe" />
                  controllata da te
                </span>
              )}
              <span>
                <span className="lg ring" />
                tuo pezzo in presa
              </span>
            </div>
          )}

          <div className="card" style={{ padding: 12 }}>
            <MoveList moves={moveRows} />
          </div>
        </div>
      </div>
      {phase === 'over' && result?.outcome === 'win' && <Confetti />}
      {reviewOpen && reviewItems.length > 0 && (
        <GameReview items={reviewItems} color={color} tone={settings.tone} geminiKey={settings.geminiKey} onClose={() => setReviewOpen(false)} />
      )}
    </div>
  )
}
