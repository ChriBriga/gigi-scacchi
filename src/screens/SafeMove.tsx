import { useMemo, useState } from 'react'
import { Chess, type PieceSymbol } from 'chess.js'
import { ArrowLeft, Check, ShieldCheck, Warning, X } from '@phosphor-icons/react'
import { Board } from '../components/Board'
import { EmptyState } from '../ui/EmptyState'
import { getState, useApp } from '../store'
import { hangingPieces } from '../chess/danger'
import { PIECE_NAME, parseUci } from '../chess/util'

interface Round {
  fen: string
  color: 'w' | 'b'
  /** la mossa che ti viene proposta */
  uci: string
  san: string
  safe: boolean
  /** cosa dire dopo la risposta */
  why: string
}

const ROUNDS = 6

function sanOf(fen: string, uci: string): string | null {
  try {
    const m = parseUci(uci)
    return new Chess(fen).move({ from: m.from, to: m.to, promotion: m.promotion })?.san ?? null
  } catch {
    return null
  }
}

/** Perché la mossa sbagliata era un errore, con quello che si perde davvero. */
function whyBad(fen: string, color: 'w' | 'b', uci: string, bestSan: string | null, loss: number, missedMate?: boolean): string {
  const best = bestSan ? ` Meglio ${bestSan}.` : ''
  try {
    const c = new Chess(fen)
    const m = parseUci(uci)
    c.move({ from: m.from, to: m.to, promotion: m.promotion })
    const hang = hangingPieces(c, color)
    if (hang.length) {
      const h = hang[0]
      return `Lasci in presa ${h.piece === 'k' ? 'il re' : `il ${PIECE_NAME[h.piece as PieceSymbol]}`} in ${h.square}.${best}`
    }
  } catch {
    /* si passa al testo generico */
  }
  if (missedMate) return `Avevi un matto forzato e questa mossa lo lascia scappare.${best}`
  const pawns = Math.max(1, Math.round(loss / 100))
  return `Perdi circa ${pawns} ${pawns === 1 ? 'pedone' : 'pedoni'} di vantaggio.${best}`
}

function buildRounds(): Round[] {
  const items = [...(getState().progress.notebook ?? [])].sort(() => Math.random() - 0.5).slice(0, ROUNDS)
  const out: Round[] = []
  items.forEach((n, i) => {
    const bestSan = sanOf(n.fen, n.best)
    if (!bestSan) return
    // metà proposte sicure, metà errori, in ordine sparso
    const safe = (i + Math.floor(Math.random() * 2)) % 2 === 0 && n.best !== n.played
    if (safe) out.push({ fen: n.fen, color: n.color, uci: n.best, san: bestSan, safe: true, why: 'È la mossa giusta: non lascia niente di scoperto.' })
    else out.push({ fen: n.fen, color: n.color, uci: n.played, san: n.playedSan, safe: false, why: whyBad(n.fen, n.color, n.played, bestSan, n.j.loss, n.j.missedMate) })
  })
  return out.sort(() => Math.random() - 0.5)
}

/** "Questa mossa è sicura?": una posizione dei tuoi errori e una mossa proposta; dici se va bene o no. */
export function SafeMove({ onExit }: { onExit: () => void }) {
  const { progress } = useApp()
  // fissate all'apertura, come per il quaderno
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const rounds = useMemo(buildRounds, [])
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<boolean | null>(null)
  const [right, setRight] = useState(0)

  const top = (
    <div className="topbar">
      <button className="ghost" onClick={onExit}>
        <ArrowLeft size={20} weight="bold" /> Esci
      </button>
      <div className="title">
        <ShieldCheck size={24} weight="duotone" /> Questa mossa è sicura?
      </div>
    </div>
  )

  if (rounds.length === 0) {
    return (
      <div className="screen">
        {top}
        <div className="card">
          <EmptyState
            text={progress.notebook?.length ? 'Non ci sono posizioni adatte.' : 'Servono i tuoi errori: gioca qualche partita e torna qui.'}
            mood="thinking"
            action={
              <button className="btn primary" onClick={onExit}>
                Va bene
              </button>
            }
          />
        </div>
      </div>
    )
  }

  if (i >= rounds.length) {
    return (
      <div className="screen">
        {top}
        <div className="card">
          <h3>
            {right} su {rounds.length}
          </h3>
          <p className="muted">
            {right === rounds.length ? 'Occhio da falco: nessuna svista.' : 'Le sviste si riconoscono con la pratica: prima di muovere, guarda cosa resta in presa.'}
          </p>
          <button className="btn primary" onClick={onExit}>
            Fine
          </button>
        </div>
      </div>
    )
  }

  const r = rounds[i]
  const m = parseUci(r.uci)
  const ok = answer === r.safe
  const reply = (a: boolean) => {
    setAnswer(a)
    if (a === r.safe) setRight((n) => n + 1)
  }

  return (
    <div className="screen">
      {top}
      <div className="card">
        <p className="muted" style={{ marginTop: 0 }}>
          Posizione {i + 1} di {rounds.length}. Tocca a te: la mossa proposta è <b>{r.san}</b>. È sicura?
        </p>
        <Board fen={r.fen} orientation={r.color} movable={null} arrows={[[m.from, m.to, answer === null ? '#ffd640' : r.safe ? '#3fb950' : '#f85149']]} />
        {answer === null ? (
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="btn big" style={{ flex: 1 }} onClick={() => reply(true)}>
              <Check size={20} weight="bold" /> Sicura
            </button>
            <button className="btn big" style={{ flex: 1 }} onClick={() => reply(false)}>
              <Warning size={20} weight="bold" /> È un errore
            </button>
          </div>
        ) : (
          <>
            <p style={{ marginBottom: 8 }}>
              {ok ? <Check size={20} weight="bold" /> : <X size={20} weight="bold" />} <b>{ok ? 'Esatto.' : 'Non proprio.'}</b> {r.why}
            </p>
            <button
              className="btn primary"
              onClick={() => {
                setAnswer(null)
                setI(i + 1)
              }}
            >
              {i + 1 < rounds.length ? 'Avanti' : 'Vedi il risultato'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
