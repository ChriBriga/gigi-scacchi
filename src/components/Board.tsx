import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ALL_SQUARES, PIECE_NAME, coordsToSq, sqToCoords } from '../chess/util'
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
  badge?: { square: Square; icon: ReactNode; color: string; kind?: string } | null
  /** mostra a ogni tocco il raggio d'azione del pezzo (anche del nemico) */
  showRange?: boolean
  /** casa che ha appena "ricevuto" una mossa sbagliata (shake) */
  shake?: boolean
  /** modalità "indica una casa": ogni tocco su una casa viene riportato qui e nessun pezzo si muove */
  onPick?: (sq: Square) => void
}

/** colore delle frecce e dei cerchi disegnati con il tasto destro */
const DRAW_COLOR = '#3b9dff'
/** evidenza di ultima mossa e selezione quando la scacchiera non ne indica una sua */
const DEFAULT_HL = 'rgba(255, 214, 64, 0.5)'
const NO_DRAWN: { arrows: [Square, Square][]; circles: Square[] } = { arrows: [], circles: [] }

/** Il trascinamento in corso: vive in un ref, così muovere il mouse non fa ridisegnare la scacchiera. */
interface DragInfo {
  sq: Square
  id: number
  el: HTMLElement | null
  /** punto in cui è iniziato il tocco (coordinate della finestra) */
  cx: number
  cy: number
  rect: DOMRect
  moved: boolean
  wasSel: boolean
  touch: boolean
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
  const overRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragInfo | null>(null)
  const drawRef = useRef<{ from: Square; to: Square } | null>(null)
  const snapTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [selected, setSelected] = useState<Square | null>(null)
  /** il pezzo che si sta trascinando (cambia solo quando il trascinamento inizia e finisce) */
  const [dragId, setDragId] = useState<{ id: number; touch: boolean } | null>(null)
  /** il pezzo appena lasciato cadere: arriva sulla casa di scatto, senza scivolare */
  const [snapId, setSnapId] = useState<number | null>(null)
  const [promo, setPromo] = useState<{ from: Square; to: Square } | null>(null)
  const [drawn, setDrawn] = useState(NO_DRAWN)
  const [drawing, setDrawing] = useState<{ from: Square; to: Square } | null>(null)

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

  /** prova a giocare la mossa; dice se era legale (la promozione apre prima la scelta del pezzo) */
  const tryMove = (from: Square, to: Square): boolean => {
    if (!chess || !onMove) return false
    const piece = chess.get(from)
    if (!piece) return false
    const legal = chess.moves({ square: from, verbose: true }).filter((m) => m.to === to)
    if (legal.length === 0) return false
    if (legal[0].promotion) {
      setPromo({ from, to })
    } else {
      onMove(from, to)
    }
    setSelected(null)
    return true
  }

  const canTouch = (sq: Square) => {
    const p = chess?.get(sq)
    if (!p) return false
    if (movable && p.color === movable) return true
    return !!showRange
  }

  const hideOver = () => {
    if (overRef.current) overRef.current.style.opacity = '0'
  }
  const cancelDrag = () => {
    dragRef.current = null
    hideOver()
    setDragId(null)
  }

  /** Sposta il pezzo trascinato scrivendo direttamente sul suo elemento: nessun ridisegno di React. */
  const place = (d: DragInfo, clientX: number, clientY: number) => {
    const r = d.rect
    const x = Math.max(0, Math.min(r.width, clientX - r.left))
    const y = Math.max(0, Math.min(r.height, clientY - r.top))
    d.el?.style.setProperty('--px', `${x}px`)
    d.el?.style.setProperty('--py', `${y}px`)
    const o = overRef.current
    if (!o) return
    const inside = clientX >= r.left && clientX < r.right && clientY >= r.top && clientY < r.bottom
    if (inside) {
      const col = Math.min(7, Math.floor((x / r.width) * 8))
      const row = Math.min(7, Math.floor((y / r.height) * 8))
      o.style.translate = `${col * 100}% ${row * 100}%`
      o.style.opacity = '1'
    } else o.style.opacity = '0'
  }

