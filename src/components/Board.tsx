import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ALL_SQUARES, coordsToSq, sqToCoords } from '../chess/util'
import { useBoardPieces, type PieceSprite } from './useBoardPieces'
import { boardStyleOf, pieceUrl } from '../chess/look'
import { useAppSelector } from '../store'
import { useFx } from '../perf'

export type Tint = { kind: 'danger' | 'safe' | 'both'; n: number }

export interface BoardProps {
  fen: string
  orientation?: Color
  /** colore che l'utente può muovere; null = scacchiera bloccata */
  movable: Color | null
  onMove?: (from: Square, to: Square, promotion?: PieceSymbol) => void
  lastMove?: [Square, Square] | null
  /** chi ha fatto l'ultima mossa: quella dell'avversario viene evidenziata di più */
  lastBy?: 'me' | 'opp'
  /** anima gli spostamenti in modo lento e ben visibile (mosse dell'avversario) */
  slowMove?: boolean
  tints?: Partial<Record<Square, Tint>>
  rings?: Square[]
  marks?: Square[]
  hint?: { from?: Square; to?: Square } | null
  /** frecce da disegnare; il terzo valore opzionale è il colore (default giallo) */
  arrows?: ([Square, Square] | [Square, Square, string])[]
  badge?: { square: Square; icon: string; color: string } | null
  /** mostra a ogni tocco il raggio d'azione del pezzo (anche del nemico) */
  showRange?: boolean
  /** casa che ha appena "ricevuto" una mossa sbagliata (shake) */
  shake?: boolean
  /** modalità "indica una casa": ogni tocco su una casa viene riportato qui e nessun pezzo si muove */
  onPick?: (sq: Square) => void
}

