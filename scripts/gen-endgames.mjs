// Genera puzzle di finale "di scuola" con Stockfish: re e pedone, corse di pedoni, torre e pedone, torre contro pedone.
// Si tengono solo le posizioni in cui UNA mossa vince (o una sola salva la patta) e tutte le altre sbagliano.
// Uso: node scripts/gen-endgames.mjs --family kp|race|rook|rookp --out scripts/.shardE1.json [--per 14] [--minutes 12]
// Poi: node scripts/merge-puzzles.mjs --write scripts/.shardE*.json
import { writeFileSync } from 'node:fs'
import { Chess, VALUE, moveToUci, score, startEngine } from './puzzle-lib.mjs'

const arg = (name, d) => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? process.argv[i + 1] : d
}
const FAMILY = arg('family', 'kp')
const OUT = arg('out', `scripts/.shardE-${FAMILY}.json`)
const PER = Number(arg('per', 14))
const MAX_MS = Number(arg('minutes', 12)) * 60_000
const DEPTH = Number(arg('depth', 16))
const sf = startEngine()

const pick = (n) => Math.floor(Math.random() * n)
const rnd = (a, b) => a + pick(b - a + 1)
const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const sq = (x, y) => 'abcdefgh'[x] + (y + 1)

/** pezzi = [[lettera, x, y], ...] con y = 0 per la prima traversa */
function toFen(pieces, side) {
  const rows = []
  for (let y = 7; y >= 0; y--) {
    let row = ''
    let empty = 0
    for (let x = 0; x < 8; x++) {
      const f = pieces.find((p) => p[1] === x && p[2] === y)
      if (f) {
        if (empty) row += empty
        empty = 0
        row += f[0]
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  return `${rows.join('/')} ${side} - - 0 1`
}

/** Scambia i colori e capovolge la scacchiera, così si gioca anche col Nero. */
function mirror(pieces) {
  return pieces.map(([l, x, y]) => [l === l.toUpperCase() ? l.toLowerCase() : l.toUpperCase(), x, 7 - y])
}

function legal(pieces, side) {
  const occupied = new Set()
  for (const p of pieces) {
    const k = p[1] + ',' + p[2]
    if (occupied.has(k) || p[1] < 0 || p[1] > 7 || p[2] < 0 || p[2] > 7) return null
    occupied.add(k)
  }
  const fen = toFen(pieces, side)
  try {
    const g = new Chess(fen)
    // chi non ha la mossa non può essere sotto scacco
    const other = new Chess(fen.replace(` ${side} `, ` ${side === 'w' ? 'b' : 'w'} `))
    if (other.inCheck()) return null
    return g.fen()
  } catch {
    return null
  }
}

const near = (x, y, r) => [clamp(x + rnd(-r, r), 0, 7), clamp(y + rnd(-r, r), 0, 7)]

/** Una posizione di partenza (bianco "attaccante") per la famiglia scelta. */
function randomPieces() {
  if (FAMILY === 'kp') {
    const px = rnd(0, 7)
    const py = rnd(1, 5)
    const [wx, wy] = near(px, py, 2)
    const [bx, by] = near(px, clamp(py + 2, 0, 7), 2)
    return [['P', px, py], ['K', wx, wy], ['k', bx, by]]
  }
  if (FAMILY === 'race') {
    const px = rnd(0, 7)
    const py = rnd(2, 5)
    const qx = clamp(px + rnd(-3, 3), 0, 7)
    const qy = rnd(2, 5)
    return [['P', px, py], ['p', qx, qy], ['K', rnd(0, 7), rnd(0, 7)], ['k', rnd(0, 7), rnd(0, 7)]]
  }
  if (FAMILY === 'rook') {
    const px = rnd(0, 7)
    const py = rnd(3, 6)
    const [wx, wy] = near(px, py, 2)
    const [bx, by] = near(px, clamp(py + 1, 0, 7), 2)
    return [['P', px, py], ['K', wx, wy], ['R', rnd(0, 7), rnd(0, 7)], ['k', bx, by], ['r', rnd(0, 7), rnd(0, 7)]]
  }
  // rookp: torre e re contro re e pedone ormai avanzato
  const px = rnd(0, 7)
  const py = rnd(1, 2)
  const [bx, by] = near(px, py, 1)
  return [['p', px, py], ['k', bx, by], ['K', rnd(0, 7), rnd(2, 7)], ['R', rnd(0, 7), rnd(0, 7)]]
}

/** Una sola mossa vince, oppure una sola mossa salva la patta. Restituisce il tipo di soluzione o null. */
async function classify(fen) {
  const res = await sf.analyze(fen, DEPTH, 2)
  const best = res[0]
  const second = res[1]
  if (!best || !second) return null
  const b = score(best)
  const s = score(second)
  const g = new Chess(fen)
  if (g.inCheck() || g.moves().length < 4) return null // mossa obbligata: nessuna sorpresa
  const mv = g.moves({ verbose: true }).find((m) => moveToUci(m) === best.pv[0])
  if (!mv || mv.promotion) return null
  if (mv.captured && VALUE[mv.captured] >= 3) return null
  if (b >= 250 && s <= 80) return { solution: best.pv[0], result: 'win' }
  if (Math.abs(b) <= 40 && s <= -250) return { solution: best.pv[0], result: 'draw' }
  return null
}

const found = []
const seen = new Set()
const started = Date.now()
let tries = 0
while (found.length < PER && Date.now() - started < MAX_MS) {
  let pieces = randomPieces()
  if (Math.random() < 0.5) pieces = mirror(pieces)
  for (const side of FAMILY === 'kp' || FAMILY === 'rookp' || FAMILY === 'rook' ? ['w', 'b'] : ['w']) {
    const fen = legal(pieces, side)
    if (!fen || seen.has(fen)) continue
    seen.add(fen)
    tries++
    const c = await classify(fen)
    if (c) {
      const kind = FAMILY === 'kp' ? (c.result === 'draw' ? 'kpd' : 'kp') : c.result === 'draw' && FAMILY === 'rook' ? 'rookd' : FAMILY
      found.push({ fen, theme: 'endgame', kind, moves: [c.solution] })
      console.log(`${FAMILY}: ${found.length}/${PER} (${tries} posizioni) ${kind} ${fen}`)
    }
  }
}
writeFileSync(OUT, JSON.stringify(found))
console.log(`Fatto: ${found.length} candidati in ${OUT} (${tries} posizioni analizzate)`)
sf.stop()
process.exit(0)