  const capture = (pointerId: number) => {
    try {
      boardRef.current?.setPointerCapture(pointerId)
    } catch {
      /* puntatore non più attivo: il trascinamento funziona lo stesso dentro la scacchiera */
    }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button === 2) {
      // tasto destro: freccia (trascinando) o cerchio (click) per ragionare sulla posizione
      const sq = fromPoint(e.clientX, e.clientY)
      if (!sq) return
      drawRef.current = { from: sq, to: sq }
      setDrawing({ from: sq, to: sq })
      capture(e.pointerId)
      return
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if (drawn !== NO_DRAWN) setDrawn(NO_DRAWN)
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
      const board = boardRef.current!
      const id = sprites.find((s) => s.square === sq)?.id ?? -1
      dragRef.current = {
        sq,
        id,
        el: board.querySelector<HTMLElement>(`[data-pid="${id}"]`),
        cx: e.clientX,
        cy: e.clientY,
        rect: board.getBoundingClientRect(),
        moved: false,
        wasSel: sq === selected,
        touch: e.pointerType !== 'mouse',
      }
      setSelected(sq)
      capture(e.pointerId)
    } else {
      setSelected(null)
    }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const dr = drawRef.current
    if (dr) {
      const sq = fromPoint(e.clientX, e.clientY)
      if (sq && sq !== dr.to) {
        drawRef.current = { from: dr.from, to: sq }
        setDrawing({ from: dr.from, to: sq })
      }
      return
    }
    const d = dragRef.current
    if (!d) return
    // tasto destro mentre trascini: il pezzo torna a posto
    if (e.pointerType === 'mouse' && e.buttons & 2) {
      cancelDrag()
      return
    }
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.cx, e.clientY - d.cy) < (d.touch ? 8 : 3)) return
      d.moved = true
      place(d, e.clientX, e.clientY)
      setDragId({ id: d.id, touch: d.touch })
      return
    }
    place(d, e.clientX, e.clientY)
  }
  const onPointerUp = (e: React.PointerEvent) => {
    const dr = drawRef.current
    if (dr) {
      drawRef.current = null
      setDrawing(null)
      setDrawn((cur) => {
        if (dr.from === dr.to) {
          const has = cur.circles.includes(dr.from)
          return { arrows: cur.arrows, circles: has ? cur.circles.filter((c) => c !== dr.from) : [...cur.circles, dr.from] }
        }
        const has = cur.arrows.some((a) => a[0] === dr.from && a[1] === dr.to)
        return { circles: cur.circles, arrows: has ? cur.arrows.filter((a) => !(a[0] === dr.from && a[1] === dr.to)) : [...cur.arrows, [dr.from, dr.to]] }
      })
      return
    }
    const d = dragRef.current
    if (!d) return
    dragRef.current = null
    hideOver()
    if (!d.moved) {
      if (d.wasSel) setSelected(null)
      return
    }
    setDragId(null)
    const sq = fromPoint(e.clientX, e.clientY)
    if (sq && sq !== d.sq && chess?.get(d.sq)?.color === movable && tryMove(d.sq, sq)) {
      // lasciato su una casa valida: il pezzo è già lì, non deve scivolare
      setSnapId(d.id)
      clearTimeout(snapTimer.current)
      snapTimer.current = setTimeout(() => setSnapId(null), 90)
    }
  }
  const onPointerCancel = () => {
    drawRef.current = null
    setDrawing(null)
    if (dragRef.current) cancelDrag()
  }

  // posizione nuova o scacchiera bloccata: via la selezione e il trascinamento che non valgono più, e i disegni
  useEffect(() => {
    setDrawn(NO_DRAWN)
    setPromo(null)
    setSelected((s) => (s && !canTouch(s) ? null : s))
    const d = dragRef.current
    if (d && (!canTouch(d.sq) || !sprites.some((s) => s.id === d.id && s.square === d.sq))) cancelDrag()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fen, movable])

  // Esc chiude la scelta della promozione
  useEffect(() => {
    if (!promo) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPromo(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [promo])

  useEffect(() => () => clearTimeout(snapTimer.current), [])

  const kingInCheck = chess?.inCheck() ? ALL_SQUARES.find((s) => chess.get(s)?.type === 'k' && chess.get(s)?.color === chess.turn()) : undefined

  const boardVars = boardStyle.light
    ? ({ ['--light' as string]: boardStyle.light, ['--dark' as string]: boardStyle.dark, ['--board-hl' as string]: boardStyle.hl ?? DEFAULT_HL } as React.CSSProperties)
    : undefined

  // frecce da mostrare: quelle chieste da fuori più quelle disegnate a mano
  const allArrows: [Square, Square, string][] = [
    ...(arrows ?? []).map(([a, b, c]) => [a, b, c ?? '#ffd23f'] as [Square, Square, string]),
    ...drawn.arrows.map(([a, b]) => [a, b, DRAW_COLOR] as [Square, Square, string]),
    ...(drawing && drawing.from !== drawing.to ? [[drawing.from, drawing.to, DRAW_COLOR] as [Square, Square, string]] : []),
  ]
  const allCircles = drawing && drawing.from === drawing.to && !drawn.circles.includes(drawing.from) ? [...drawn.circles, drawing.from] : drawn.circles
  const canMoveSel = !!selected && !!movable && chess?.get(selected)?.color === movable

  return (
    <div className={`board-wrap${shake ? ' shake' : ''}${fancy && kingInCheck ? ' in-check' : ''}`}>
      <div
        ref={boardRef}
        className={`board${slowMove ? ' slow' : ''}${dragId ? ' grabbing' : ''}`}
        style={boardVars}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
      >
        {ALL_SQUARES.map((sq) => {
          const { col, row } = toView(sq)
          const dark = (sqToCoords(sq).col + sqToCoords(sq).row) % 2 === 1
          const tint = tints?.[sq]
          const isLast = lastMove && (lastMove[0] === sq || lastMove[1] === sq)
          const isTarget = targets.includes(sq)
          return (
            <div
              key={sq}
              className={`sq ${dark ? 'dark' : 'light'}${isLast ? (lastBy === 'opp' ? (lastMove![1] === sq ? ' last-opp to' : ' last-opp from') : ` last${lastMove![1] === sq ? ' last-to' : ''}`) : ''}${selected === sq ? ' sel' : ''}${kingInCheck === sq ? ' check' : ''}${marks?.includes(sq) ? ' mark' : ''}${!onPick && canTouch(sq) ? ' grab' : ''}${onPick || (isTarget && canMoveSel) ? ' tgt' : ''}`}
              style={{ left: `${col * 12.5}%`, top: `${row * 12.5}%` }}
            >
              {tint && <div className={`tint ${tint.kind}`} style={{ opacity: Math.min(0.8, 0.3 + tint.n * 0.12) }} />}
              {row === 7 && <span className="coord file">{sq[0]}</span>}
              {col === 0 && <span className="coord rank">{sq[1]}</span>}
              {isTarget && <div className={chess?.get(sq) ? 'capture-ring' : 'dot'} />}
              {rings?.includes(sq) && <div className="danger-ring" />}
              {fancy && lastMove && lastMove[1] === sq && <div key={fen} className="ripple" />}
            </div>
          )
        })}

        {/* la casa sopra cui stai tenendo il pezzo: si sposta senza passare da React */}
        <div ref={overRef} className="drag-over" />

        {hint?.from && (
          <div className="hint-sq" style={posStyle(toView(hint.from))} />
        )}
        {hint?.to && <div className="hint-sq to" style={posStyle(toView(hint.to))} />}

        {sprites.map((p) => {
          // durante la scelta della promozione il pedone sta già sulla casa d'arrivo
          const { col, row } = toView(promo && promo.from === p.square ? promo.to : p.square)
          const dragging = dragId?.id === p.id
          // i pezzi si spostano con `translate` (compositor) e non con left/top (ricalcolo del layout a ogni frame);
          // quello trascinato segue le variabili --px/--py, aggiornate a mano a ogni movimento del puntatore
          const translate = dragging ? 'calc(var(--px) - 50%) calc(var(--py) - 50%)' : `${col * 100}% ${row * 100}%`
          return (
            <div
              key={p.id}
              data-pid={p.id}
              className={`piece${dragging ? ` dragging${dragId!.touch ? ' touch' : ''}` : ''}${snapId === p.id ? ' snap' : ''}${lastMove && lastMove[1] === p.square && !dragging ? ' mover' : ''}`}
              style={{ translate, backgroundImage: `url(${PIECE_URL(p.color, p.type)})` }}
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

        {(allArrows.length > 0 || allCircles.length > 0) && (
          <svg className="arrows" viewBox="0 0 8 8">
            <defs>
              {[...new Set(allArrows.map((a) => a[2]))].map((c) => (
                <marker key={c} id={`ah-${c.replace('#', '')}`} markerWidth="4" markerHeight="4" refX="2.4" refY="2" orient="auto">
                  <path d="M0,0 L4,2 L0,4 z" fill={c} />
                </marker>
              ))}
            </defs>
            {allCircles.map((sq) => {
              const v = toView(sq)
              return <circle key={sq} cx={v.col + 0.5} cy={v.row + 0.5} r="0.43" fill="none" stroke={DRAW_COLOR} strokeWidth="0.09" opacity="0.9" />
            })}
            {allArrows.map(([a, b, color], i) => {
              const va = toView(a)
              const vb = toView(b)
              // la linea si ferma un po' prima, così la punta della freccia arriva al centro della casa e non oltre
              const len = Math.hypot(vb.col - va.col, vb.row - va.row) || 1
              const cut = 0.26 / len
              return (
                <line
                  key={i}
                  x1={va.col + 0.5}
                  y1={va.row + 0.5}
                  x2={vb.col + 0.5 - (vb.col - va.col) * cut}
                  y2={vb.row + 0.5 - (vb.row - va.row) * cut}
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
          <div className="badge" data-q={badge.kind} style={{ ...posStyle(toView(badge.square)), ['--bc' as string]: badge.color }}>
            <span>{badge.icon}</span>
          </div>
        )}

        {promo && (
          // la scelta compare sulla casa d'arrivo, in colonna; un tocco fuori (o Esc) annulla la mossa
          <div
            className="promo"
            onPointerDown={(e) => {
              e.stopPropagation()
              setPromo(null)
            }}
          >
            <div
              className={`promo-col${toView(promo.to).row < 4 ? '' : ' up'}`}
              style={{ ['--c' as string]: toView(promo.to).col } as React.CSSProperties}
              onPointerDown={(e) => e.stopPropagation()}
              role="group"
              aria-label="Scegli il pezzo della promozione"
            >
              {(['q', 'n', 'r', 'b'] as PieceSymbol[]).map((t) => (
                <button
                  key={t}
                  aria-label={PIECE_NAME[t]}
                  style={{ backgroundImage: `url(${PIECE_URL(chess?.get(promo.from)?.color ?? 'w', t)})` }}
                  onClick={() => {
                    const { from, to } = promo
                    setPromo(null)
                    onMove?.(from, to, t)
                  }}
                />
              ))}
              <button className="promo-x" aria-label="Annulla la mossa" onClick={() => setPromo(null)}>
                ✕
              </button>
            </div>
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
    const t = setTimeout(() => setGhosts((g) => g.filter((x) => !gone.includes(x))), 520)
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
