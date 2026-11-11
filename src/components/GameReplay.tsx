import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type Square } from 'chess.js'
import { CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight, Eye, GraduationCap, X } from '@phosphor-icons/react'
import { Board } from './Board'
import { GameReview, type ReviewItem } from './GameReview'
import { QualityIcon } from './QualityIcon'
import { QUALITY_INFO, evaluate, winPct } from '../engine/analysis'
import { MISTAKE_INFO, classifyMistake, isMistake, type JudgedMove } from '../engine/mistakes'
import { parseUci } from '../chess/util'
import type { Tone } from '../coach/lines'

const W = 320
const H = 96
const px = (i: number, n: number) => (n === 0 ? 0 : (i / n) * W)
const py = (win: number) => H - 6 - (win / 100) * (H - 12)

/** Il grafico della partita: la tua probabilità di vincere, mossa dopo mossa. Tocca il grafico per saltare in quel punto. */
function WinGraph({ win, moves, color, ply, onPick }: { win: (number | undefined)[]; moves: JudgedMove[]; color: Color; ply: number; onPick: (i: number) => void }) {
  const n = moves.length
  let d = ''
  let pen = false
  win.forEach((w, i) => {
    if (w === undefined) {
      pen = false
      return
    }
    d += `${pen ? 'L' : 'M'}${px(i, n).toFixed(1)} ${py(w).toFixed(1)} `
    pen = true
  })
  const first = win.findIndex((w) => w !== undefined)
  const lastIdx = win.length - 1 - [...win].reverse().findIndex((w) => w !== undefined)
  const area = d && first >= 0 ? `${d} L${px(lastIdx, n).toFixed(1)} ${H - 6} L${px(first, n).toFixed(1)} ${H - 6} Z` : ''
  return (
    <svg
      className="win-graph"
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Grafico della tua probabilità di vincere durante la partita"
      onClick={(e) => {
        const r = e.currentTarget.getBoundingClientRect()
        onPick(Math.max(0, Math.min(n, Math.round(((e.clientX - r.left) / r.width) * n))))
      }}
    >
      <rect x="0" y="0" width={W} height={H} rx="10" className="wg-bg" />
      <line x1="0" x2={W} y1={py(50)} y2={py(50)} className="wg-mid" />
      {area && <path d={area} className="wg-area" />}
      {d && <path d={d} className="wg-line" />}
      {moves.map((m, i) => {
        const w = win[i + 1]
        if (m.color !== color || !m.judgement || !isMistake(m.judgement) || w === undefined) return null
        return <circle key={i} cx={px(i + 1, n)} cy={py(w)} r="3.6" fill={QUALITY_INFO[m.judgement.quality === 'blunder' ? 'blunder' : 'mistake'].color} className="wg-dot" />
      })}
      <line x1={px(ply, n)} x2={px(ply, n)} y1="0" y2={H} className="wg-cursor" />
    </svg>
  )
}

/**
 * Rivedi tutta la partita: scorri le mosse con le frecce, guarda il grafico del vantaggio e salta ai tuoi errori.
 * Le valutazioni arrivano dal giudizio già fatto in partita; quelle che mancano le calcola il motore mentre guardi.
 */