export function Board(props: BoardProps) {
  const { fen, orientation = 'w', movable, onMove, lastMove, lastBy, slowMove, tints, rings, marks, hint, arrows, badge, showRange, shake, onPick } = props
  const pieceSet = useAppSelector((s) => s.settings.pieces)
  const boardStyle = boardStyleOf(useAppSelector((s) => s.settings.board))
  const PIECE_URL = (color: Color, type: PieceSymbol) => pieceUrl(pieceSet, color, type)
  // gli effetti scenografici (scintille, onde, bagliore dello scacco) solo nel livello Spettacolare
  const fancy = useFx().tier === 'high'
  const sprites = useBoardPieces(fen)
  const ghosts = useGhosts(sprites)
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
    if (onPick) {
      const picked = fromPoint(e.clientX, e.clientY)
      if (picked) onPick(picked)
      return
    }
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
    <div className={`board-wrap${shake ? ' shake' : ''}${fancy && kingInCheck ? ' in-check' : ''}`}>
      <div
        ref={boardRef}
        className={`board${slowMove ? ' slow' : ''}`}
        style={boardStyle.light ? ({ ['--light' as string]: boardStyle.light, ['--dark' as string]: boardStyle.dark } as React.CSSProperties) : undefined}
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
              className={`sq ${dark ? 'dark' : 'light'}${isLast ? (lastBy === 'opp' ? (lastMove![1] === sq ? ' last-opp to' : ' last-opp from') : ` last${lastMove![1] === sq ? ' last-to' : ''}`) : ''}${selected === sq ? ' sel' : ''}${kingInCheck === sq ? ' check' : ''}${marks?.includes(sq) ? ' mark' : ''}`}
              style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }}
            >
              {tint && <div className={`tint ${tint.kind}`} style={{ opacity: Math.min(0.8, 0.3 + tint.n * 0.12) }} />}
              {row === 7 && <span className="coord file">{sq[0]}</span>}
              {col === 0 && <span className="coord rank">{sq[1]}</span>}
              {targets.includes(sq) && <div className={chess?.get(sq) ? 'capture-ring' : 'dot'} />}
              {rings?.includes(sq) && <div className="danger-ring" />}
              {fancy && lastMove && lastMove[1] === sq && <div key={fen} className="ripple" />}
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
          // i pezzi si spostano con `translate` (compositor) e non con left/top (ricalcolo del layout a ogni frame)
          const style: React.CSSProperties = dragging
            ? { translate: `${((drag!.x / (boardRef.current?.clientWidth ?? 1)) * 8 - 0.5) * 100}% ${((drag!.y / (boardRef.current?.clientHeight ?? 1)) * 8 - 0.5) * 100}%` }
            : { translate: `${col * 100}% ${row * 100}%` }
          return (
            <div
              key={p.id}
              className={`piece${dragging ? ' dragging' : ''}${lastMove && lastMove[1] === p.square && !dragging ? ' mover' : ''}`}
              style={{ ...style, backgroundImage: `url(${PIECE_URL(p.color, p.type)})` }}
            />
          )
        })}

        {ghosts.map((g) => {
          const { col, row } = toView(g.square)
          return (
            <div
              key={`ghost-${g.id}`}
              className="piece ghost"
              style={{ translate: `${col * 100}% ${row * 100}%`, backgroundImage: `url(${PIECE_URL(g.color, g.type)})` }}
            />
          )
        })}
        {fancy && ghosts.map((g) => <Burst key={`burst-${g.id}`} sprite={g} pos={toView(g.square)} />)}

        {lastBy === 'opp' && lastMove && (
          <svg key={lastMove.join('')} className="arrows trail" viewBox="0 0 8 8">
            <defs>
              <marker id="ah-opp" markerWidth="4" markerHeight="4" refX="2.4" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4 z" fill="#ff5a36" />
              </marker>
            </defs>
            <line
              x1={toView(lastMove[0]).col + 0.5}
              y1={toView(lastMove[0]).row + 0.5}
              x2={toView(lastMove[1]).col + 0.5}
              y2={toView(lastMove[1]).row + 0.5}
              stroke="#ff5a36"
              strokeWidth="0.15"
              strokeLinecap="round"
              markerEnd="url(#ah-opp)"
            />
          </svg>
        )}

        {arrows && arrows.length > 0 && (
          <svg className="arrows" viewBox="0 0 8 8">
            <defs>
              {[...new Set(arrows.map((a) => a[2] ?? '#ffd23f'))].map((c) => (
                <marker key={c} id={`ah-${c.replace('#', '')}`} markerWidth="4" markerHeight="4" refX="2.4" refY="2" orient="auto">
                  <path d="M0,0 L4,2 L0,4 z" fill={c} />
                </marker>
              ))}
            </defs>
            {arrows.map(([a, b, color = '#ffd23f'], i) => {
              const va = toView(a)
              const vb = toView(b)
              return (
                <line
                  key={i}
                  x1={va.col + 0.5}
                  y1={va.row + 0.5}
                  x2={vb.col + 0.5}
                  y2={vb.row + 0.5}
                  stroke={color}
                  strokeWidth="0.16"
                  strokeLinecap="round"
                  markerEnd={`url(#ah-${color.replace('#', '')})`}
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

/** Scintille quando un pezzo viene preso: una decina di puntini che volano via dalla casa (solo livello Spettacolare). */
function Burst({ sprite, pos }: { sprite: PieceSprite; pos: { col: number; row: number } }) {
  const bits = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2 + sprite.id * 0.7
        const d = 330 + ((i * 53 + sprite.id * 31) % 260)
        return { dx: Math.round(Math.cos(a) * d), dy: Math.round(Math.sin(a) * d), delay: (i % 3) * 0.03 }
      }),
    [sprite.id],
  )
  const palette = sprite.color === 'w' ? ['#fff6c8', '#ffd23f', '#ffffff'] : ['#ff6fb5', '#9b7cff', '#3fe0d0']
  return (
    <div className="burst" style={posStyle(pos)} aria-hidden="true">
      {bits.map((b, i) => (
        <i key={i} style={{ background: palette[i % palette.length], color: palette[i % palette.length], animationDelay: `${b.delay}s`, ['--dx' as string]: `${b.dx}%`, ['--dy' as string]: `${b.dy}%` }} />
      ))}
    </div>
  )
}

/** Pezzi appena catturati: restano per un attimo e poi svaniscono, così la presa si vede. */
function useGhosts(sprites: PieceSprite[]): PieceSprite[] {
  const [ghosts, setGhosts] = useState<PieceSprite[]>([])
  const prev = useRef<PieceSprite[]>(sprites)
  useEffect(() => {
    const before = prev.current
    prev.current = sprites
    if (before === sprites) return
    const ids = new Set(sprites.map((s) => s.id))
    const gone = before.filter((p) => !ids.has(p.id))
    // cambio di posizione completo (nuovo puzzle, nuova lezione): niente fantasmi
    if (gone.length === 0 || gone.length > 2 || before.length - sprites.length !== gone.length) return
    setGhosts((g) => [...g, ...gone])
    const t = setTimeout(() => setGhosts((g) => g.filter((x) => !gone.includes(x))), 900)
    return () => clearTimeout(t)
  }, [sprites])
  return ghosts
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
