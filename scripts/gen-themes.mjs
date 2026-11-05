// Genera candidati per i temi nuovi dei puzzle (inchiodatura, infilata, scoperta, difesa, matto di corridoio,
// schemi di matto, finali) analizzando partite "deboli" e posizioni di finale con Stockfish.
// Uso: node scripts/gen-themes.mjs --out scripts/.shard1.json [--themes pin,skewer] [--per 12] [--minutes 25]
// I candidati poi vanno controllati e uniti con:  node scripts/merge-puzzles.mjs scripts/.shard*.json
import { writeFileSync } from 'node:fs'
import { Chess, VALUE, material, moveToUci, play, score, startEngine, uciToMove } from './puzzle-lib.mjs'

const arg = (name, d) => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? process.argv[i + 1] : d
}
const OUT = arg('out', 'scripts/.shard.json')
const THEMES = arg('themes', 'pin,skewer,discover,defend,backrank,matepat,endgame').split(',')
const PER = Number(arg('per', 12))
const MAX_MS = Number(arg('minutes', 25)) * 60_000
const sf = startEngine()

// ---------- geometria ----------
const xy = (s) => [s.charCodeAt(0) - 97, Number(s[1]) - 1]
const sqOf = (x, y) => String.fromCharCode(97 + x) + (y + 1)
const aligned = (a, b) => {
  const [ax, ay] = xy(a)
  const [bx, by] = xy(b)
  const dx = bx - ax
  const dy = by - ay
  return a !== b && (dx === 0 || dy === 0 || Math.abs(dx) === Math.abs(dy))
}
/** le case strettamente comprese fra due case allineate */
function between(a, b) {
  const [ax, ay] = xy(a)
  const [bx, by] = xy(b)
  const dx = Math.sign(bx - ax)
  const dy = Math.sign(by - ay)
  const out = []
  let x = ax + dx
  let y = ay + dy
  while (x !== bx || y !== by) {
    out.push(sqOf(x, y))
    x += dx
    y += dy
  }
  return out
}
/** il primo pezzo che si incontra oltre `over`, partendo da `from` */
function beyond(g, from, over) {
  const [fx, fy] = xy(from)
  const [ox, oy] = xy(over)
  const dx = Math.sign(ox - fx)
  const dy = Math.sign(oy - fy)
  let x = ox + dx
  let y = oy + dy
  while (x >= 0 && x < 8 && y >= 0 && y < 8) {
    const s = sqOf(x, y)
    const p = g.get(s)
    if (p) return { square: s, ...p }
    x += dx
    y += dy
  }
  return null
}
const pieces = (g, color) => g.board().flat().filter((p) => p && p.color === color)

// ---------- schemi di matto ----------
function matePattern(g) {
  const loser = g.turn()
  const winner = loser === 'w' ? 'b' : 'w'
  const king = pieces(g, loser).find((p) => p.type === 'k')
  const checkers = g.attackers(king.square, winner)
  if (checkers.length !== 1) return null
  const chk = g.get(checkers[0])
  const [kx, ky] = xy(king.square)
  const around = []
  for (let dx = -1; dx <= 1; dx++)
    for (let dy = -1; dy <= 1; dy++) {
      if (!dx && !dy) continue
      const x = kx + dx
      const y = ky + dy
      if (x >= 0 && x < 8 && y >= 0 && y < 8) around.push(sqOf(x, y))
    }
  const own = (s) => g.get(s)?.color === loser
  if (chk.type === 'n' && around.every(own)) return 'smother'
  // matto arabo: re in un angolo, torre accanto a lui e cavallo che la protegge
  const corner = (kx === 0 || kx === 7) && (ky === 0 || ky === 7)
  const [cx, cy] = xy(checkers[0])
  if (corner && chk.type === 'r' && Math.abs(cx - kx) + Math.abs(cy - ky) === 1 && g.attackers(checkers[0], winner).some((s) => g.get(s).type === 'n')) return 'arabian'
  // bacio della morte: la donna dà matto accanto al re, protetta da un altro pezzo
  if (chk.type === 'q' && Math.max(Math.abs(cx - kx), Math.abs(cy - ky)) === 1 && g.attackers(checkers[0], winner).length >= 1) return 'kiss'
  const backRank = loser === 'w' ? 1 : 8
  const second = loser === 'w' ? 2 : 7
  if (ky + 1 === backRank && (chk.type === 'r' || chk.type === 'q') && Number(checkers[0][1]) === backRank) {
    const sec = around.filter((s) => Number(s[1]) === second)
    if (sec.length > 0 && sec.every(own)) return 'backrank'
  }
  return null
}

