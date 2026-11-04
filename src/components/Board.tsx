import { useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ALL_SQUARES, coordsToSq, sqToCoords } from '../chess/util'
import { useBoardPieces } from './useBoardPieces'

export type Tint = { kind: 'danger' | 'safe' | 'both'; n: number }

export interface BoardProps {
  fen: string
  orientation?: Color
  /** colore che l'utente può muovere; null = scacchiera bloccata */
  movable: Color | null
  onMove?: (from: Square, to: Square, promotion?: PieceSymbol) => void
  lastMove?: [Square, Square] | null
  tints?: Partial<Record<Square, Tint>>
  rings?: Square[]
  marks?: Square[]
  hint?: { from?: Square; to?: Square } | null
  arrows?: [Square, Square][]
  badge?: { square: Square; icon: string; color: string } | null
  /** mostra a ogni tocco il raggio d'azione del pezzo (anche del nemico) */
  showRange?: boolean
  /** casa che ha appena "ricevuto" una mossa sbagliata (shake) */
  shake?: boolean
}

const PIECE_URL = (color: Color, type: PieceSymbol) =>
  `${import.meta.env.BASE_URL}pieces/${color}${type.toUpperCase()}.svg`

export function Board(props: BoardProps) {
  const { fen, orientation = 'w', movable, onMove, lastMove, tints, rings, marks, hint, arrows, badge, showRange, shake } = props
  const sprites = useBoardPieces(fen)
  const boardRef = useRef<HTMLDivElement>(null)
  const [selected, setSelected] = useState<Square | null>(null)
  const [drag, setDrag] = useState<{ sq: Square; x: number; y: number; moved: boolean; wasSel: boolean } | null>(null)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)

  const chess = useMemo(() => {
    try {
      return new Chess(fen)
    } catch {
      return null
    }
  }, [fen])

  const targets = useMemo(() => {
    if (!chess || !selected) return [] as Square[]
    const piece = chess.get(selected)
    if (!piece) return []
    if (movable && piece.color === movable && chess.turn() === movable) {
      return chess.moves({ square: selected, verbose: true }).map((m) => m.to)
    }
    if (showRange) return pseudoRange(fen, selected)
    return []
  }, [chess, selected, movable, showRange, fen])

  const isFlipped = orientation === 'b'
  const toView = (sq: Square) => {
    const { col, row } = sqToCoords(sq)
    return { col: isFlipped ? 7 - col : col, row: isFlipped ? 7 - row : row }
  }
  const fromPoint = (clientX: number, clientY: number): Square | null => {
    const el = boardRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const col = Math.floor(((clientX - r.left) / r.width) * 8)
    const row = Math.floor(((clientY - r.top) / r.height) * 8)
    if (col < 0 || col > 7 || row < 0 || row > 7) return null
    return coordsToSq(isFlipped ? 7 - col : col, isFlipped ? 7 - row : row)
  }

  const tryMove = (from: Square, to: Square) => {
    if (!chess || !onMove) return
    const piece = chess.get(from)
    if (!piece) return
    const legal = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (legal.length === 0) return
    if (legal[0].promotion) {
      setPromo({ from, to })
    } else {
      onMove(from, to)
    }
    setSelected(null)
  }

  const canTouch = (sq: Square) => {
    const p = chess?.get(sq)
    if (!p) return false
    if (movable && p.color === movable) return true
    return !!showRange
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (promo) return
    const sq = fromPoint(e.clientX, e.clientY)
    if (!sq) return
    if (selected && targets.includes(sq) && chess?.get(selected)?.color === movable) {
      tryMove(selected, sq)
      return
    }
    if (canTouch(sq)) {
      const r = boardRef.current!.getBoundingClientRect()
      setDrag({ sq, x: e.clientX - r.left, y: e.clientY - r.top, moved: false, wasSel: sq === selected })
      setSelected(sq)
      boardRef.current?.setPointerCapture(e.pointerId)
    } else {
      setSelected(null)
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag) return
    const r = boardRef.current!.getBoundingClientRect()
    const x = e.clientX - r.left
    const y = e.clientY - r.top
    const moved = drag.moved || Math.hypot(x - drag.x, y - drag.y) > 6
    setDrag({ ...drag, x, y, moved })
  }
  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag) return
    const d = drag
    setDrag(null)
    if (!d.moved) {
      if (d.wasSel) setSelected(null)
      return
    }
    const sq = fromPoint(e.clientX, e.clientY)
    if (sq && sq !== d.sq && chess?.get(d.sq)?.color === movable) tryMove(d.sq, sq)
  }

  const kingInCheck = chess?.inCheck() ? ALL_SQUARES.find((s) => chess.get(s)?.type === 'k' && chess.get(s)?.color === chess.turn()) : undefined

  return (
    <div className={`board-wrap${shake ? ' shake' : ''}`}>
      <div
        ref={boardRef}
        className="board"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={() => setDrag(null)}
      >
        {ALL_SQUARES.map((sq) => {
          const { col, row } = toView(sq)
          const dark = (sqToCoords(sq).col + sqToCoords(sq).row) % 2 === 1
          const tint = tints?.[sq]
          const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq)
          return (
            <div
              key={sq}
              className={`sq ${dark ? 'dark' : 'light'}${isLast ? ' last' : ''}${selected === sq ? ' sel' : ''}${kingInCheck === sq ? ' check' : ''}${marks?.includes(sq) ? ' mark' : ''}`}
              style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }}
            >
              {tint && <div className={`tint ${tint.kind}`} style={{ opacity: Math.min(0.8, 0.3 + tint.n * 0.12) }} />}
              {row === 7 && <span className="coord file">{sq[0]}</span>}
              {col === 0 && <span className="coord rank">{sq[1]}</span>}
              {targets.includes(sq) && <div className={chess?.get(sq) ? 'capture-ring' : 'dot'} />}
              {rings?.includes(sq) && <div className="danger-ring" />}
            </div>
          )
        })}

        {hint?.from && (
          <div className="hint-sq" style={posStyle(toView(hint.from))} />
        )}
        {hint?.to && <div className="hint-sq to" style={posStyle(toView(hint.to))} />}

        {sprites.map((p) => {
          const { col, row } = toView(p.square)
          const dragging = drag?.moved && drag.sq === p.square
          const style: React.CSSProperties = dragging
            ? { left: `${(drag!.x / (boardRef.current?.clientWidth ?? 1)) * 100 - 6.25}%`, top: `${(drag!.y / (boardRef.current?.clientHeight ?? 1)) * 100 - 6.25}%` }
            : { left: `${col * 12.5}%`, top: `${row * 12.5}%` }
          return (
            <div
              key={p.id}
              className={`piece${dragging ? ' dragging' : ''}`}
              style={{ ...style, backgroundImage: `url(${PIECE_URL(p.color, p.type)})` }}
            />
          )
        })}

        {arrows && arrows.length > 0 && (
          <svg className="arrows" viewBox="0 0 8 8">
            <defs>
              <marker id="ah" markerWidth="4" markerHeight="4" refX="2.4" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 z" fill="#ffd23f" />
              </marker>
            </defs>
            {arrows.map(([a, b], i) => {
              const va = toView(a)
              const vb = toView(b)
              return (
                <line
                  key={i}
                  x1={va.col + 0.5}
                  y1={va.row + 0.5}
                  x2={vb.col + 0.5}
                  y2={vb.row + 0.5}
                  stroke="#ffd23f"
                  strokeWidth="0.16"
                  strokeLinecap="round"
                  markerEnd="url(#ah)"
                  opacity="0.9"
                />
              )
            })}
          </svg>
        )}

        {badge && (
          <div className="badge" style={{ ...posStyle(toView(badge.square)), ['--bc' as string]: badge.color }}>
            <span>{badge.icon}</span>
          </div>
        )}

        {promo && (
          <div className="promo">
            {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((t) => (
              <button
                key={t}
                style={{ backgroundImage: `url(${PIECE_URL(chess?.get(promo.from)?.color ?? 'w', t)})` }}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  onMove?.(promo.from, promo.to, t)
                  setPromo(null)
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function posStyle({ col, row }: { col: number; row: number }): React.CSSProperties {
  return { left: `${col * 12.5}%`, top: `${row * 12.5}%` }
}

/** Raggio d'azione di un pezzo ignorando turno e scacchi (serve per le lezioni). */
function pseudoRange(fen: string, sq: Square): Square[] {
  try {
    const parts = fen.split(' ')
    const piece = new Chess(fen).get(sq)
    if (!piece) return []
    parts[1] = piece.color
    parts[3] = '-'
    const c = new Chess()
    c.load(parts.join(' '), { skipValidation: true })
    return c.moves({ square: sq, verbose: true }).map((m) => m.to)
  } catch {
    return []
  }
}
