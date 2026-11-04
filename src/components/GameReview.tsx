import { useEffect, useMemo, useState } from 'react'
import { Chess, type Color, type PieceSymbol, type Square } from 'chess.js'
import { ArrowRight, Check, Eye, X } from '@phosphor-icons/react'
import { Board } from './Board'
import { CoachBubble } from './CoachBubble'
import { QUALITY_INFO, evaluate, judgeMove, winPct, type Judgement } from '../engine/analysis'
import { hangingPieces } from '../chess/danger'
import { PIECE_NAME, parseUci } from '../chess/util'
import { explainWithGemini } from '../coach/gemini'
import type { Mood, Tone } from '../coach/lines'

export interface ReviewItem {
  /** numero della mossa nella partita (1, 2, 3…) */
  moveNo: number
  san: string
  uci: string
  fenBefore: string
  judgement: Judgement
}

type Stage = 'try' | 'shown'
type View = 'played' | 'best'

interface Detail {
  bestSan?: string
  refuteSan?: string
  refuteUci?: string
  facts: string[]
  winBefore: number
  winAfter: number
}

function sanOf(fen: string, uci: string): string | undefined {
  try {
    const p = parseUci(uci)
    return new Chess(fen).move({ from: p.from, to: p.to, promotion: p.promotion }).san
  } catch {
    return undefined
  }
}

function playUci(fen: string, uci: string): string | undefined {
  try {
    const c = new Chess(fen)
    const p = parseUci(uci)
    c.move({ from: p.from, to: p.to, promotion: p.promotion })
    return c.fen()
  } catch {
    return undefined
  }
}

/** Solo gli errori che valgono la pena: i più pesanti (max 3), più i matti lasciati scappare. */
export function pickReviewItems(
  moves: { san: string; uci: string; fenBefore: string; color: Color; judgement?: Judgement }[],
  color: Color,
): ReviewItem[] {
  const all: ReviewItem[] = []
  moves.forEach((m, i) => {
    if (m.color !== color || !m.judgement) return
    const j = m.judgement
    const bad = j.quality === 'blunder' || j.quality === 'mistake' || j.missedMate
    if (!bad || !j.bestUci || j.bestWasPlayed) return
    all.push({ moveNo: Math.floor(i / 2) + 1, san: m.san, uci: m.uci, fenBefore: m.fenBefore, judgement: j })
  })
  return all
    .sort((a, b) => b.judgement.loss + (b.judgement.missedMate ? 40 : 0) - (a.judgement.loss + (a.judgement.missedMate ? 40 : 0)))
    .slice(0, 3)
    .sort((a, b) => a.moveNo - b.moveNo)
}

