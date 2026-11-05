// Controlla con Stockfish i finali di src/data/drills.ts: FEN valida e obiettivo davvero raggiungibile.
// Uso: node --experimental-strip-types scripts/check-drills.mjs
//  - mate / promote: chi muove deve essere in netto vantaggio (+300 o matto forzato)
//  - draw: la posizione è patta (valutazione vicina a 0) per chi difende
import { Chess, score, startEngine } from './puzzle-lib.mjs'
import { DRILLS } from '../src/data/drills.ts'

const sf = startEngine()
let errors = 0
const fail = (id, m) => {
  errors++
  console.log('ERRORE', id, m)
}

for (const d of DRILLS) {
  let g
  try {
    g = new Chess(d.fen)
  } catch (e) {
    fail(d.id, `FEN non valida (${e.message})`)
    continue
  }
  if (g.isGameOver()) {
    fail(d.id, 'la partita è già finita')
    continue
  }
  const res = await sf.analyze(d.fen, 20, 1)
  const s = score(res[0])
  const text = res[0].mate !== undefined ? `matto in ${res[0].mate}` : `${s}cp`
  if (d.goal === 'draw') {
    if (Math.abs(s) > 80) fail(d.id, `doveva essere patta, il motore dice ${text}`)
  } else if (s < 300) fail(d.id, `doveva essere vinta, il motore dice ${text}`)
  console.log(d.id.padEnd(24), d.goal.padEnd(8), text)
}
console.log(errors ? `${errors} problemi` : `Tutti i ${DRILLS.length} finali sono validi`)
sf.stop()
process.exit(errors ? 1 : 0)
