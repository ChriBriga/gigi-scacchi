// Strumenti in comune per gli script dei puzzle: Stockfish (WASM) da riga di comando e qualche funzione di scacchi.
import { createRequire } from 'node:module'
import { Chess } from 'chess.js'

const require = createRequire(import.meta.url)

export const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }

export function startEngine() {
  let pending = null
  let lines = new Map()
  const sf = require('stockfish')('lite-single', (line) => {
    if (typeof line !== 'string') return
    if (line.startsWith('info') && line.includes(' pv ')) {
      const mpv = Number(/ multipv (\d+)/.exec(line)?.[1] ?? 1)
      const cp = / score cp (-?\d+)/.exec(line)
      const mate = / score mate (-?\d+)/.exec(line)
      lines.set(mpv, {
        mpv,
        cp: cp ? Number(cp[1]) : undefined,
        mate: mate ? Number(mate[1]) : undefined,
        pv: line.split(' pv ')[1].trim().split(' '),
      })
    } else if (line.startsWith('bestmove') && pending) {
      const p = pending
      pending = null
      p([...lines.values()].sort((a, b) => a.mpv - b.mpv))
    }
  })
  sf.processCommand('uci')
  return {
    /** Analizza una posizione: restituisce le migliori `multipv` linee (punteggio dal punto di vista di chi muove). */
    analyze(fen, depth, multipv = 1) {
      return new Promise((resolve) => {
        lines = new Map()
        pending = resolve
        sf.processCommand(`setoption name MultiPV value ${multipv}`)
        sf.processCommand(`position fen ${fen}`)
        sf.processCommand(`go depth ${depth}`)
      })
    },
    stop: () => sf.terminate(),
  }
}

/** Punteggio in centipawn (i matti valgono molto, ma meno quelli lontani). */
export const score = (l) => (l.mate !== undefined ? Math.sign(l.mate) * (3000 - Math.abs(l.mate) * 20) : (l.cp ?? 0))

export const uciToMove = (u) => ({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined })
export const moveToUci = (m) => m.from + m.to + (m.promotion ?? '')

export function material(chess, color) {
  let t = 0
  for (const row of chess.board()) for (const p of row) if (p && p.color === color && p.type !== 'k') t += VALUE[p.type]
  return t
}

/** Le case occupate (stringa di 64 caratteri) per confrontare due posizioni. */
export const boardKey = (fen) => fen.split(' ')[0].replace(/\d/g, (d) => '.'.repeat(+d)).replace(/\//g, '')

/** Quante case sono uguali fra due posizioni: 64 = identiche. */
export function similarity(fenA, fenB) {
  const a = boardKey(fenA)
  const b = boardKey(fenB)
  let same = 0
  for (let i = 0; i < 64; i++) if (a[i] === b[i]) same++
  return same
}

/** Gioca la sequenza di mosse UCI da una posizione; restituisce la partita o null se qualche mossa è illegale. */
export function play(fen, ucis) {
  const g = new Chess(fen)
  for (const u of ucis) {
    try {
      g.move(uciToMove(u))
    } catch {
      return null
    }
  }
  return g
}

export { Chess }

/** Quanta parte dei pezzi (stesso pezzo sulla stessa casa) due posizioni hanno in comune: 1 = identiche. Va bene anche per i finali con pochi pezzi. */
export function pieceOverlap(fenA, fenB) {
  const set = (fen) => {
    const k = boardKey(fen)
    const s = new Set()
    for (let i = 0; i < 64; i++) if (k[i] !== '.') s.add(i + k[i])
    return s
  }
  const a = set(fenA)
  const b = set(fenB)
  let same = 0
  for (const x of a) if (b.has(x)) same++
  return same / Math.max(a.size, b.size, 1)
}
