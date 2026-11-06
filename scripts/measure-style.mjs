// Misura lo "stile" dei bot (src/engine/style.ts) su posizioni vere: quanto cambiano le scelte rispetto a un bot senza stile
// e quanto costano in qualità. Uso: node --experimental-strip-types scripts/measure-style.mjs [posizioni] [profondità]
import { Chess, score, startEngine, moveToUci } from './puzzle-lib.mjs'
import { candidateWeights, moveFeatures, pickIndex } from '../src/engine/style.ts'

const N = Number(process.argv[2] ?? 40)
const DEPTH = Number(process.argv[3] ?? 8)
const DRAWS = 300
const STYLES = ['balanced', 'aggressive', 'positional', 'tactical', 'solid']
const TEMPS = [{ name: 'forte (temp 20)', temp: 20 }, { name: 'medio (temp 80)', temp: 80 }, { name: 'debole (temp 170)', temp: 170 }]

const sf = startEngine()

// posizioni: partite giocate da Stockfish con un po' di casualità fra le sue prime 3 scelte, fermate a una mossa casuale fra 4 e 24
async function makePositions() {
  const out = []
  while (out.length < N) {
    const g = new Chess()
    const stop = 4 + Math.floor(Math.random() * 20)
    for (let i = 0; i < stop && !g.isGameOver(); i++) {
      const lines = await sf.analyze(g.fen(), 4, 3)
      const pick = lines[Math.min(lines.length - 1, Math.floor(Math.random() * Math.min(3, lines.length)))]
      g.move({ from: pick.pv[0].slice(0, 2), to: pick.pv[0].slice(2, 4), promotion: pick.pv[0][4] })
    }
    if (!g.isGameOver()) out.push(g.fen())
  }
  return out
}

const positions = await makePositions()
const analysed = []
for (const fen of positions) {
  const lines = (await sf.analyze(fen, DEPTH, 6)).filter((l) => l.pv?.length)
  if (lines.length >= 2) analysed.push({ fen, cands: lines.map((l) => ({ cp: score(l), move: l.pv[0] })) })
}
sf.stop()
console.log(`${analysed.length} posizioni analizzate a profondità ${DEPTH}\n`)

const pct = (x) => (100 * x).toFixed(0).padStart(3) + '%'
for (const t of TEMPS) {
  console.log(`== Bot ${t.name} ==`)
  console.log('stile        scacco  cattura  arrocco  sviluppo  centro  scambio  minacce  forchetta  perdita media (cp)  scelta peggiore (cp)')
  for (const style of STYLES) {
    const cond = { check: [0, 0], castle: [0, 0], develop: [0, 0], fork: [0, 0] }
    const acc = { check: 0, capture: 0, castle: 0, develop: 0, centre: 0, trade: 0, threats: 0, fork: 0, loss: 0, worst: 0, n: 0 }
    for (const { fen, cands } of analysed) {
      const feats = cands.map((c) => moveFeatures(fen, c.move))
      const w = candidateWeights(fen, cands, { temp: t.temp, style })
      const best = Math.max(...cands.map((c) => c.cp))
      const avail = (k) => feats.some((f, j) => f && f[k] && cands[j].cp >= best - 60)
      const has = Object.fromEntries(['check', 'castle', 'develop', 'fork'].map((k) => [k, avail(k)]))
      for (let k = 0; k < DRAWS; k++) {
        const i = pickIndex(w)
        const f = feats[i]
        if (!f) continue
        acc.n++
        acc.check += f.check
        acc.capture += f.capture
        acc.castle += f.castle
        acc.develop += f.develop
        acc.centre += f.centre > 0
        acc.trade += f.trade
        acc.threats += f.newThreats
        acc.fork += f.fork
        for (const k of Object.keys(cond)) if (has[k]) { cond[k][1]++; if (f[k]) cond[k][0]++ }
        const loss = best - cands[i].cp
        acc.loss += loss
        acc.worst = Math.max(acc.worst, loss)
      }
    }
    const n = acc.n
    const c = (k) => (cond[k][1] ? pct(cond[k][0] / cond[k][1]) : '  - ')
    console.log(
      `${style.padEnd(11)}  ${pct(acc.check / n)}   ${pct(acc.capture / n)}    ${pct(acc.castle / n)}     ${pct(acc.develop / n)}    ${pct(acc.centre / n)}    ${pct(acc.trade / n)}    ${(acc.threats / n).toFixed(2).padStart(5)}    ${pct(acc.fork / n)}       ${(acc.loss / n).toFixed(1).padStart(6)}             ${String(acc.worst).padStart(5)}   [se disponibile: scacco ${c('check')} arrocco ${c('castle')} sviluppo ${c('develop')} forchetta ${c('fork')}]`,
    )
  }
  console.log()
}