// ---------- tattiche ----------
const matDelta = (g, color) => material(g, color) - material(g, color === 'w' ? 'b' : 'w')

/** Cattura che l'attaccante fa al passo `idx` della variante (se c'è). */
function captureAt(fen, pv, idx) {
  const g = play(fen, pv.slice(0, idx))
  if (!g || !pv[idx]) return null
  const m = g.moves({ verbose: true }).find((x) => moveToUci(x) === pv[idx])
  return m?.captured ? m : null
}

function classifyTactic(fen, best, second) {
  const g0 = new Chess(fen)
  const mover = g0.turn()
  const opp = mover === 'w' ? 'b' : 'w'
  if (best.mate !== undefined) return null
  if (best.cp < 250) return null
  if (second && score(second) > best.cp - 150) return null
  if (matDelta(g0, mover) > 1) return null
  if (best.pv.length < 4) return null
  const move = g0.moves({ verbose: true }).find((m) => moveToUci(m) === best.pv[0])
  if (!move) return null
  const after = new Chess(fen)
  after.move(move)
  if (after.isCheckmate()) return null
  const gAfter4 = play(fen, best.pv.slice(0, 4))
  if (!gAfter4) return null
  const gain = matDelta(gAfter4, mover) - matDelta(g0, mover)
  if (gain < 2) return null
  const cap2 = captureAt(fen, best.pv, 2)
  if (!cap2) return null
  const moves = [best.pv[0]]

  // scoperta: si sposta un pezzo e un alfiere/torre/donna dietro di lui attacca un bersaglio
  for (const S of pieces(g0, mover)) {
    if (!['b', 'r', 'q'].includes(S.type) || S.square === move.from) continue
    for (const T of pieces(g0, opp)) {
      if (!aligned(S.square, T.square)) continue
      if (!between(S.square, T.square).includes(move.from)) continue
      if (g0.attackers(T.square, mover).includes(S.square)) continue
      if (!after.attackers(T.square, mover).includes(S.square)) continue
      if (T.type !== 'k' && VALUE[T.type] < 3) continue
      if (T.type === 'k' || cap2.to === T.square || VALUE[cap2.captured] >= 3) return { theme: 'discover', moves }
    }
  }

  if (['b', 'r', 'q'].includes(move.piece)) {
    const S = move.to
    for (const P1 of pieces(after, opp)) {
      if (!aligned(S, P1.square) || !after.attackers(P1.square, mover).includes(S)) continue
      const P2 = beyond(after, S, P1.square)
      if (!P2 || P2.color !== opp) continue
      // infilata: davanti il pezzo di valore (re compreso), dietro uno meno prezioso che resta preso
      if ((P1.type === 'k' || VALUE[P1.type] >= 5) && VALUE[P2.type] >= 1 && VALUE[P2.type] < VALUE[P1.type] && cap2.to === P2.square) return { theme: 'skewer', moves }
      // inchiodatura: davanti un pezzo che non può muoversi senza lasciare scoperto uno più prezioso
      if (P1.type !== 'k' && (P2.type === 'k' || VALUE[P2.type] > VALUE[P1.type]) && cap2.to === P1.square) return { theme: 'pin', moves }
    }
  }
  return null
}

