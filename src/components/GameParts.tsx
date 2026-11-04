import { useEffect, useMemo, useRef } from 'react'
import { Chess, type Color, type PieceSymbol } from 'chess.js'
import { VALUE } from '../chess/util'
import { QUALITY_INFO, type Quality } from '../engine/analysis'

const START_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
const ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']

const pieceUrl = (color: Color, type: PieceSymbol) => `${import.meta.env.BASE_URL}pieces/${color}${type.toUpperCase()}.svg`

/** Pezzi catturati da ciascun colore e vantaggio di materiale (positivo = bianco avanti). */
export function captured(fen: string) {
  const out = { w: [] as PieceSymbol[], b: [] as PieceSymbol[], diff: 0 }
  try {
    const board = new Chess(fen).board()
    const have: Record<Color, Record<string, number>> = { w: {}, b: {} }
    let mw = 0
    let mb = 0
    for (const row of board)
      for (const p of row)
        if (p && p.type !== 'k') {
          have[p.color][p.type] = (have[p.color][p.type] ?? 0) + 1
          if (p.color === 'w') mw += VALUE[p.type]
          else mb += VALUE[p.type]
        }
    for (const t of ORDER) {
      const lostW = Math.max(0, START_COUNT[t] - (have.w[t] ?? 0))
      const lostB = Math.max(0, START_COUNT[t] - (have.b[t] ?? 0))
      for (let i = 0; i < lostB; i++) out.w.push(t) // il bianco ha preso pezzi neri
      for (let i = 0; i < lostW; i++) out.b.push(t)
    }
    out.diff = mw - mb
  } catch {
    /* fen non valido */
  }
  return out
}

export function PlayerBar({
  avatar,
  name,
  sub,
  color,
  fen,
  active,
}: {
  avatar: React.ReactNode
  name: string
  sub?: string
  /** colore di questo giocatore */
  color: Color
  fen: string
  active?: boolean
}) {
  const cap = useMemo(() => captured(fen), [fen])
  const mine = color === 'w' ? cap.w : cap.b
  const adv = color === 'w' ? cap.diff : -cap.diff
  const theirColor: Color = color === 'w' ? 'b' : 'w'
  return (
    <div className={`player-bar${active ? ' active' : ''}`}>
      <div className="pb-avatar">{avatar}</div>
      <div className="pb-info">
        <strong>{name}</strong>
        {sub && <small>{sub}</small>}
      </div>
      <div className="pb-captured" aria-label="Pezzi catturati">
        {mine.map((t, i) => (
          <img key={i} src={pieceUrl(theirColor, t)} alt="" />
        ))}
        {adv > 0 && <span className="pb-adv">+{adv}</span>}
      </div>
    </div>
  )
}

export interface MoveRow {
  san: string
  color: Color
  quality?: Quality
}

export function MoveList({ moves }: { moves: MoveRow[] }) {
  const end = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = end.current?.parentElement
    if (el) el.scrollTop = el.scrollHeight
  }, [moves.length])

  const rows: { n: number; w?: MoveRow; b?: MoveRow }[] = []
  moves.forEach((m, i) => {
    const n = Math.floor(i / 2) + 1
    if (m.color === 'w') rows.push({ n, w: m })
    else if (rows.length && !rows[rows.length - 1].b && rows[rows.length - 1].w) rows[rows.length - 1].b = m
    else rows.push({ n, b: m })
  })
  const cell = (m?: MoveRow) =>
    m ? (
      <span className="mv">
        {m.san}
        {m.quality && <i style={{ background: QUALITY_INFO[m.quality].color }} title={QUALITY_INFO[m.quality].label} />}
      </span>
    ) : (
      <span className="mv" />
    )
  return (
    <div className="move-list">
      {rows.length === 0 && <p className="muted">Le mosse compariranno qui.</p>}
      {rows.map((r) => (
        <div className="mv-row" key={r.n}>
          <span className="mv-n">{r.n}.</span>
          {cell(r.w)}
          {cell(r.b)}
        </div>
      ))}
      <div ref={end} />
    </div>
  )
}

const COLORS = ['#ffd23f', '#ff6fb5', '#3fe0d0', '#9b7cff', '#7ed957', '#ff8a3d']

/** Coriandoli in CSS puro, montati solo per qualche secondo. */
export function Confetti() {
  const bits = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        drift: (Math.random() - 0.5) * 120,
      })),
    [],
  )
  return (
    <div className="confetti" aria-hidden="true">
      {bits.map((b, i) => (
        <span
          key={i}
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 0.5,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ['--rot' as string]: `${b.rot}deg`,
            ['--drift' as string]: `${b.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
