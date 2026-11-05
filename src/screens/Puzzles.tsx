import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type PieceSymbol, type Square } from 'chess.js'
import { ArrowLeft, ArrowRight, Check, Lightbulb, Notebook, PuzzlePiece } from '@phosphor-icons/react'
import { Board } from '../components/Board'
import { Confetti } from '../components/GameParts'
import { ThemeIcon } from '../components/icons'
import { CoachBubble } from '../components/CoachBubble'
import puzzlesData from '../data/puzzles.json'
import { parseUci } from '../chess/util'
import { EVENT_MOOD, pieceWithArticle, sayLine, type CoachEvent, type Mood } from '../coach/lines'
import { addXp, dueNotebook, getState, nudgeSkill, touchDay, update, useApp, type Progress } from '../store'
import { sfx } from '../sound'

export interface Puzzle {
  id: string
  fen: string
  theme: 'mate1' | 'mate2' | 'free' | 'fork' | 'tactic' | 'backrank' | 'matepat' | 'pin' | 'skewer' | 'discover' | 'defend' | 'endgame'
  moves: string[]
  mates?: string[]
  /** altre prime mosse che valgono quasi quanto la soluzione: l'app le accetta */
  alts?: string[]
  /** (difesa) la mossa con cui l'avversario ti minacciava: si mostra a puzzle risolto */
  threat?: string
  /** (schemi di matto) quale schema: smother | arabian | kiss */
  kind?: string
}

export const PUZZLES = puzzlesData as Puzzle[]
const PUZZLE_IDS = new Set(PUZZLES.map((x) => x.id))

export const THEME_INFO: Record<Puzzle['theme'], { name: string; difficulty: number; tip: string }> = {
  mate1: { name: 'Matto in 1', difficulty: 1, tip: 'Trova la mossa che dà scacco matto.' },
  free: { name: 'Pezzo gratis', difficulty: 1, tip: 'C’è un pezzo avversario che puoi prendere in vantaggio. Trovalo.' },
  fork: { name: 'Forchetta', difficulty: 2, tip: 'Una mossa attacca due pezzi insieme. Trovala.' },
  mate2: { name: 'Matto in 2', difficulty: 2, tip: 'Matto in due mosse: la prima è forzante, l’avversario risponde, poi dai matto.' },
  tactic: { name: 'Vinci materiale', difficulty: 3, tip: 'C’è una mossa che vince materiale. Cerca scacchi, catture e attacchi doppi.' },
  backrank: { name: 'Matto di corridoio', difficulty: 2, tip: 'Il re è chiuso dai suoi stessi pedoni sull’ultima riga: trova il matto.' },
  pin: { name: 'Inchiodatura', difficulty: 2, tip: 'Un pezzo avversario non può muoversi senza scoprirne uno più prezioso. Sfruttalo!' },
  defend: { name: 'Difendi!', difficulty: 2, tip: 'L’avversario minaccia qualcosa di grosso. Trova la mossa che lo ferma.' },
  matepat: { name: 'Schemi di matto', difficulty: 3, tip: 'Riconosci lo schema? Trova il matto.' },
  skewer: { name: 'Infilata', difficulty: 3, tip: 'Attacca un pezzo di valore con un altro dietro di lui: quando si sposta, prendi quello.' },
  discover: { name: 'Attacco scoperto', difficulty: 3, tip: 'Sposta un pezzo e fai partire l’attacco di quello che gli stava dietro.' },
  endgame: { name: 'Finale', difficulty: 3, tip: 'Finale semplice: una sola mossa vince, le altre pareggiano.' },
}