// ---------- difesa ----------
async function classifyDefend(fen, res) {
  const best = res[0]
  const second = res[1]
  if (!second || best.mate !== undefined) return null
  if (best.cp < -100 || best.cp > 200) return null
  if (score(second) > best.cp - 200) return null
  const g = new Chess(fen)
  if (g.inCheck()) return null
  const parts = fen.split(' ')
  parts[1] = parts[1] === 'w' ? 'b' : 'w'
  parts[3] = '-'
  let threatFen
  try {
    threatFen = new Chess(parts.join(' ')).fen()
  } catch {
    return null
  }
  const t = (await sf.analyze(threatFen, 11, 1))[0]
  if (!t || !(t.mate > 0 || t.cp >= 300)) return null
  const tm = uciToMove(t.pv[0])
  const real = new Chess(threatFen).moves({ verbose: true }).find((m) => m.from === tm.from && m.to === tm.to)
  // la minaccia è sempre una cattura o uno scacco che fa davvero male
  if (!real || !(real.captured || /[+#]/.test(real.san))) return null
  return { theme: 'defend', moves: [best.pv[0]], threat: t.pv[0] }
}

// ---------- partite deboli ----------
async function weakGame() {
  const g = new Chess()
  const fens = []
  for (let ply = 0; ply < 70 && !g.isGameOver(); ply++) {
    if (ply >= 6) fens.push(g.fen())
    const legal = g.moves({ verbose: true })
    let pick
    if (ply < 4) pick = legal[Math.floor(Math.random() * legal.length)]
    else {
      const res = await sf.analyze(g.fen(), 2, 5)
      const ws = res.map((l) => Math.exp(-(score(res[0]) - score(l)) / 220))
      let r = Math.random() * ws.reduce((a, b) => a + b, 0)
      let idx = 0
      for (; idx < ws.length; idx++) {
        r -= ws[idx]
        if (r <= 0) break
      }
      pick = uciToMove(res[Math.min(idx, res.length - 1)].pv[0])
    }
    g.move(pick)
  }
  return fens
}

// ---------- finali ----------
function randomEndgame() {
  const pick = (n) => Math.floor(Math.random() * n)
  const used = new Set()
  const free = (xr = [0, 7], yr = [0, 7]) => {
    for (let k = 0; k < 50; k++) {
      const s = sqOf(xr[0] + pick(xr[1] - xr[0] + 1), yr[0] + pick(yr[1] - yr[0] + 1))
      if (!used.has(s)) {
        used.add(s)
        return s
      }
    }
    return null
  }
  const wp = 1 + pick(2)
  const bp = pick(2)
  const sqs = { K: free(), k: free() }
  const placed = []
  for (let i = 0; i < wp; i++) placed.push(['P', free([0, 7], [2, 5])])
  for (let i = 0; i < bp; i++) placed.push(['p', free([0, 7], [1, 5])])
  if (Object.values(sqs).includes(null) || placed.some((p) => !p[1])) return null
  const all = [['K', sqs.K], ['k', sqs.k], ...placed]
  const rows = []
  for (let y = 7; y >= 0; y--) {
    let row = ''
    let empty = 0
    for (let x = 0; x < 8; x++) {
      const found = all.find((p) => p[1] === sqOf(x, y))
      if (found) {
        if (empty) row += empty
        empty = 0
        row += found[0]
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  const side = Math.random() < 0.5 ? 'w' : 'b'
  const fen = `${rows.join('/')} ${side} - - 0 1`
  try {
    const g = new Chess(fen)
    // i due re non devono essere in presa in modo strano
    const other = new Chess(fen.replace(` ${side} `, ` ${side === 'w' ? 'b' : 'w'} `))
    if (other.inCheck()) return null
    return g.fen()
  } catch {
    return null
  }
}

async function classifyEndgame(fen) {
  const res = await sf.analyze(fen, 16, 2)
  const best = res[0]
  const second = res[1]
  if (!best || !second) return null
  const g = new Chess(fen)
  const mover = g.turn()
  // si vince solo con una mossa precisa; qualunque altra lascia il pareggio (o peggio)
  if (!(best.mate > 0 || best.cp >= 300) || score(second) > 80) return null
  if (matDelta(g, mover) > 3) return null
  return { theme: 'endgame', moves: [best.pv[0]] }
}

// ---------- matto di corridoio costruito ----------
/** Ribalta una posizione: i colori si scambiano (serve per avere puzzle anche col Nero che muove). */
function mirrorFen(fen) {
  const [board, side, , ,] = fen.split(' ')
  const rows = board
    .split('/')
    .reverse()
    .map((r) => [...r].map((c) => (/[a-z]/.test(c) ? c.toUpperCase() : /[A-Z]/.test(c) ? c.toLowerCase() : c)).join(''))
  return `${rows.join('/')} ${side === 'w' ? 'b' : 'w'} - - 0 1`
}

/** Il Nero ha il re sull'ultima riga chiuso dai suoi pedoni; il Bianco ha una torre o una donna e qualche altro pezzo. */
function constructBackrank() {
  const pick = (n) => Math.floor(Math.random() * n)
  const board = new Map()
  const put = (sq, p) => {
    if (!sq || board.has(sq)) return false
    board.set(sq, p)
    return true
  }
  const rnd = (xs, ys) => sqOf(xs[0] + pick(xs[1] - xs[0] + 1), ys[0] + pick(ys[1] - ys[0] + 1))
  const kx = [0, 1, 2, 5, 6, 7][pick(6)]
  put(sqOf(kx, 7), 'k')
  for (const dx of [-1, 0, 1]) if (kx + dx >= 0 && kx + dx <= 7) put(sqOf(kx + dx, 6), 'p')
  // un eventuale difensore del Nero sull'ultima riga (torre o donna) o pezzi sparsi
  if (Math.random() < 0.3) put(rnd([0, 7], [7, 7]), Math.random() < 0.7 ? 'r' : 'q')
  for (let i = 0; i < pick(3); i++) put(rnd([0, 7], [3, 6]), ['p', 'n', 'b'][pick(3)])
  // il Bianco
  put(rnd([0, 7], [0, 1]), 'K')
  put(rnd([0, 7], [0, 3]), Math.random() < 0.6 ? 'R' : 'Q')
  if (Math.random() < 0.5) put(rnd([0, 7], [0, 3]), Math.random() < 0.6 ? 'R' : 'Q')
  for (let i = 0; i < pick(4); i++) put(rnd([0, 7], [1, 4]), ['P', 'N', 'B'][pick(3)])
  const rows = []
  for (let y = 7; y >= 0; y--) {
    let row = ''
    let empty = 0
    for (let x = 0; x < 8; x++) {
      const p = board.get(sqOf(x, y))
      if (p) {
        if (empty) row += empty
        empty = 0
        row += p
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  let fen = `${rows.join('/')} w - - 0 1`
  try {
    // il Nero non può essere sotto scacco con il Bianco al tratto
    if (new Chess(fen.replace(' w ', ' b ')).inCheck()) return null
    new Chess(fen)
  } catch {
    return null
  }
  if (Math.random() < 0.5) fen = mirrorFen(fen)
  return fen
}

/** Re nero in un angolo, circondato dai suoi pezzi, con cavalli e pezzi pesanti bianchi: per i matti soffocati e arabi. */
function constructCorner() {
  const pick = (n) => Math.floor(Math.random() * n)
  const board = new Map()
  const put = (sq, p) => {
    if (!sq || board.has(sq)) return false
    board.set(sq, p)
    return true
  }
  const rnd = (xs, ys) => sqOf(xs[0] + pick(xs[1] - xs[0] + 1), ys[0] + pick(ys[1] - ys[0] + 1))
  const kx = Math.random() < 0.5 ? 0 : 7
  put(sqOf(kx, 7), 'k')
  const dir = kx === 0 ? 1 : -1
  const around = [sqOf(kx + dir, 7), sqOf(kx, 6), sqOf(kx + dir, 6)]
  for (const s of around) if (Math.random() < 0.75) put(s, ['r', 'r', 'p', 'p', 'b', 'q'][pick(6)])
  for (let i = 0; i < pick(3); i++) put(rnd([0, 7], [3, 6]), ['p', 'n', 'b', 'p'][pick(4)])
  put(rnd([0, 7], [0, 1]), 'K')
  for (let i = 0; i < 1 + pick(2); i++) put(rnd([0, 7], [1, 6]), 'N')
  put(rnd([0, 7], [0, 6]), Math.random() < 0.6 ? 'Q' : 'R')
  if (Math.random() < 0.5) put(rnd([0, 7], [0, 6]), Math.random() < 0.5 ? 'R' : 'Q')
  for (let i = 0; i < pick(3); i++) put(rnd([0, 7], [1, 4]), ['P', 'B'][pick(2)])
  const rows = []
  for (let y = 7; y >= 0; y--) {
    let row = ''
    let empty = 0
    for (let x = 0; x < 8; x++) {
      const p = board.get(sqOf(x, y))
      if (p) {
        if (empty) row += empty
        empty = 0
        row += p
      } else empty++
    }
    if (empty) row += empty
    rows.push(row)
  }
  let fen = `${rows.join('/')} w - - 0 1`
  try {
    if (new Chess(fen.replace(' w ', ' b ')).inCheck()) return null
    new Chess(fen)
  } catch {
    return null
  }
  if (Math.random() < 0.5) fen = mirrorFen(fen)
  return fen
}

// ---------- ciclo principale ----------
const found = Object.fromEntries(THEMES.map((t) => [t, []]))
const seen = new Set()
const started = Date.now()
const done = () => THEMES.every((t) => found[t].length >= PER)
const save = () => writeFileSync(OUT, JSON.stringify(Object.values(found).flat()))
const add = (p, fen) => {
  if (!THEMES.includes(p.theme) || found[p.theme].length >= PER) return false
  found[p.theme].push({ fen, ...p })
  return true
}
const status = () => THEMES.map((t) => `${t}:${found[t].length}/${PER}`).join(' ')

if (THEMES.includes('endgame')) {
  let tries = 0
  while (found.endgame.length < PER && Date.now() - started < MAX_MS / 3) {
    tries++
    const fen = randomEndgame()
    if (!fen || seen.has(fen)) continue
    seen.add(fen)
    const c = await classifyEndgame(fen)
    if (c) add(c, fen)
    if (tries % 40 === 0) console.log(`finali: ${tries} posizioni, trovati ${found.endgame.length}`)
  }
  save()
}

/** Esamina una posizione e restituisce un candidato (o null). */
async function examine(fen) {
  const res = await sf.analyze(fen, 11, 3)
  if (res.length === 0) return null
  const best = res[0]
  const second = res[1]
  if (best.mate === 1 || best.mate === 2) {
    if (second && second.mate > 0 && second.mate <= 2) return null
    const need = 2 * best.mate - 1
    if (best.pv.length < need) return null
    const g = play(fen, best.pv.slice(0, need))
    const kind = g?.isCheckmate() ? matePattern(g) : null
    return kind ? { theme: kind === 'backrank' ? 'backrank' : 'matepat', kind, moves: best.pv.slice(0, need) } : null
  }
  let c = classifyTactic(fen, best, second)
  if (!c && THEMES.includes('defend')) c = await classifyDefend(fen, res)
  return c
}

// costruzione di posizioni con re in un angolo: matto soffocato e matto arabo (--construct-corner)
if (process.argv.includes('--construct-corner') && THEMES.includes('matepat')) {
  let tries = 0
  while (found.matepat.length < PER && Date.now() - started < MAX_MS) {
    tries++
    const fen = constructCorner()
    if (!fen) continue
    const key = fen.split(' ').slice(0, 2).join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    const c = await examine(fen)
    if (c && c.theme === 'matepat' && (c.kind === 'smother' || c.kind === 'arabian')) add(c, fen)
    if (tries % 200 === 0) {
      save()
      console.log(`costruite ${tries} posizioni, soffocati/arabi ${found.matepat.length}/${PER}`)
    }
  }
  save()
  console.log('FINE', status())
  sf.stop()
  process.exit(0)
}

// costruzione di posizioni per il matto di corridoio (se richiesto con --construct)
if (process.argv.includes('--construct') && THEMES.includes('backrank')) {
  let tries = 0
  while (found.backrank.length < PER && Date.now() - started < MAX_MS) {
    tries++
    const fen = constructBackrank()
    if (!fen) continue
    const key = fen.split(' ').slice(0, 2).join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    const c = await examine(fen)
    if (c && c.theme === 'backrank') add(c, fen)
    if (tries % 100 === 0) {
      save()
      console.log(`costruite ${tries} posizioni, corridoio ${found.backrank.length}/${PER}`)
    }
  }
  save()
  console.log('FINE', status())
  sf.stop()
  process.exit(0)
}

const gameThemes = THEMES.filter((t) => t !== 'endgame')
let games = 0
while (gameThemes.length && !gameThemes.every((t) => found[t].length >= PER) && Date.now() - started < MAX_MS) {
  games++
  const fens = await weakGame()
  const perTheme = {}
  for (const fen of fens) {
    const key = fen.split(' ').slice(0, 2).join(' ')
    if (seen.has(key)) continue
    seen.add(key)
    const res = await sf.analyze(fen, 11, 3)
    if (res.length === 0) continue
    let c = null
    const best = res[0]
    const second = res[1]
    if (best.mate === 1 || best.mate === 2) {
      if (!(second && second.mate > 0 && second.mate <= 2)) {
        const need = 2 * best.mate - 1
        if (best.pv.length >= need) {
          const g = play(fen, best.pv.slice(0, need))
          const kind = g?.isCheckmate() ? matePattern(g) : null
          if (kind) c = { theme: kind === 'backrank' ? 'backrank' : 'matepat', kind, moves: best.pv.slice(0, need) }
        }
      }
    } else {
      c = classifyTactic(fen, best, second)
      if (!c && gameThemes.includes('defend')) c = await classifyDefend(fen, res)
    }
    if (!c || !gameThemes.includes(c.theme) || found[c.theme].length >= PER) continue
    if ((perTheme[c.theme] ?? 0) >= 1) continue
    perTheme[c.theme] = (perTheme[c.theme] ?? 0) + 1
    add(c, fen)
  }
  save()
  console.log(`partita ${games} (${Math.round((Date.now() - started) / 1000)}s) ${status()}`)
}
save()
console.log('FINE', status())
sf.stop()
