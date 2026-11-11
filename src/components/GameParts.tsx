import { useEffect, useMemo, useRef } from 'react'
import { Chess, type Color, type PieceSymbol } from 'chess.js'
import { VALUE } from '../chess/util'
import { QUALITY_INFO, type Quality } from '../engine/analysis'
import { fxTier } from '../perf'

const START_COUNT: Record<string, number> = { p: 8, n: 2, b: 2, r: 2, q: 1 }
const ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']

import { pieceUrl as setPieceUrl } from '../chess/look'
import { currentCoach, getState } from '../store'

const pieceUrl = (color: Color, type: PieceSymbol) => setPieceUrl(getState().settings.pieces, color, type)

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
  extra,
}: {
  avatar: React.ReactNode
  name: string
  sub?: string
  /** colore di questo giocatore */
  color: Color
  fen: string
  active?: boolean
  /** un tasto a destra della barra (non ne cambia l'altezza) */
  extra?: React.ReactNode
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
        {/* la riga c'è sempre (anche vuota): così il nome non sale e scende quando compare "Tocca a te" */}
        <small>{sub || ' '}</small>
      </div>
      <div className="pb-captured" aria-label="Pezzi catturati">
        {mine.map((t, i) => (
          <img key={i} src={pieceUrl(theirColor, t)} alt="" />
        ))}
        {adv > 0 && <span className="pb-adv">+{adv}</span>}
      </div>
      {extra}
    </div>
  )
}

export interface MoveRow {
  san: string
  color: Color
  quality?: Quality
}

const FIGURINE: Record<string, PieceSymbol> = { K: 'k', Q: 'q', R: 'r', B: 'b', N: 'n' }

/** Una mossa in notazione con le figurine al posto delle lettere inglesi (N, B, R, Q, K). */
export function San({ san }: { san: string }) {
  return (
    <>
      {san.split(/([KQRBN])/).map((part, i) =>
        FIGURINE[part] ? <img key={i} className="fig" src={pieceUrl('w', FIGURINE[part])} alt={part} draggable={false} /> : part,
      )}
    </>
  )
}

/**
 * Lista delle mosse. `current` è quante mosse sono state giocate nella posizione che si sta guardando
 * (di base l'ultima); con `onSelect` ogni mossa si può toccare per rivedere quella posizione.
 */
export function MoveList({ moves, current, onSelect }: { moves: MoveRow[]; current?: number; onSelect?: (ply: number) => void }) {
  const box = useRef<HTMLDivElement>(null)
  const cur = current ?? moves.length
  // la mossa che stai guardando resta in vista (si scorre solo la lista, mai la pagina)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const on = el.querySelector<HTMLElement>('.mv.on')
    if (!on) {
      el.scrollTop = 0
      return
    }
    const r = on.getBoundingClientRect()
    const c = el.getBoundingClientRect()
    if (r.top < c.top) el.scrollTop -= c.top - r.top + 4
    else if (r.bottom > c.bottom) el.scrollTop += r.bottom - c.bottom + 4
  }, [moves.length, cur])

  const rows: { n: number; w?: MoveRow; b?: MoveRow; wPly?: number; bPly?: number }[] = []
  moves.forEach((m, i) => {
    const n = Math.floor(i / 2) + 1
    if (m.color === 'w') rows.push({ n, w: m, wPly: i + 1 })
    else if (rows.length && !rows[rows.length - 1].b && rows[rows.length - 1].w) {
      rows[rows.length - 1].b = m
      rows[rows.length - 1].bPly = i + 1
    } else rows.push({ n, b: m, bPly: i + 1 })
  })
  const cell = (m?: MoveRow, ply?: number) =>
    m && ply ? (
      <button className={`mv${ply === cur ? ' on' : ''}`} onClick={onSelect ? () => onSelect(ply) : undefined} disabled={!onSelect} aria-current={ply === cur ? 'step' : undefined}>
        <span className="san">
          <San san={m.san} />
        </span>
        {m.quality && <i style={{ background: QUALITY_INFO[m.quality].color }} title={QUALITY_INFO[m.quality].label} />}
      </button>
    ) : (
      <span className="mv" />
    )
  return (
    <div className="move-list" ref={box}>
      {rows.length === 0 && <p className="muted">Le mosse compariranno qui.</p>}
      {rows.map((r) => (
        <div className="mv-row" key={r.n}>
          <span className="mv-n">{r.n}.</span>
          {cell(r.w, r.wPly)}
          {cell(r.b, r.bPly)}
        </div>
      ))}
    </div>
  )
}

/** I coriandoli prendono i colori del coach in uso. */
const CONFETTI_COLORS: Record<string, string[]> = {
  gigi: ['#ffd23f', '#ff6fb5', '#3fe0d0', '#9b7cff', '#7ed957', '#ff8a3d'],
  gabbiano: ['#e8344a', '#ffffff', '#ffcf3a', '#3f6fe0', '#ff8a3d'],
  gufo: ['#ffcf3a', '#c2506f', '#d9b887', '#6f7fe0', '#ffffff'],
  gallina: ['#ff9fbd', '#fff1dc', '#f2b53a', '#ff6a7c', '#7ed957'],
}

/** Coriandoli in CSS puro, montati solo per qualche secondo. */
export function Confetti() {
  const palette = CONFETTI_COLORS[currentCoach()] ?? CONFETTI_COLORS.gigi
  const bits = useMemo(
    () =>
      Array.from({ length: { low: 16, mid: 46, high: 90 }[fxTier()] }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        dur: 1.8 + Math.random() * 1.6,
        rot: Math.random() * 360,
        size: 6 + Math.random() * 7,
        color: palette[i % palette.length],
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