/** Una riga di spiegazione dopo la soluzione, per fissare l'idea. */
const NOTE: Partial<Record<Puzzle['theme'], string>> = {
  backrank: 'Matto di corridoio: i pedoni davanti al re gli tolgono ogni via di fuga.',
  pin: 'Inchiodatura: il pezzo davanti non poteva muoversi.',
  skewer: 'Infilata: il pezzo di valore ha dovuto spostarsi e quello dietro è caduto.',
  discover: 'Attacco scoperto: due minacce in una mossa sola.',
  defend: 'La freccia rossa era la minaccia: l’hai fermata.',
  endgame: 'Una sola mossa vinceva: tutte le altre pareggiavano.',
}
const KIND_NOTE: Record<string, string> = {
  smother: 'Matto soffocato: il re è chiuso dai suoi stessi pezzi e il cavallo fa il resto.',
  arabian: 'Matto arabo: torre e cavallo, il re è bloccato nell’angolo.',
  kiss: 'Bacio della morte: la donna dà matto accanto al re, protetta da un altro pezzo.',
}
const noteFor = (p: Puzzle): string => (p.theme === 'matepat' ? (KIND_NOTE[p.kind ?? ''] ?? '') : (NOTE[p.theme] ?? ''))

/** Sceglie il prossimo puzzle: dà più peso ai temi in cui sbagli di più e a quelli adatti al tuo livello. */
export function pickPuzzle(p: Progress, exclude: string[] = [], themes?: Puzzle['theme'][]): Puzzle {
  let pool = PUZZLES.filter((x) => (!themes || themes.includes(x.theme)) && !exclude.includes(x.id))
  const unseen = pool.filter((x) => !p.puzzleSeen.includes(x.id))
  if (unseen.length) pool = unseen
  else if (pool.length === 0) pool = PUZZLES
  const weights = pool.map((x) => {
    const st = p.puzzleStats[x.theme] ?? { ok: 0, fail: 0 }
    const weak = st.fail / (st.ok + st.fail + 1)
    const d = THEME_INFO[x.theme].difficulty
    const fit = d > 1 + p.skill / 35 ? 0.45 : 1
    return (1 + weak * 2) * fit
  })
  let r = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i]
    if (r <= 0) return pool[i]
  }
  return pool[0]
}

export interface PuzzleResult {
  id: string
  theme: Puzzle['theme']
  firstTry: boolean
}