export function GameReview({ items, color, tone, geminiKey, onClose }: { items: ReviewItem[]; color: Color; tone: Tone; geminiKey: string; onClose: () => void }) {
  const [idx, setIdx] = useState(0)
  const item = items[idx]
  const [stage, setStage] = useState<Stage>('try')
  const [view, setView] = useState<View>('played')
  const [tries, setTries] = useState(0)
  const [checking, setChecking] = useState(false)
  const [solvedFen, setSolvedFen] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ text: string; mood: Mood } | null>(null)
  const [detail, setDetail] = useState<Detail | null>(null)
  const [shake, setShake] = useState(false)
  const [ai, setAi] = useState<string | null>(null)
  const [aiBusy, setAiBusy] = useState(false)

  // ripartiamo da zero a ogni errore
  useEffect(() => {
    setStage('try')
    setView('played')
    setTries(0)
    setChecking(false)
    setSolvedFen(null)
    setMsg(null)
    setDetail(null)
    setAi(null)
    setAiBusy(false)
  }, [idx])

  // dettagli: cosa dovevi fare, come ti punisce l'avversario, cosa restava in presa
  useEffect(() => {
    if (!item) return
    let alive = true
    ;(async () => {
      const j = item.judgement
      const fenAfter = playUci(item.fenBefore, item.uci)
      const facts: string[] = []
      let refuteUci: string | undefined
      if (fenAfter) {
        try {
          const ev = await evaluate(fenAfter)
          refuteUci = ev.best
        } catch {
          /* niente confutazione */
        }
        const after = new Chess(fenAfter)
        const h = hangingPieces(after, color)
        if (h.length) facts.push(`Il tuo ${PIECE_NAME[h[0].piece as PieceSymbol]} in ${h[0].square} resta attaccato e non protetto.`)
      }
      const winAfter = winPct(j.cpAfter)
      const d: Detail = {
        bestSan: j.bestUci ? sanOf(item.fenBefore, j.bestUci) : undefined,
        refuteUci,
        refuteSan: refuteUci && fenAfter ? sanOf(fenAfter, refuteUci) : undefined,
        facts,
        winBefore: Math.min(100, winAfter + j.loss),
        winAfter,
      }
      if (alive) setDetail(d)
    })()
    return () => {
      alive = false
    }
  }, [item, color])

  const bestFen = useMemo(() => (item?.judgement.bestUci ? playUci(item.fenBefore, item.judgement.bestUci) : undefined), [item])
  const playedFen = useMemo(() => (item ? playUci(item.fenBefore, item.uci) : undefined), [item])

  if (!item) return null
  const q = QUALITY_INFO[item.judgement.quality]
  const bestUci = item.judgement.bestUci!
  const best = parseUci(bestUci)
  const played = parseUci(item.uci)

  const onTry = async (from: Square, to: Square, promotion?: PieceSymbol) => {
    if (stage !== 'try' || checking) return
    const uci = from + to + (promotion ?? '')
    if (uci === item.uci) {
      setMsg({ text: 'Quella è proprio la mossa che hai giocato! Cercane un’altra.', mood: 'angry' })
      setShake(true)
      setTimeout(() => setShake(false), 450)
      return
    }
    setChecking(true)
    setMsg({ text: 'Fammi controllare…', mood: 'neutral' })
    let ok = uci === bestUci
    if (!ok) {
      try {
        const j = await judgeMove(item.fenBefore, uci)
        ok = j.loss <= 6
      } catch {
        ok = false
      }
    }
    setChecking(false)
    if (ok) {
      setSolvedFen(playUci(item.fenBefore, uci) ?? null)
      setStage('shown')
      setView('best')
      setMsg({ text: tone === 'gentle' ? 'Esatto! Vedi che quando ci pensi sei bravo?' : 'Ecco, quando ti impegni sai farlo. Peccato averlo capito dopo.', mood: 'happy' })
    } else {
      setTries((t) => t + 1)
      setShake(true)
      setTimeout(() => setShake(false), 450)
      setMsg({ text: tries >= 1 ? 'Ancora no. Ti segno il pezzo da muovere.' : 'No, così non basta. Riprova!', mood: 'neutral' })
    }
  }

  const reveal = () => {
    setStage('shown')
    setView('best')
    setSolvedFen(null)
    setMsg(null)
  }

  const explain = async () => {
    setAiBusy(true)
    const text = await explainWithGemini(geminiKey, {
      fen: item.fenBefore,
      playedSan: item.san,
      bestSan: detail?.bestSan,
      quality: q.label,
      tone,
      facts: detail?.facts ?? [],
    })
    setAiBusy(false)
    setAi(text ?? 'Non riesco a collegarmi a Gemini adesso, ma i numeri qui sopra dicono già tutto.')
  }

  // posizione e frecce mostrate in base alla fase
  let fen = item.fenBefore
  let arrows: ([Square, Square] | [Square, Square, string])[] = []
  let hint: { from?: Square } | null = null
  if (stage === 'try') {
    if (tries >= 2) hint = { from: best.from }
  } else if (view === 'best') {
    fen = solvedFen ?? bestFen ?? item.fenBefore
    if (!solvedFen) arrows = [[best.from, best.to, '#6be36b']]
  } else {
    fen = playedFen ?? item.fenBefore
    arrows = [[played.from, played.to, '#ff5a5a']]
    if (detail?.refuteUci) {
      const r = parseUci(detail.refuteUci)
      arrows.push([r.from, r.to, '#ffb347'])
    }
  }

  const headline =
    stage === 'try'
      ? `Alla mossa ${item.moveNo} hai giocato ${item.san} (${q.label.toLowerCase()}). Sapresti trovare di meglio?`
      : view === 'best'
        ? `${solvedFen ? 'Una mossa giusta. ' : ''}La mossa migliore era ${detail?.bestSan ?? best.from + best.to}${item.judgement.missedMate ? ': ti dava il matto!' : '.'}`
        : `Con ${item.san} ${detail ? `la tua probabilità di vincere è scesa dal ${Math.round(detail.winBefore)}% al ${Math.round(detail.winAfter)}%.` : 'hai buttato via il vantaggio.'}${detail?.refuteSan ? ` L’avversario ora ha ${detail.refuteSan}.` : ''}${detail?.facts[0] ? ' ' + detail.facts[0] : ''}`

  return (
    <div className="review-overlay" role="dialog" aria-modal="true" aria-label="Rivedi i tuoi errori">
      <div className="review-sheet">
        <div className="review-head">
          <div>
            <strong>Rivedi i tuoi errori</strong>
            <small>
              {idx + 1} di {items.length} · solo quelli che contano
            </small>
          </div>
          <button className="ghost" onClick={onClose} aria-label="Chiudi">
            <X size={22} weight="bold" />
          </button>
        </div>

        <div className="review-board">
          <Board fen={fen} orientation={color} movable={stage === 'try' && !checking ? color : null} onMove={onTry} arrows={arrows} hint={hint} shake={shake} />
          <div className="review-legend">
            {stage === 'shown' && view === 'played' && (
              <>
                <span>
                  <i style={{ background: '#ff5a5a' }} /> la tua mossa
                </span>
                {detail?.refuteUci && (
                  <span>
                    <i style={{ background: '#ffb347' }} /> come ti punisce
                  </span>
                )}
              </>
            )}
            {stage === 'shown' && view === 'best' && !solvedFen && (
              <span>
                <i style={{ background: '#6be36b' }} /> mossa migliore
              </span>
            )}
          </div>
        </div>

        <CoachBubble text={msg?.text ?? headline} mood={msg?.mood ?? (stage === 'try' ? 'angry' : view === 'best' ? 'cool' : 'neutral')} size={64}>
          {stage === 'try' && (
            <div className="row">
              <button className="btn" onClick={reveal}>
                <Eye size={18} weight="bold" /> Mostrami la soluzione
              </button>
            </div>
          )}
          {stage === 'shown' && (
            <>
              <div className="seg review-seg">
                <button
                  className={view === 'played' ? 'on' : ''}
                  onClick={() => {
                    setView('played')
                    setMsg(null)
                  }}
                >
                  La tua mossa
                </button>
                <button
                  className={view === 'best' ? 'on' : ''}
                  onClick={() => {
                    setView('best')
                    setMsg(null)
                  }}
                >
                  {solvedFen ? <Check size={16} weight="bold" /> : null} Quella giusta
                </button>
              </div>
              {msg && <p className="review-note">{headline}</p>}
              {geminiKey && !ai && (
                <div className="row">
                  <button className="btn" onClick={explain} disabled={aiBusy}>
                    {aiBusy ? 'Fammi pensare…' : 'Spiegamelo a parole'}
                  </button>
                </div>
              )}
              {ai && <p className="review-note">{ai}</p>}
              <div className="row">
                {idx < items.length - 1 ? (
                  <button className="btn primary" onClick={() => setIdx(idx + 1)}>
                    Prossimo errore <ArrowRight size={18} weight="bold" />
                  </button>
                ) : (
                  <button className="btn primary" onClick={onClose}>
                    Fatto <Check size={18} weight="bold" />
                  </button>
                )}
              </div>
            </>
          )}
        </CoachBubble>
      </div>
    </div>
  )
}