export function GameReplay({
  moves,
  color,
  tone,
  geminiKey,
  onClose,
}: {
  moves: JudgedMove[]
  color: Color
  tone: Tone
  geminiKey: string
  onClose: () => void
}) {
  const n = moves.length
  const fens = useMemo(() => {
    const g = new Chess()
    const out = [g.fen()]
    for (const m of moves) {
      const p = parseUci(m.uci)
      g.move({ from: p.from, to: p.to, promotion: p.promotion })
      out.push(g.fen())
    }
    return out
  }, [moves])

  // probabilità di vittoria (0-100) dal tuo punto di vista dopo ogni mossa; la 0 è la posizione iniziale
  const [win, setWin] = useState<(number | undefined)[]>(() =>
    fens.map((fen, i) => {
      if (i === 0) return 50
      const m = moves[i - 1]
      const c = new Chess(fen)
      if (c.isCheckmate()) return m.color === color ? 100 : 0
      if (c.isDraw() || c.isStalemate()) return 50
      return m.color === color && m.judgement ? winPct(m.judgement.cpAfter) : undefined
    }),
  )
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let alive = true
    const todo = win.map((w, i) => (w === undefined ? i : -1)).filter((i) => i >= 0)
    if (todo.length === 0) return
    setBusy(true)
    ;(async () => {
      for (const i of todo) {
        try {
          const ev = await evaluate(fens[i])
          if (!alive) return
          const turn = fens[i].split(' ')[1]
          const mine = turn === color ? ev.cp : -ev.cp
          setWin((cur) => cur.map((w, k) => (k === i ? winPct(mine) : w)))
        } catch {
          /* posizione non valutabile: resta un buco nel grafico */
        }
      }
      if (alive) setBusy(false)
    })()
    return () => {
      alive = false
    }
    // solo all'apertura: le valutazioni mancanti si calcolano una volta
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // si parte dall'errore più pesante (se c'è), altrimenti dalla fine
  const worst = useMemo(() => {
    let best = -1
    let bestLoss = -1
    moves.forEach((m, i) => {
      const j = m.judgement
      if (m.color === color && j && isMistake(j) && j.loss + (j.missedMate ? 40 : 0) > bestLoss) {
        best = i
        bestLoss = j.loss + (j.missedMate ? 40 : 0)
      }
    })
    return best
  }, [moves, color])
  const [ply, setPly] = useState(worst >= 0 ? worst + 1 : n)
  const [showBest, setShowBest] = useState(false)
  const [trying, setTrying] = useState<ReviewItem | null>(null)
  useEffect(() => setShowBest(false), [ply])

  const go = (i: number) => setPly(Math.max(0, Math.min(n, i)))
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (trying) return
      if (document.querySelector('dialog[open]')) return
      if (e.key === 'ArrowLeft') go(ply - 1)
      else if (e.key === 'ArrowRight') go(ply + 1)
      else if (e.key === 'Home') go(0)
      else if (e.key === 'End') go(n)
      else if (e.key === 'Escape') onClose()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ply, n, trying])

  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    listRef.current?.querySelector('.rv-mv.on')?.scrollIntoView({ block: 'nearest' })
  }, [ply])

  const m = ply > 0 ? moves[ply - 1] : null
  const mine = !!m && m.color === color
  const j = mine ? m!.judgement : undefined
  const bad = !!j && isMistake(j)
  const kind = bad && m && j ? classifyMistake(m.fenBefore, m.uci, j, Math.floor((ply - 1) / 2) + 1) : null
  const best = bad && j?.bestUci && !j.bestWasPlayed ? parseUci(j.bestUci) : null

  let fen = fens[ply]
  let arrows: ([Square, Square] | [Square, Square, string])[] = []
  let last: [Square, Square] | null = m ? [m.uci.slice(0, 2) as Square, m.uci.slice(2, 4) as Square] : null
  if (showBest && m && best) {
    fen = m.fenBefore
    arrows = [
      [m.uci.slice(0, 2) as Square, m.uci.slice(2, 4) as Square, '#ff5a5a'],
      [best.from, best.to, '#6be36b'],
    ]
    last = null
  }

  const before = win[ply - 1]
  const after = win[ply]
  const num = Math.floor((ply - 1) / 2) + 1
  const label = m ? `${m.color === 'w' ? `${num}.` : `${num}…`} ${m.san}` : 'Posizione iniziale'

  const item: ReviewItem | null =
    m && j && best && j.bestUci ? { moveNo: num, san: m.san, uci: m.uci, fenBefore: m.fenBefore, judgement: j, color } : null

  // le mosse a coppie, ognuna cliccabile
  const rows: { n: number; w?: number; b?: number }[] = []
  moves.forEach((mv, i) => {
    const k = Math.floor(i / 2) + 1
    if (mv.color === 'w') rows.push({ n: k, w: i })
    else if (rows.length && rows[rows.length - 1].b === undefined && rows[rows.length - 1].w !== undefined) rows[rows.length - 1].b = i
    else rows.push({ n: k, b: i })
  })
  const cell = (i?: number) => {
    if (i === undefined) return <span className="rv-mv empty" />
    const mv = moves[i]
    const q = mv.color === color ? mv.judgement?.quality : undefined
    return (
      <button className={`rv-mv${ply === i + 1 ? ' on' : ''}`} onClick={() => setPly(i + 1)}>
        {mv.san}
        {q && <i style={{ background: QUALITY_INFO[q].color }} title={QUALITY_INFO[q].label} />}
      </button>
    )
  }

  return (
    <div className="review-overlay" role="dialog" aria-modal="true" aria-label="Rivedi tutta la partita">
      <div className="review-sheet replay-sheet">
        <div className="review-head">
          <div>
            <strong>Rivedi la partita</strong>
            <small>{busy ? 'Sto finendo di valutare le posizioni…' : 'Frecce ← → per scorrere, tocca il grafico per saltare'}</small>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Chiudi">
            <X size={22} weight="bold" />
          </button>
        </div>

        <div className="replay-grid">
          <div className="replay-left">
            <div className="replay-board">
              <Board fen={fen} orientation={color} movable={null} lastMove={last} lastBy={mine ? 'me' : 'opp'} arrows={arrows} />
            </div>
            <div className="replay-controls">
              <button className="btn" onClick={() => go(0)} disabled={ply === 0} aria-label="All'inizio">
                <CaretDoubleLeft size={20} weight="bold" />
              </button>
              <button className="btn" onClick={() => go(ply - 1)} disabled={ply === 0} aria-label="Mossa precedente">
                <CaretLeft size={20} weight="bold" />
              </button>
              <span className="replay-pos">
                {ply} / {n}
              </span>
              <button className="btn" onClick={() => go(ply + 1)} disabled={ply === n} aria-label="Mossa successiva">
                <CaretRight size={20} weight="bold" />
              </button>
              <button className="btn" onClick={() => go(n)} disabled={ply === n} aria-label="Alla fine">
                <CaretDoubleRight size={20} weight="bold" />
              </button>
            </div>
            <WinGraph win={win} moves={moves} color={color} ply={ply} onPick={setPly} />
            <p className="replay-cap">La linea è la tua probabilità di vincere: in alto stai vincendo, in basso stai perdendo. I punti colorati sono i tuoi errori.</p>
          </div>

          <div className="replay-right">
            <div className="card replay-info">
              <strong>{label}</strong>
              {m && !mine && <small className="muted">Mossa dell’avversario</small>}
              {j && <span className="chip" style={{ background: QUALITY_INFO[j.quality].color }}><QualityIcon q={j.quality} /> {QUALITY_INFO[j.quality].label}</span>}
              {mine && before !== undefined && after !== undefined && (
                <small>
                  Probabilità di vincere: {Math.round(before)}% → <b>{Math.round(after)}%</b>
                </small>
              )}
              {kind && j && (
                <p className="review-note">
                  {MISTAKE_INFO[kind].label}: {MISTAKE_INFO[kind].what}.
                </p>
              )}
              {best && (
                <div className="row">
                  <button className="btn" onClick={() => setShowBest((v) => !v)}>
                    <Eye size={18} weight="bold" /> {showBest ? 'Torna alla partita' : 'Vedi la mossa giusta'}
                  </button>
                  {item && (
                    <button className="btn primary" onClick={() => setTrying(item)}>
                      <GraduationCap size={18} weight="bold" /> Provaci tu
                    </button>
                  )}
                </div>
              )}
              {showBest && best && (
                <small className="replay-cap">
                  <i className="lg-red" /> la tua mossa · <i className="lg-green" /> la mossa migliore
                </small>
              )}
            </div>
            <div className="card replay-moves" ref={listRef}>
              {rows.map((r) => (
                <div className="rv-row" key={r.n}>
                  <span className="mv-n">{r.n}.</span>
                  {cell(r.w)}
                  {cell(r.b)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {trying && <GameReview items={[trying]} color={color} tone={tone} geminiKey={geminiKey} onClose={() => setTrying(null)} />}
    </div>
  )
}