export function PuzzleRunner({
  next,
  total,
  onFinish,
  onExit,
  title,
}: {
  next: (i: number, results: PuzzleResult[]) => Puzzle | null
  total?: number
  onFinish: (results: PuzzleResult[]) => void
  onExit: () => void
  title?: string
}) {
  const app = useApp()
  const tone = app.settings.tone
  const [i, setI] = useState(0)
  const results = useRef<PuzzleResult[]>([])
  const [puzzle, setPuzzle] = useState<Puzzle | null>(() => next(0, []))

  const [fen, setFen] = useState(puzzle?.fen ?? '')
  const [ply, setPly] = useState(0)
  const [solved, setSolved] = useState(false)
  const [failed, setFailed] = useState(false)
  const [hintLevel, setHintLevel] = useState(0)
  const [shake, setShake] = useState(false)
  const [coach, setCoach] = useState<{ text: string; mood: Mood }>({ text: puzzle ? THEME_INFO[puzzle.theme].tip : '', mood: 'cool' })
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null)
  const game = useRef<Chess | null>(puzzle ? new Chess(puzzle.fen) : null)

  useEffect(() => {
    if (!puzzle) return
    setFen(puzzle.fen)
    setPly(0)
    setSolved(false)
    setFailed(false)
    setHintLevel(0)
    setLastMove(null)
    setCoach({ text: THEME_INFO[puzzle.theme].tip, mood: 'cool' })
    game.current = new Chess(puzzle.fen)
  }, [puzzle])

  const say = (e: CoachEvent) => setCoach({ text: sayLine(e, tone), mood: EVENT_MOOD[e] })
  const turn = useMemo(() => (puzzle?.fen.split(' ')[1] === 'b' ? 'b' : 'w') as 'w' | 'b', [puzzle])

  if (!puzzle) {
    return (
      <div className="screen">
        <h2>Non ci sono puzzle</h2>
        <button className="btn" onClick={onExit}>Indietro</button>
      </div>
    )
  }

  const markSeen = (ok: boolean) =>
    update((s) => {
      const p = s.progress
      touchDay(p)
      if (!p.puzzleSeen.includes(puzzle.id)) p.puzzleSeen.push(puzzle.id)
      // i puzzle tolti dall'elenco non contano più fra quelli visti
      p.puzzleSeen = p.puzzleSeen.filter((id) => PUZZLE_IDS.has(id))
      if (p.puzzleSeen.length >= PUZZLES.length) {
        p.puzzleSeen = []
        p.puzzleCycle = (p.puzzleCycle ?? 0) + 1
      }
      const st = (p.puzzleStats[puzzle.theme] ??= { ok: 0, fail: 0 })
      if (ok) st.ok += 1
      else st.fail += 1
    })

  const onMove = (from: Square, to: Square, promotion?: PieceSymbol) => {
    const g = game.current!
    if (solved) return
    const uci = from + to + (promotion ?? '')
    const trial = new Chess(g.fen())
    try {
      trial.move({ from, to, promotion })
    } catch {
      return
    }
    const expected = puzzle.moves[ply]
    const isLast = ply >= puzzle.moves.length - 1
    const correct = uci === expected || (isLast && trial.isCheckmate()) || (puzzle.theme === 'mate1' && puzzle.mates?.includes(uci)) || (ply === 0 && !!puzzle.alts?.includes(uci)) || (uci.startsWith(expected) && expected.length === 4 && uci.length === 5)

    if (!correct) {
      sfx.bad()
      setShake(true)
      setTimeout(() => setShake(false), 450)
      say('puzzleFail')
      if (!failed) {
        setFailed(true)
        markSeen(false)
        nudgeSkill(-0.4)
      }
      return
    }

    g.move({ from, to, promotion })
    setFen(g.fen())
    setLastMove([from, to])
    setHintLevel(0)

    if (isLast) {
      sfx.good()
      setSolved(true)
      say('puzzleOk')
      const note = noteFor(puzzle)
      if (note) setCoach((c) => ({ ...c, text: `${c.text} ${note}` }))
      if (!failed) {
        markSeen(true)
        nudgeSkill(THEME_INFO[puzzle.theme].difficulty * 0.5)
      }
      update((s) => {
        s.progress.puzzlesSolved += 1
        s.progress.today.puzzles += 1
      })
      addXp(failed ? 3 : 8)
      results.current = [...results.current, { id: puzzle.id, theme: puzzle.theme, firstTry: !failed }]
      return
    }
    // risposta dell'avversario e poi tocca di nuovo a te
    sfx.move()
    const reply = puzzle.moves[ply + 1]
    setCoach({ text: 'Bene! Continua così…', mood: 'happy' })
    setTimeout(() => {
      const r = parseUci(reply)
      g.move({ from: r.from, to: r.to, promotion: r.promotion })
      setFen(g.fen())
      setLastMove([r.from, r.to])
      sfx.move()
    }, 450)
    setPly(ply + 2)
  }

  const hint = async () => {
    const expected = puzzle.moves[ply]
    const level = Math.min(hintLevel + 1, 2)
    setHintLevel(level)
    const g = game.current!
    const piece = g.get(expected.slice(0, 2) as Square)
    if (level === 1) setCoach({ text: `Indizio: muovi ${piece ? pieceWithArticle(piece.type) : 'un pezzo'} (evidenziato).`, mood: 'neutral' })
    else setCoach({ text: 'Ecco la mossa! La prossima volta la vedi da solo.', mood: 'cool' })
    if (!failed) {
      setFailed(true)
      markSeen(false)
    }
  }

  const goNext = () => {
    const nextI = i + 1
    if (total !== undefined && nextI >= total) {
      onFinish(results.current)
      return
    }
    const p = next(nextI, results.current)
    if (!p) {
      onFinish(results.current)
      return
    }
    setI(nextI)
    setPuzzle(p)
  }

  const expectedMove = puzzle.moves[ply]
  const hintInfo =
    hintLevel >= 1
      ? { from: expectedMove.slice(0, 2) as Square, to: hintLevel >= 2 ? (expectedMove.slice(2, 4) as Square) : undefined }
      : null

  return (
    <div className="screen">
      <div className="topbar">
        <button className="ghost" onClick={onExit}>
          <ArrowLeft size={20} weight="bold" /> Esci
        </button>
        <div className="title">
          <ThemeIcon id={puzzle.theme} size={24} /> {title ?? THEME_INFO[puzzle.theme].name}
          {total !== undefined && (
            <span className="chip-count">
              {i + 1}/{total}
            </span>
          )}
        </div>
      </div>
      <div className="game-shell">
        <div className="game-main">
          <Board fen={fen} orientation={turn} movable={solved ? null : turn} onMove={onMove} lastMove={lastMove} hint={hintInfo} shake={shake} arrows={solved && puzzle.threat ? [[puzzle.threat.slice(0, 2) as Square, puzzle.threat.slice(2, 4) as Square, '#ff5a36']] : undefined} />
        </div>
        <div className="game-side">
          <CoachBubble text={coach.text} mood={coach.mood}>
            <div className="row">
              {!solved && (
                <button className="btn" onClick={hint}>
                  <Lightbulb size={18} weight="fill" /> Aiuto
                </button>
              )}
              {solved && (
                <button className="btn primary" onClick={goNext}>
                  {total !== undefined && i + 1 >= total ? (
                    <>
                      Finito <Check size={18} weight="bold" />
                    </>
                  ) : (
                    <>
                      Prossimo <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </button>
              )}
            </div>
          </CoachBubble>
        </div>
      </div>
      {solved && total !== undefined && i + 1 >= total && <Confetti />}
    </div>
  )
}

export function Puzzles({ onExit, onNotebook }: { onExit: () => void; onNotebook: () => void }) {
  const { progress } = useApp()
  const notebookSize = progress.notebook?.length ?? 0
  const notebookDue = dueNotebook(progress).length
  const learned = progress.notebookGone?.length ?? 0
  const [started, setStarted] = useState(false)
  const stats = progress.puzzleStats

  if (started) {
    return (
      <PuzzleRunner
        next={(_, res) => pickPuzzle(getState().progress, res.map((r) => r.id))}
        onFinish={() => setStarted(false)}
        onExit={() => setStarted(false)}
      />
    )
  }
  return (
    <div className="screen">
      <h2>Puzzle</h2>
      <p className="sub">Trovare la mossa giusta in pochi secondi: l’allenamento più veloce che esista.</p>
      <button className="btn primary big" style={{ maxWidth: 460 }} onClick={() => setStarted(true)}>
        <PuzzlePiece size={24} weight="fill" /> Inizia ad allenarti
      </button>
      <div className="card" style={{ maxWidth: 640 }}>
        <h3>
          <Notebook size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Quaderno degli errori
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Gli errori che fai in partita tornano come esercizio dopo 1, 3, 7, 14 e 30 giorni, finché non li hai imparati.
        </p>
        <div className="stats">
          <div className="stat">
            <b>{notebookSize}</b> sul quaderno
          </div>
          <div className="stat">
            <b>{notebookDue}</b> da ripassare
          </div>
          <div className="stat">
            <b>{learned}</b> imparati
          </div>
        </div>
        <button className="btn" style={{ marginTop: 12 }} onClick={onNotebook} disabled={notebookSize === 0}>
          <Notebook size={20} weight="bold" /> {notebookDue > 0 ? 'Ripassa ora' : notebookSize ? 'Niente da ripassare oggi' : 'Ancora vuoto'}
        </button>
      </div>
      <div className="card" style={{ maxWidth: 640 }}>
        <h3>I tuoi temi</h3>
        {(Object.keys(THEME_INFO) as Puzzle['theme'][]).map((t) => {
          const st = stats[t] ?? { ok: 0, fail: 0 }
          const tot = st.ok + st.fail
          return (
            <div className="theme-row" key={t}>
              <span className="t">
                <ThemeIcon id={t} size={24} /> {THEME_INFO[t].name}
              </span>
              <span className="muted" style={{ margin: 0 }}>
                {tot ? `${Math.round((st.ok / tot) * 100)}% al primo colpo` : 'da provare'}
              </span>
            </div>
          )
        })}
      </div>
      <button className="ghost" onClick={onExit}>
        <ArrowLeft size={18} weight="bold" /> Torna alla home
      </button>
    </div>
  )
}
