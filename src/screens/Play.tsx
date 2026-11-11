import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ArrowCounterClockwise, ArrowLeft, ArrowRight, ArrowUUpLeft, ArrowsClockwise, BookOpenText, Compass, DotsThree, Flag, GraduationCap, Lightbulb, MagnifyingGlass, MapTrifold, Rewind, Warning } from '@phosphor-icons/react'
import { EvalBar } from '../components/EvalBar'
import { QualityIcon } from '../components/QualityIcon'
import { Board, type Tint } from '../components/Board'
import { BotAvatar } from '../components/BotAvatar'
import { Confetti, MoveList, PlayerBar, type MoveRow } from '../components/GameParts'
import { CoachBubble } from '../components/CoachBubble'
import { GameReview, pickReviewItems } from '../components/GameReview'
import { GameReplay } from '../components/GameReplay'
import { MISTAKE_INFO, buildRecord, classifyMistake } from '../engine/mistakes'
import { chooseBotMove, type Bot } from '../engine/bots'
import { STYLES } from '../engine/style'
import { QUALITY_INFO, bestMoveFor, evaluate, judgeMove, winPct, type Quality } from '../engine/analysis'
import { adviceFor, type Advice } from '../chess/advice'
import { dangerTints, hangingPieces, mateInOne, threatsFor } from '../chess/danger'
import { PIECE_NAME, opposite, parseUci } from '../chess/util'
import { EVENT_MOOD, sayLine, type CoachEvent, type Mood } from '../coach/lines'
import { explainWithGemini, summarizeGameWithGemini } from '../coach/gemini'
import { coachInfo } from '../coach/coaches'
import { addGameRecord, addToNotebook, addXp, bumpMistake, currentCoach, getState, nudgeSkill, rememberGame, todayStr, touchDay, update, useApp, type DangerMode, type NotebookDraft } from '../store'
import { sfx } from '../sound'
import { watchFrames } from '../perf'
import { clearSavedGame, replayMoves, saveGame, type SavedGame, type SavedMove } from '../savedGame'

type MoveRec = SavedMove

/** "Dov'è il guaio?": le case che valgono come risposta, e la mossa con cui l'avversario ti punisce */
interface Quiz {
  targets: Square[]
  refute?: [Square, Square]
  tries: number
  done: boolean
}

function draftFrom(rec: MoveRec, tag: string): NotebookDraft | null {
  const j = rec.judgement
  if (!j?.bestUci) return null
  return {
    fen: rec.fenBefore,
    color: rec.color,
    best: j.bestUci,
    played: rec.uci,
    playedSan: rec.san,
    tag,
    j: { quality: j.quality, loss: j.loss, cpAfter: j.cpAfter, missedMate: j.missedMate },
  }
}

type Phase = 'player' | 'thinking' | 'reply' | 'decide' | 'over'

/** pausa minima prima della mossa dell'avversario, così la sua mossa non è istantanea */
const THINK_MS = 400
/** durata dell'animazione del pezzo che si muove (vedi .board.slow in styles.css) */
const SLIDE_MS = 300
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

const DANGER_CYCLE: DangerMode[] = ['off', 'threats', 'full']
const DANGER_LABEL: Record<DangerMode, string> = { off: 'Spenta', threats: 'Minacce', full: 'Completa' }

export interface ThreatStats {
  seen: number
  handled: number
  missed: number
  asked: number
}

function isBad(q: Quality) {
  return q === 'mistake' || q === 'blunder'
}

