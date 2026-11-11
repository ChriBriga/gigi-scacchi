import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type Square } from 'chess.js'
import { CaretDoubleLeft, CaretDoubleRight, CaretLeft, CaretRight, Eye, GraduationCap, X } from '@phosphor-icons/react'
import { Board } from './Board'
import { GameReview, type ReviewItem } from './GameReview'
import { QualityIcon } from './QualityIcon'
import { San } from './GameParts'
import { QUALITY_INFO, evaluate, winPct, type Quality } from '../engine/analysis'
import { MISTAKE_INFO, classifyMistake, isMistake, summarizeOwn, type JudgedMove } from '../engine/mistakes'
import { parseUci } from '../chess/util'
import type { Tone } from '../coach/lines'

const PAD = 8
const QUALITY_ORDER: Quality[] = ['brilliant', 'great', 'best', 'excellent', 'good', 'book', 'forced', 'inaccuracy', 'miss', 'mistake', 'blunder']

/** Il grafico della partita: la tua probabilità di vincere, mossa dopo mossa. Tocca o trascina per scorrere la partita. */
function WinGraph({ win, moves, color, ply, onPick }: { win: (number | undefined)[]; moves: JudgedMove[]; color: Color; ply: number; onPick: (i: number) => void }) {
  const uid = useId().replace(/:/g, '')
  const box = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 480, h: 130 })
  useEffect(() => {
    const el = box.current
    if (!el) return
    const measure = () => setSize({ w: Math.max(200, el.clientWidth), h: el.clientWidth < 420 ? 104 : 130 })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const { w: W, h: H } = size
  const n = moves.length
  const px = (i: number) => (n === 0 ? 0 : (i / n) * W)
  const py = (v: number) => H - PAD - (v / 100) * (H - PAD * 2)
  const mid = py(50)

  // tratti continui (i buchi restano buchi)
  const segs: { x: number; y: number }[][] = []
  let cur: { x: number; y: number }[] = []
  win.forEach((v, i) => {
    if (v === undefined) {
      if (cur.length) segs.push(cur)
      cur = []
      return
    }
    cur.push({ x: px(i), y: py(v) })
  })
  if (cur.length) segs.push(cur)
  const line = segs.map((s) => s.map((p, k) => `${k ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')).join(' ')
  const area = segs
    .map((s) => `M${s[0].x.toFixed(1)} ${mid} ${s.map((p) => `L${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')} L${s[s.length - 1].x.toFixed(1)} ${mid} Z`)
    .join(' ')

  const dragging = useRef(false)
  const pick = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    onPick(Math.max(0, Math.min(n, Math.round(((e.clientX - r.left) / r.width) * n))))
  }
  const curWin = win[ply]
  return (
    <div className="win-graph-box" ref={box}>
      <svg
        className="win-graph"
        width={W}
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label="Grafico della tua probabilità di vincere durante la partita"
        onPointerDown={(e) => {
          dragging.current = true
          e.currentTarget.setPointerCapture(e.pointerId)
          pick(e)
        }}
        onPointerMove={(e) => {
          if (dragging.current) pick(e)
        }}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <defs>
          <clipPath id={`${uid}t`}>
            <rect x="0" y="0" width={W} height={mid} />
          </clipPath>
          <clipPath id={`${uid}b`}>
            <rect x="0" y={mid} width={W} height={H - mid} />
          </clipPath>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="10" className="wg-bg" />
        {area && <path d={area} className="wg-area-up" clipPath={`url(#${uid}t)`} />}
        {area && <path d={area} className="wg-area-down" clipPath={`url(#${uid}b)`} />}
        <line x1="0" x2={W} y1={mid} y2={mid} className="wg-mid" />
        {line && <path d={line} className="wg-line" />}
        {moves.map((m, i) => {
          const v = win[i + 1]
          const q = m.judgement?.quality
          if (m.color !== color || !q || v === undefined) return null
          const good = q === 'brilliant' || q === 'great'
          if (!good && !isMistake(m.judgement!)) return null
          const c = good ? QUALITY_INFO[q].color : QUALITY_INFO[q === 'blunder' ? 'blunder' : 'mistake'].color
          return <circle key={i} cx={px(i + 1)} cy={py(v)} r="4" fill={c} className="wg-dot" />
        })}
        <line x1={px(ply)} x2={px(ply)} y1="0" y2={H} className="wg-cursor" />
        {curWin !== undefined && <circle cx={px(ply)} cy={py(curWin)} r="5.5" className="wg-now" />}
      </svg>
    </div>
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

  // la lista scorre da sola, ma solo lei (scrollIntoView farebbe scorrere anche la finestra)
  const listRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const box = listRef.current
    const el = box?.querySelector<HTMLElement>('.rv-mv.on')
    if (!box || !el) return
    const top = el.offsetTop - box.offsetTop
    if (top < box.scrollTop) box.scrollTop = top - 6
    else if (top + el.offsetHeight > box.scrollTop + box.clientHeight) box.scrollTop = top + el.offsetHeight - box.clientHeight + 6
  }, [ply])

  const summary = useMemo(() => summarizeOwn(moves, color), [moves, color])
  const pillRef = useRef<{ q: Quality; k: number } | null>(null)
  const jumpQuality = (q: Quality) => {
    const list = moves.map((mv, i) => (mv.color === color && mv.judgement?.quality === q ? i + 1 : -1)).filter((i) => i > 0)
    if (!list.length) return
    const k = pillRef.current?.q === q ? (pillRef.current.k + 1) % list.length : 0
    pillRef.current = { q, k }
    setPly(list[k])
  }

  // le mosse chiave: i tuoi errori più pesanti e la tua mossa migliore
  const keys = useMemo(() => {
    const out: { ply: number; q: Quality; san: string; text: string; w: number; bad: boolean }[] = []
    moves.forEach((mv, i) => {
      const jj = mv.judgement
      if (mv.color !== color || !jj) return
      const no = Math.floor(i / 2) + 1
      if (isMistake(jj)) {
        const k = classifyMistake(mv.fenBefore, mv.uci, jj, no)
        out.push({ ply: i + 1, q: jj.quality, san: mv.san, text: MISTAKE_INFO[k].label, w: jj.loss + (jj.missedMate ? 40 : 0), bad: true })
      } else if (jj.quality === 'brilliant' || jj.quality === 'great') {
        out.push({ ply: i + 1, q: jj.quality, san: mv.san, text: jj.quality === 'brilliant' ? 'La tua mossa più bella' : 'Una gran mossa', w: jj.quality === 'brilliant' ? 2 : 1, bad: false })
      }
    })
    const bads = out.filter((k) => k.bad).sort((a, b) => b.w - a.w).slice(0, 3)
    const good = out.filter((k) => !k.bad).sort((a, b) => b.w - a.w)[0]
    return [...bads, ...(good ? [good] : [])].sort((a, b) => a.ply - b.ply)
  }, [moves, color])

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
        <span>
          <San san={mv.san} />
        </span>
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
            <small>{busy ? 'Sto finendo di valutare le posizioni…' : 'Frecce ← → per scorrere, trascina il grafico per saltare'}</small>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Chiudi">
            <X size={22} weight="bold" />
          </button>
        </div>

        <div className="replay-grid">
          <div className="replay-sum">
            <div className="rs-acc" title="Precisione: quanto le tue mosse si sono avvicinate alle migliori">
              <b>{summary.acc === null ? '–' : `${summary.acc}%`}</b>
              <small>Precisione</small>
            </div>
            <div className="rs-pills">
              {QUALITY_ORDER.filter((q) => (summary.q[q] ?? 0) > 0).map((q) => (
                <button key={q} className="chip rs-pill" style={{ background: QUALITY_INFO[q].color }} onClick={() => jumpQuality(q)} title={`Vai alle mosse: ${QUALITY_INFO[q].label}`}>
                  <QualityIcon q={q} /> {QUALITY_INFO[q].label} <b>{summary.q[q]}</b>
                </button>
              ))}
            </div>
          </div>

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
            <div className="card replay-keys">
              <strong>Mosse chiave</strong>
              {keys.length === 0 ? (
                <small className="muted">Nessun momento critico: partita lineare.</small>
              ) : (
                keys.map((k) => (
                  <button key={k.ply} className={`rk${ply === k.ply ? ' on' : ''}`} onClick={() => setPly(k.ply)}>
                    <span className="rk-n">{Math.floor((k.ply - 1) / 2) + 1}{color === 'w' ? '.' : '…'}</span>
                    <b>
                      <San san={k.san} />
                    </b>
                    <span className="chip rk-q" style={{ background: QUALITY_INFO[k.q].color }}>
                      <QualityIcon q={k.q} />
                    </span>
                    <span className="rk-t">{k.text}</span>
                  </button>
                ))
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
