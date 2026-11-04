// Genera puzzle tattici per principianti analizzando partite "deboli" con Stockfish.
// Uso: node scripts/gen-puzzles.mjs  ->  scrive src/data/puzzles.json
import { createRequire } from 'node:module'
import { writeFileSync, mkdirSync } from 'node:fs'
import { Chess } from 'chess.js'

const require = createRequire(import.meta.url)
const VALUE = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 100 }
const TARGET = { mate1: 40, mate2: 30, free: 40, fork: 40, tactic: 40 }

let pending = null
let lines = new Map()
const sf = require('stockfish')('lite-single', (line) => {
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
  } else if (line === 'readyok' && pending?.ready) pending()
})
sf.processCommand('uci')

function analyze(fen, depth, multipv) {
  return new Promise((resolve) => {
    lines = new Map()
    pending = resolve
    sf.processCommand(`setoption name MultiPV value ${multipv}`)
    sf.processCommand(`position fen ${fen}`)
    sf.processCommand(`go depth ${depth}`)
  })
}

const score = (l) => (l.mate !== undefined ? Math.sign(l.mate) * (3000 - Math.abs(l.mate) * 20) : (l.cp ?? 0))

function material(chess, color) {
  let t = 0
  for (const row of chess.board()) for (const p of row) if (p && p.color === color && p.type !== 'k') t += VALUE[p.type]
  return t
}

function uciToMove(u) {
  return { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined }
}

/** Gioca una partita debole e restituisce le posizioni (FEN) da analizzare. */
async function weakGame() {
  const g = new Chess()
  const fens = []
  for (let ply = 0; ply < 60 && !g.isGameOver(); ply++) {
    if (ply >= 6) fens.push(g.fen())
    const legal = g.moves({ verbose: true })
    let pick
    if (ply < 4) pick = legal[Math.floor(Math.random() * legal.length)]
    else {
      const res = await analyze(g.fen(), 2, 5)
      const ws = res.map((l) => Math.exp(-(score(res[0]) - score(l)) / 220))
      let r = Math.random() * ws.reduce((a, b) => a + b, 0)
      let idx = 0
      for (; idx < ws.length; idx++) {
        r -= ws[idx]
        if (r <= 0) break
      }
      const u = res[Math.min(idx, res.length - 1)].pv[0]
      pick = uciToMove(u)
    }
    g.move(pick.from ? { from: pick.from, to: pick.to, promotion: pick.promotion } : pick)
  }
  return fens
}

function classify(fen, best, second) {
  const g = new Chess(fen)
  const mover = g.turn()
  const opp = mover === 'w' ? 'b' : 'w'
  const legal = g.moves({ verbose: true })

  if (best.mate === 1) {
    const mates = legal.filter((m) => {
      const c = new Chess(fen)
      c.move(m)
      return c.isCheckmate()
    })
    if (mates.length > 2) return null
    return { theme: 'mate1', moves: [best.pv[0]], mates: mates.map((m) => m.from + m.to + (m.promotion ?? '')) }
  }
  if (best.mate === 2) {
    if (second && second.mate !== undefined && second.mate > 0 && second.mate <= 2) return null
    if (best.pv.length < 3) return null
    return { theme: 'mate2', moves: best.pv.slice(0, 3) }
  }
  if (best.mate !== undefined) return null

  const matDiff = material(g, mover) - material(g, opp)
  if (matDiff > 1) return null
  if (best.cp < 250) return null
  if (second && score(second) > best.cp - 150) return null

  const m = uciToMove(best.pv[0])
  const move = legal.find((x) => x.from === m.from && x.to === m.to && (x.promotion ?? undefined) === m.promotion)
  if (!move) return null
  const after = new Chess(fen)
  after.move(move)
  if (after.isCheckmate()) return null

  if (move.captured) {
    const capturedV = VALUE[move.captured]
    const moverV = VALUE[move.piece]
    const recapturers = after.attackers(move.to, opp)
    if (recapturers.length === 0 || capturedV >= moverV + 2) {
      if (capturedV >= 3 || (recapturers.length === 0 && capturedV >= 3)) return { theme: 'free', moves: [best.pv[0]] }
    }
  }

  // forchetta: il pezzo mosso attacca 2+ bersagli "buoni" e non può essere preso gratis
  if (move.piece !== 'k') {
    const targets = []
    for (const row of after.board()) {
      for (const p of row) {
        if (!p || p.color !== opp) continue
        const attackedByMoved = after.attackers(p.square, mover).includes(move.to)
        if (!attackedByMoved) continue
        const defended = after.attackers(p.square, opp).length > 0
        if (p.type === 'k' || !defended || VALUE[p.type] > VALUE[move.piece]) targets.push(p)
      }
    }
    const safe = after.attackers(move.to, opp).length === 0 || after.attackers(move.to, mover).length > 0
    if (targets.length >= 2 && safe && !move.captured) return { theme: 'fork', moves: [best.pv[0]] }
  }
  return { theme: 'tactic', moves: [best.pv[0]] }
}

const found = { mate1: [], mate2: [], free: [], fork: [], tactic: [] }
const seen = new Set()
const done = () => Object.keys(TARGET).every((k) => found[k].length >= TARGET[k])

let games = 0
const started = Date.now()
while (!done() && games < 400) {
  games++
  const fens = await weakGame()
  const perTheme = {}
  for (const fen of fens) {
    const key = fen.split(' ').slice(0, 2).join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    const res = await analyze(fen, 11, 3)
    if (res.length === 0) continue
    const p = classify(fen, res[0], res[1])
    if (!p || found[p.theme].length >= TARGET[p.theme]) continue
    if ((perTheme[p.theme] ?? 0) >= 2) continue
    perTheme[p.theme] = (perTheme[p.theme] ?? 0) + 1
    const id = `${p.theme}-${found[p.theme].length + 1}`
    found[p.theme].push({ id, fen, ...p })
  }
  const prog = Object.keys(TARGET).map((k) => `${k}:${found[k].length}/${TARGET[k]}`).join(' ')
  console.log(`partita ${games} (${Math.round((Date.now() - started) / 1000)}s) ${prog}`)
}

const all = Object.values(found).flat()
mkdirSync('src/data', { recursive: true })
writeFileSync('src/data/puzzles.json', JSON.stringify(all))
console.log('scritti', all.length, 'puzzle')
sf.terminate()