export function Play({ bot, color, resume, onExit, onRematch }: { bot: Bot; color: Color; resume?: SavedGame; onExit: () => void; onRematch?: () => void }) {
  const app = useApp()
  const settings = app.settings
  const game = useRef<Chess>(null as unknown as Chess)
  // partita ripresa: si rigiocano le mosse salvate (se qualcosa non torna si ricomincia da capo)
  const resumed = useRef<SavedMove[] | null>(null)
  if (!game.current) {
    const g = resume ? replayMoves(resume.moves) : null
    resumed.current = g ? resume!.moves : null
    game.current = g ?? new Chess()
  }
  const lastSaved = resumed.current?.[resumed.current.length - 1]
  const [fen, setFen] = useState(game.current.fen())
  const [moves, setMoves] = useState<MoveRec[]>(resumed.current ?? [])
  const [last, setLast] = useState<[Square, Square] | null>(lastSaved ? [lastSaved.uci.slice(0, 2) as Square, lastSaved.uci.slice(2, 4) as Square] : null)
  const [lastBy, setLastBy] = useState<'me' | 'opp'>(lastSaved && lastSaved.color !== color ? 'opp' : 'me')
  const [botSan, setBotSan] = useState<string | null>([...(resumed.current ?? [])].reverse().find((m) => m.color !== color)?.san ?? null)
  const [phase, setPhase] = useState<Phase>(resumed.current && game.current.turn() !== color ? 'thinking' : 'player')
  const [advice, setAdvice] = useState<Advice | null>(null)
  const [opening, setOpening] = useState<string | null>(null)
  const [badge, setBadge] = useState<{ square: Square; icon: ReactNode; color: string; kind?: string } | null>(null)
  const [coach, setCoach] = useState<{ text: string; mood: Mood }>(() => {
    const ev: CoachEvent = resumed.current ? 'resume' : 'start'
    // contro un bot con uno stile, il consiglio per affrontarlo si aggiunge alla frase d'inizio (una volta, a inizio partita)
    const tip = !resumed.current && bot.style !== 'balanced' ? ` ${STYLES[bot.style].label}: ${STYLES[bot.style].tip}` : ''
    return { text: sayLine(ev, settings.tone, { bot: bot.name }) + tip, mood: EVENT_MOOD[ev] }
  })
  const [hintLevel, setHintLevel] = useState(0)
  const [hint, setHint] = useState<{ from?: Square; to?: Square } | null>(null)
  const [takeback, setTakeback] = useState<{ botUci: string; rec: MoveRec; tag: string } | null>(null)
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [result, setResult] = useState<{ outcome: 'win' | 'lose' | 'draw'; reason: string } | null>(null)
  const [shake, setShake] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [replayOpen, setReplayOpen] = useState(false)
  const [analysing, setAnalysing] = useState(false)
  const [analysisReady, setAnalysisReady] = useState(false)
  const [cleanNote, setCleanNote] = useState<string | null>(null)
  const [notebookNote, setNotebookNote] = useState<string | null>(null)
  /** commento di fine partita di Gemini (facoltativo): 'loading' mentre scrive, poi il testo; se non arriva non si vede nulla */
  const [summary, setSummary] = useState<'loading' | string | null>(null)
  const notebookSaved = useRef(false)
  const ownMoves = useRef(resumed.current ? resumed.current.filter((m) => m.color === color).length : 0)
  const started = useRef(false)
  /** false dopo l'uscita dalla partita: i timer e le risposte del motore arrivati in ritardo non devono più fare nulla */
  const alive = useRef(true)
  const retracts = useRef(resumed.current ? (resume?.retracts ?? 0) : 0)
  const badMoves = useRef(resumed.current ? (resume?.badMoves ?? 0) : 0)
  /** "Cosa minaccia?": minacce incontrate in partita, quante hai parato e quante lasciato lì, quante volte hai chiesto aiuto */
  const threatStats = useRef<ThreatStats>({ seen: 0, handled: 0, missed: 0, asked: 0 })
  /** la minaccia della posizione in cui sei adesso (se c'è) e se hai guardato con T */
  const pendingThreat = useRef<{ asked: boolean } | null>(null)
  /** l'ultima minaccia risolta con una mossa, per annullarla se ritiri la mossa */
  const resolvedThreat = useRef<{ asked: boolean; kind: 'handled' | 'missed' } | null>(null)
  const seenThreatFens = useRef(new Set<string>())
  const [threatView, setThreatView] = useState<{ rings: Square[]; arrows: [Square, Square, string][] } | null>(null)
  /** quante mosse sono state giocate nella posizione che stai rivedendo; null = la posizione attuale */
  const [viewPly, setViewPly] = useState<number | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [resignAsk, setResignAsk] = useState(false)

  useEffect(() => {
    alive.current = true
    // se il dispositivo fatica anche con la scacchiera in movimento, il livello automatico degli effetti scende
    const t = window.setTimeout(() => watchFrames(4000), 2500)
    return () => {
      alive.current = false
      clearTimeout(t)
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
    // partita pulita: giocata davvero (almeno 8 mosse tue), con il giudizio acceso e senza nessun ritiro
    if (reason !== 'resa' && retracts.current === 0 && ownMoves.current >= 8 && settings.liveJudging) {
      update((s) => {
        s.progress.cleanGames = (s.progress.cleanGames ?? 0) + 1
        s.progress.xp += 15
      })
      setCleanNote(sayLine('cleanGame', settings.tone))
    }
    update((s) => {
      const p = s.progress
      touchDay(p)
      p.games += 1
      p.today.game = true
      if (outcome === 'win') {
        p.wins += 1
        if (!p.botsBeaten.includes(bot.id)) p.botsBeaten.push(bot.id)
      }
      p.xp += outcome === 'win' ? 40 + Math.round(bot.rank * 2.5) : outcome === 'draw' ? 20 : 10
    })
    const diff = bot.rank * 5 - 2.5 - before.skill
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
    if (game.current.turn() !== color) {
      setPhase('thinking')
      Promise.all([chooseBotMove(game.current.fen(), bot), sleep(THINK_MS)]).then(([uci]) => {
        if (alive.current) applyBot(uci)
      })
    } else evaluate(game.current.fen()).catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // la partita si salva da sola a ogni mossa: se chiudi la scheda la ritrovi nella Home.
  // Se hai appena fatto una mossa da ritirare, si salva la posizione prima, così puoi rifarla con calma.
  useEffect(() => {
    if (phase === 'over') {
      clearSavedGame()
      return
    }
    const keep = phase === 'decide' ? moves.slice(0, -1) : moves
    if (keep.length === 0) return
    saveGame({ botId: bot.id, color, moves: keep, retracts: retracts.current, badMoves: badMoves.current })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moves, phase])

  // a ogni nuova posizione in cui tocca a te: si guarda se l'avversario minaccia qualcosa (si conta una volta sola per posizione)
  useEffect(() => {
    setThreatView(null)
    if (phase !== 'player') return
    const g = game.current
    if (g.turn() !== color) return
    const key = g.fen()
    if (seenThreatFens.current.has(key)) return
    seenThreatFens.current.add(key)
    const t = threatsFor(g, color)
    if (t.hanging.length > 0 || t.mate) {
      pendingThreat.current = { asked: false }
      threatStats.current.seen += 1
    } else pendingThreat.current = null
    resolvedThreat.current = null
  }, [fen, phase, color])

  /** "Cosa minaccia?": evidenzia cosa vuole fare l'avversario e lo dice a parole. Non rivela la mossa giusta. */
  const showThreats = () => {
    if (phase !== 'player' || viewPly !== null || game.current.turn() !== color) return
    if (threatView) {
      setThreatView(null)
      return
    }
    const g = game.current
    const t = threatsFor(g, color)
    threatStats.current.asked += 1
    if (pendingThreat.current) pendingThreat.current.asked = true
    const rings: Square[] = t.hanging.map((h) => h.square)
    const arrows: [Square, Square, string][] = []
    const parts: string[] = []
    if (t.mate) {
      rings.push(t.mate.king)
      arrows.push([t.mate.from, t.mate.to, '#ff4d5e'])
      parts.push(`Attenzione: se non fai nulla, l’avversario dà matto con ${t.mate.san}!`)
    }
    for (const h of t.hanging.slice(0, 2)) {
      parts.push(`Il tuo ${PIECE_NAME[h.piece as PieceSymbol]} in ${h.square} è attaccato e rischi di perderlo.`)
    }
    setThreatView({ rings, arrows })
    setCoach(
      parts.length
        ? { text: parts.join(' '), mood: t.mate ? 'angry' : 'neutral' }
        : { text: 'Nessuna minaccia immediata: niente pezzi in presa né matti in arrivo. Ora pensa a cosa vuoi fare tu.', mood: 'cool' },
    )
  }
  /** "Cosa faccio?": la routine di ogni mossa e i consigli della fase, calcolati sulla posizione. */
  const toggleAdvice = () => {
    if (phase !== 'player' || viewPly !== null || game.current.turn() !== color) return
    if (advice) {
      setAdvice(null)
      return
    }
    setAdvice(adviceFor(game.current, color))
  }
  const toggleAdviceRef = useRef(toggleAdvice)
  toggleAdviceRef.current = toggleAdvice
  const showThreatsRef = useRef(showThreats)
  showThreatsRef.current = showThreats
  /** Rivedi la posizione dopo `ply` mosse; arrivato all'ultima si torna alla partita. */
  const goPly = (ply: number) => {
    const n = moves.length
    const p = Math.max(0, Math.min(n, ply))
    setViewPly(p >= n ? null : p)
  }
  const navRef = useRef({ goPly, cur: 0, blocked: false })
  navRef.current = { goPly, cur: viewPly ?? moves.length, blocked: reviewOpen || replayOpen }
  // a ogni mossa nuova si torna a guardare la posizione attuale
  useEffect(() => setViewPly(null), [moves.length])
  // scorciatoie da tastiera: ← → (Inizio/Fine) per rivedere le mosse, T = "cosa minaccia?", C = consigli, Esc chiude il menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const tag = (e.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      const nav = navRef.current
      if (nav.blocked) return
      const step = e.key === 'ArrowLeft' ? nav.cur - 1 : e.key === 'ArrowRight' ? nav.cur + 1 : e.key === 'Home' ? 0 : e.key === 'End' ? Infinity : null
      if (step !== null) {
        e.preventDefault()
        nav.goPly(step)
        return
      }
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setResignAsk(false)
        return
      }
      const k = e.key.toLowerCase()
      if (k !== 't' && k !== 'c') return
      e.preventDefault()
      if (k === 't') showThreatsRef.current()
      else toggleAdviceRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  // il menu "Altro" si chiude toccando fuori
  useEffect(() => {
    if (!menuOpen) return
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement | null)?.closest?.('.more')) {
        setMenuOpen(false)
        setResignAsk(false)
      }
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [menuOpen])

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
    // se c'era una minaccia: l'hai parata con questa mossa o è ancora lì?
    if (pendingThreat.current) {
      const still = hangingPieces(g, color).length > 0 || !!mateInOne(g)
      const kind = still ? 'missed' : 'handled'
      threatStats.current[kind] += 1
      resolvedThreat.current = { asked: pendingThreat.current.asked, kind }
      pendingThreat.current = null
    }
    setAdvice(null)
    const uci = from + to + (promotion ?? '')
    const rec: MoveRec = { san: mv.san, uci, fenBefore, color }
    ownMoves.current += 1
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
    const histBefore = g.history().slice(0, -1)
    const prevOwnJ = [...moves].reverse().find((m) => m.color === color)?.judgement
    const prevWin = prevOwnJ ? winPct(prevOwnJ.cpAfter) : undefined
    const judgeP = settings.liveJudging ? judgeMove(fenBefore, uci, { history: histBefore, prevWin }).catch(() => undefined) : Promise.resolve(undefined)
    const [botUci, j] = await Promise.all([botP, judgeP, sleep(THINK_MS)]).then(([b, jj]) => [b, jj] as const)
    if (!alive.current) return

    if (j) {
      rec.judgement = j
      setMoves((m) => m.map((x) => (x === rec || (x.uci === rec.uci && x.fenBefore === rec.fenBefore) ? { ...rec } : x)))
      const info = QUALITY_INFO[j.quality]
      setBadge({ square: to, icon: <QualityIcon q={j.quality} />, color: info.color, kind: j.quality })
      if (j.quality === 'brilliant') sfx.brilliant()
      else if (isBad(j.quality)) sfx.bad()
      else if (j.quality === 'best' || j.quality === 'great' || j.quality === 'excellent') sfx.good()

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
        setTakeback({ botUci, rec, tag: hang.length ? 'Pezzi lasciati in presa' : 'Mosse distratte' })
        setQuiz(null)
        setPhase('decide')
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
      // un momento particolare (cattura della regina, arrocco, scacco…) rimpiazza il commento generico: Gigi non parla di più, parla meglio
      const prevOwn = [...moves].reverse().find((m) => m.color === color)
      const shuffled = !!prevOwn && prevOwn.uci.slice(0, 2) === to && prevOwn.uci.slice(2, 4) === from
      const best = j.quality === 'best' || j.quality === 'great'
      const quiet = j.quality === 'book' || j.quality === 'forced'
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
      else if (j.quality === 'miss') say('miss')
      else if (j.quality === 'book') {
        // parla solo quando compare un'apertura nuova: niente chiacchiere ad ogni mossa di libro
        if (j.opening && j.opening !== opening) say('book')
        setOpening(j.opening ?? opening)
      } else if (quiet) setOpening(j.opening ?? opening)
      else if (j.quality === 'great') say('great')
      else if (best) say('best')
      else say('good')
      addXp(j.quality === 'brilliant' ? 8 : j.quality === 'great' ? 5 : j.quality === 'best' ? 3 : 1)
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
    // l'errore ritirato non sparisce: finisce sul quaderno e torna a trovarti nei prossimi giorni
    const draft = draftFrom(takeback.rec, takeback.tag)
    if (draft) addToNotebook([draft])
    setTakeback(null)
    setQuiz(null)
    setPhase('player')
    retracts.current += 1
    ownMoves.current -= 1
    // la mossa ritirata non conta: la minaccia torna "da risolvere"
    if (resolvedThreat.current) {
      threatStats.current[resolvedThreat.current.kind] -= 1
      pendingThreat.current = { asked: resolvedThreat.current.asked }
      resolvedThreat.current = null
    }
    say('retract')
  }

  /** Prima di ritirare: "dov'è il guaio?". Si accetta il pezzo che attacca, quello attaccato o uno lasciato in presa. */
  const startQuiz = async () => {
    if (!takeback) return
    const g = game.current
    const targets = new Set<Square>(hangingPieces(g, color).map((h) => h.square))
    let refute: [Square, Square] | undefined
    try {
      const ev = await evaluate(g.fen())
      if (ev.best) {
        const p = parseUci(ev.best)
        refute = [p.from, p.to]
        targets.add(p.from)
        targets.add(p.to)
      }
    } catch {
      /* senza motore si usano solo i pezzi in presa */
    }
    if (!alive.current) return
    if (targets.size === 0) {
      doTakeback()
      return
    }
    setQuiz({ targets: [...targets], refute, tries: 0, done: false })
    say('quizAsk')
  }
  const onQuizPick = (sq: Square) => {
    if (!quiz || quiz.done) return
    if (quiz.targets.includes(sq)) {
      sfx.good()
      setQuiz({ ...quiz, done: true })
      addXp(3)
      say('quizOk')
      return
    }
    sfx.bad()
    setShake(true)
    setTimeout(() => setShake(false), 450)
    const tries = quiz.tries + 1
    if (tries >= 2) {
      setQuiz({ ...quiz, tries, done: true })
      say('quizReveal')
    } else {
      setQuiz({ ...quiz, tries })
      say('quizMiss')
    }
  }

  const keepMove = () => {
    if (!takeback) return
    const { botUci } = takeback
    setTakeback(null)
    setQuiz(null)
    setBadge(null)
    setPhase('thinking')
    sleep(250).then(() => {
      if (alive.current) applyBot(botUci)
    })
  }

  const showHint = async () => {
    if (phase !== 'player' || viewPly !== null) return
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
      persona: coachInfo(currentCoach()).persona,
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
    if (todo.length === 0) {
      setAnalysisReady(true)
      return
    }
    let alive = true
    setAnalysing(true)
    ;(async () => {
      for (const m of todo) {
        try {
          const idx = moves.indexOf(m)
          const prevJ = moves.slice(0, idx).reverse().find((x) => x.color === color)?.judgement
          const j = await judgeMove(m.fenBefore, m.uci, { history: moves.slice(0, idx).map((x) => x.san), prevWin: prevJ ? winPct(prevJ.cpAfter) : undefined })
          if (!alive) return
          setMoves((ms) => ms.map((x) => (x.fenBefore === m.fenBefore && x.uci === m.uci ? { ...x, judgement: j } : x)))
        } catch {
          /* mossa non analizzabile: pazienza */
        }
      }
      if (alive) {
        setAnalysing(false)
        setAnalysisReady(true)
      }
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

  // gli errori peggiori della partita finiscono sul quaderno (una volta sola, a giudizio completato)
  useEffect(() => {
    if (phase !== 'over' || !analysisReady || notebookSaved.current) return
    notebookSaved.current = true
    // la partita finisce nello storico (precisione e tipi di errore) per "Il tuo punto debole"
    if (result) {
      const rec = buildRecord(moves, color, bot.id, result.outcome, todayStr())
      if (rec) {
        if (threatStats.current.seen > 0) rec.threats = { ...threatStats.current }
        addGameRecord(rec)
        // il commento di Gemini parte in coda: non blocca né rallenta la revisione
        if (settings.geminiKey) {
          const worst = [...reviewItems]
            .sort((a, b) => b.judgement.loss - a.judgement.loss)
            .slice(0, 2)
            .map((it) => `mossa ${it.moveNo}, ${it.san} (${QUALITY_INFO[it.judgement.quality].label.toLowerCase()}): ${MISTAKE_INFO[classifyMistake(it.fenBefore, it.uci, it.judgement, it.moveNo)].what}`)
          setSummary('loading')
          summarizeGameWithGemini(settings.geminiKey, {
            persona: coachInfo(currentCoach()).persona,
            tone: settings.tone,
            botName: bot.name,
            botStyle: bot.style !== 'balanced' ? STYLES[bot.style].label.toLowerCase() : undefined,
            outcome: result.outcome,
            moves: rec.moves,
            accuracy: rec.acc,
            judgements: Object.fromEntries(Object.entries(rec.q).map(([q, n]) => [QUALITY_INFO[q as Quality].label.toLowerCase(), n as number])),
            mistakes: Object.fromEntries(Object.entries(rec.kinds).map(([k, n]) => [MISTAKE_INFO[k as keyof typeof MISTAKE_INFO].label.toLowerCase(), n as number])),
            worst,
            cleanGame: cleanNote !== null,
            resigned: result.reason === 'resa',
          }).then((text) => {
            if (alive.current) setSummary(text)
          })
        }
      }
    }
    const drafts: NotebookDraft[] = reviewItems.map((it) => ({
      fen: it.fenBefore,
      color,
      best: it.judgement.bestUci!,
      played: it.uci,
      playedSan: it.san,
      tag: it.judgement.missedMate ? 'Matti lasciati scappare' : 'Errori in partita',
      j: { quality: it.judgement.quality, loss: it.judgement.loss, cpAfter: it.judgement.cpAfter, missedMate: it.judgement.missedMate },
    }))
    if (drafts.length === 0) return
    const n = addToNotebook(drafts)
    if (n > 0) setNotebookNote(sayLine('notebookSaved', settings.tone, { n }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, analysisReady, reviewItems, result])

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

  // mentre l'avversario pensa puoi già prendere in mano un pezzo: la mossa parte solo quando tocca a te (vedi onUserMove)
  const movable = phase === 'player' || phase === 'thinking' || phase === 'reply' ? color : null

  const moveRows: MoveRow[] = moves.map((m) => ({ san: m.san, color: m.color, quality: m.color === color ? m.judgement?.quality : undefined }))
  const oppColor: Color = opposite(color)
  const myTurn = phase === 'player'
  const meAvatar = (
    <span className="me-avatar">
      <img src={`${import.meta.env.BASE_URL}pieces/${color}P.svg`} width={28} height={28} alt="" />
    </span>
  )

  // rivedere le mosse già giocate: la scacchiera mostra quella posizione e resta ferma finché non torni all'ultima
  const vp = viewPly !== null && viewPly < moves.length ? viewPly : null
  const viewing = vp !== null
  const viewedMove = vp !== null && vp > 0 ? moves[vp - 1] : undefined
  const shownFen = vp !== null ? moves[vp].fenBefore : fen
  const shownLast: [Square, Square] | null = viewing ? (viewedMove ? [viewedMove.uci.slice(0, 2) as Square, viewedMove.uci.slice(2, 4) as Square] : null) : last
  const shownBy: 'me' | 'opp' = viewing ? (viewedMove && viewedMove.color !== color ? 'opp' : 'me') : lastBy
  const viewedJ = viewedMove?.color === color ? viewedMove.judgement : undefined
  const shownBadge = viewing
    ? viewedMove && viewedJ
      ? { square: viewedMove.uci.slice(2, 4) as Square, icon: <QualityIcon q={viewedJ.quality} />, color: QUALITY_INFO[viewedJ.quality].color, kind: viewedJ.quality }
      : null
    : badge
  const busy = phase !== 'player' || viewing

  return (
    <div className="screen play">
      <div className="topbar">
        <button className="ghost" onClick={onExit} title={phase === 'over' ? undefined : 'La partita resta salvata: la riprendi dalla Home'}>
          <ArrowLeft size={20} weight="bold" /> Esci
        </button>
        <div className="title">Partita contro {bot.name}</div>
      </div>

      <div className="game-shell">
        <div className="game-main">
          <PlayerBar
            avatar={<BotAvatar id={bot.id} size={40} />}
            name={bot.name}
            sub={phase === 'thinking' ? 'Sta pensando…' : botSan ? `Ha giocato ${botSan}` : bot.style !== 'balanced' ? `Avversario · stile ${STYLES[bot.style].label.toLowerCase()}` : 'Avversario'}
            color={oppColor}
            fen={shownFen}
            active={phase === 'thinking' || phase === 'reply'}
          />
          <div className={`board-row${settings.evalBar ? ' with-eval' : ''}`}>
            {settings.evalBar && <EvalBar fen={shownFen} orientation={color} />}
            <Board
              fen={shownFen}
              orientation={color}
              movable={viewing ? null : movable}
              onMove={onUserMove}
              lastMove={shownLast}
              lastBy={shownBy}
              slowMove={!viewing && lastBy === 'opp'}
              tints={viewing || (quiz && !quiz.done) ? undefined : tints}
              rings={viewing ? [] : quiz ? (quiz.done ? quiz.targets : []) : threatView ? [...new Set([...rings, ...threatView.rings])] : rings}
              arrows={viewing ? undefined : quiz?.done && quiz.refute ? [[quiz.refute[0], quiz.refute[1], '#ffb347']] : threatView && threatView.arrows.length ? threatView.arrows : undefined}
              onPick={!viewing && quiz && !quiz.done ? onQuizPick : undefined}
              hint={viewing ? null : hint}
              badge={shownBadge}
              shake={shake}
            />
          </div>
          <PlayerBar
            avatar={meAvatar}
            name="Tu"
            sub={viewing ? 'Stai rivedendo le mosse' : myTurn ? 'Tocca a te' : undefined}
            color={color}
            fen={shownFen}
            active={myTurn && !viewing}
            extra={
              viewing && (
                <button className="back-live" onClick={() => setViewPly(null)}>
                  <ArrowUUpLeft size={16} weight="bold" /> Torna alla partita
                </button>
              )
            }
          />
        </div>

        <div className="game-side play-side">
          <CoachBubble text={coach.text} mood={coach.mood}>
            {phase === 'decide' && takeback && (
              <div className="row">
                {!quiz && (
                  <button className="btn primary" onClick={startQuiz}>
                    <ArrowCounterClockwise size={18} weight="bold" /> Ritira la mossa
                  </button>
                )}
                {quiz && !quiz.done && (
                  <button className="btn" onClick={doTakeback}>
                    <ArrowCounterClockwise size={18} weight="bold" /> Salta e ritira
                  </button>
                )}
                {quiz?.done && (
                  <button className="btn primary" onClick={doTakeback}>
                    <ArrowCounterClockwise size={18} weight="bold" /> Ritira ora
                  </button>
                )}
                <button className="btn" onClick={keepMove}>
                  Lascia stare
                </button>
              </div>
            )}
          </CoachBubble>

          {phase === 'over' && result && (
            <div className={`card result-card ${result.outcome}`}>
              <div className="result-head">
                <strong>{result.outcome === 'win' ? 'Hai vinto!' : result.outcome === 'lose' ? 'Hai perso' : 'Patta'}</strong>
                <small>
                  {result.reason === 'patta' ? '' : `per ${result.reason} · `}contro {bot.name}
                </small>
              </div>
              {Object.keys(counts).length > 0 && (
                <div className="summary">
                  {(Object.keys(counts) as Quality[]).map((q) => (
                    <span key={q} className="chip" style={{ background: QUALITY_INFO[q].color }} title={QUALITY_INFO[q].label}>
                      <QualityIcon q={q} /> {counts[q]}
                    </span>
                  ))}
                </div>
              )}
              {cleanNote && <p className="review-note clean">✨ Partita pulita: nessuna mossa ritirata, +15 XP. {cleanNote}</p>}
              {threatStats.current.seen > 0 && (
                <p className="review-note">
                  🛡️ Minacce dell’avversario: {threatStats.current.seen} · parate {threatStats.current.handled}
                  {threatStats.current.missed > 0 ? ` · ignorate ${threatStats.current.missed}` : ''}
                  {threatStats.current.asked > 0 ? ` · aiuto T usato ${threatStats.current.asked} ${threatStats.current.asked === 1 ? 'volta' : 'volte'}` : ''}
                </p>
              )}
              {analysing && <p className="review-note">{coachInfo(currentCoach()).name} sta riguardando la partita…</p>}
              {!analysing && reviewItems.length === 0 && moves.some((m) => m.judgement) && <p className="review-note">Nessun errore grave da rivedere. Niente male!</p>}
              {notebookNote && <p className="review-note">{notebookNote}</p>}
              {summary === 'loading' && <p className="review-note">{coachInfo(currentCoach()).name} sta scrivendo il commento…</p>}
              {summary && summary !== 'loading' && <p className="review-note summary">{summary}</p>}
              <div className="result-actions">
                {!analysing && reviewItems.length > 0 && (
                  <button className="btn primary" onClick={() => setReviewOpen(true)}>
                    <GraduationCap size={18} weight="bold" /> Rivedi {reviewItems.length === 1 ? 'il tuo errore' : `i tuoi ${reviewItems.length} errori`}
                  </button>
                )}
                {!analysing && moves.length >= 2 && (
                  <button className="btn" onClick={() => setReplayOpen(true)}>
                    <Rewind size={18} weight="bold" /> Rivedi tutta la partita
                  </button>
                )}
                <div className="result-row">
                  {onRematch && (
                    <button className="btn" onClick={onRematch}>
                      <ArrowsClockwise size={18} weight="bold" /> Rivincita
                    </button>
                  )}
                  <button className={`btn${!analysing && reviewItems.length > 0 ? '' : ' primary'}`} onClick={onExit}>
                    Continua <ArrowRight size={18} weight="bold" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {phase !== 'over' && (
            // quattro tasti sempre nello stesso posto; il resto (mappa del pericolo, resa) sta nel menu "Altro"
            <div className="actions">
              <button className="btn" onClick={showHint} disabled={busy}>
                <Lightbulb size={20} weight="fill" /> Aiuto{hintLevel ? ` ${hintLevel}/3` : ''}
              </button>
              <button className={`btn${advice ? ' on' : ''}`} onClick={toggleAdvice} disabled={busy} title="Cosa faccio ora? (scorciatoia: C)">
                <Compass size={20} weight="fill" /> Consigli <kbd className="kbd">C</kbd>
              </button>
              <button className={`btn${threatView ? ' on' : ''}`} onClick={showThreats} disabled={busy} title="Cosa minaccia l’avversario? (scorciatoia: T)">
                <Warning size={20} weight="fill" /> Minacce <kbd className="kbd">T</kbd>
              </button>
              <button
                className="btn wide"
                onClick={() => lastUserMove && explain(lastUserMove)}
                disabled={busy || !lastUserMove?.judgement}
                title="Perché la mia ultima mossa è stata giudicata così?"
              >
                <MagnifyingGlass size={20} weight="bold" /> Perché?
              </button>
              <div className="more">
                <button
                  className={`btn${menuOpen ? ' on' : ''}`}
                  onClick={() => {
                    setMenuOpen((o) => !o)
                    setResignAsk(false)
                  }}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  title="Mappa del pericolo, resa"
                >
                  <DotsThree size={22} weight="bold" /> Altro
                </button>
                {menuOpen && (
                  <div className="more-menu" role="menu">
                    <button role="menuitem" onClick={cycleDanger}>
                      <MapTrifold size={20} weight="duotone" />
                      <span>Mappa del pericolo</span>
                      <b>{DANGER_LABEL[settings.danger]}</b>
                    </button>
                    {resignAsk ? (
                      <div className="more-confirm">
                        <span>Ti arrendi davvero?</span>
                        <button
                          className="btn small"
                          onClick={() => {
                            setMenuOpen(false)
                            setResignAsk(false)
                            finish('lose', 'resa')
                          }}
                        >
                          Sì, mi arrendo
                        </button>
                        <button className="btn small" onClick={() => setResignAsk(false)}>
                          No
                        </button>
                      </div>
                    ) : (
                      <button role="menuitem" className="danger" onClick={() => setResignAsk(true)}>
                        <Flag size={20} weight="fill" />
                        <span>Arrenditi</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {advice && phase === 'player' && (
            <div className="advice">
              <div className="advice-head">
                <b>Cosa faccio?</b> <span className="chip">{advice.phaseLabel}</span>
              </div>
              <ul className="advice-urgent">
                {advice.urgent.map((u) => (
                  <li key={u.text} className={u.level}>
                    {u.text}
                  </li>
                ))}
              </ul>
              {advice.tips.map((tp) => (
                <details key={tp.key} className="advice-tip">
                  <summary>
                    <b>{tp.key}</b> {tp.text}
                  </summary>
                  <p>{tp.why}</p>
                </details>
              ))}
              <div className="advice-routine">Prima di ogni mossa: 1 cosa ha fatto lui · 2 i miei pezzi · 3 le mie occasioni</div>
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

          <div className="card moves-card">
            <div className="moves-head">
              <span className="moves-title">
                {opening ? (
                  <>
                    <BookOpenText size={14} weight="fill" /> {opening}
                  </>
                ) : (
                  'Mosse'
                )}
              </span>
              <span className="moves-keys" title="Frecce ← → per rivedere le mosse; Fine per tornare all’ultima">
                <kbd className="kbd">←</kbd>
                <kbd className="kbd">→</kbd>
              </span>
            </div>
            <MoveList moves={moveRows} current={vp ?? undefined} onSelect={goPly} />
          </div>
        </div>
      </div>
      {phase === 'over' && result?.outcome === 'win' && <Confetti />}
      {replayOpen && <GameReplay moves={moves} color={color} tone={settings.tone} geminiKey={settings.geminiKey} onClose={() => setReplayOpen(false)} />}
      {reviewOpen && reviewItems.length > 0 && (
        <GameReview items={reviewItems} color={color} tone={settings.tone} geminiKey={settings.geminiKey} onClose={() => setReviewOpen(false)} />
      )}
    </div>
  )
}
