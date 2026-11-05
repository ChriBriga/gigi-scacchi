// Controlla (e con --fix ripara) i puzzle di src/data/puzzles.json con Stockfish.
// Uso: node scripts/verify-puzzles.mjs [--depth 16] [--fix]
//
// Per ogni puzzle controlla che la FEN e la sequenza di mosse siano legali e che la soluzione sia davvero la migliore:
//  - matto in 1: elenco dei matti esatto; matto in 2: il motore trova davvero matto in 2 con quella prima mossa
//  - altri temi: la soluzione è la mossa del motore (o vale quasi quanto) e non c'è un matto forzato al suo posto
// Con --fix: toglie i puzzle sbagliati, toglie le coppie quasi identiche e salva in `alts` le altre mosse
// che valgono quasi quanto la migliore (l'app le accetta come risposte giuste).
import { readFileSync, writeFileSync } from 'node:fs'
import { Chess, pieceOverlap, play, score, startEngine, moveToUci } from './puzzle-lib.mjs'

const FILE = 'src/data/puzzles.json'
const FIX = process.argv.includes('--fix')
const depthArg = process.argv.indexOf('--depth')
const DEPTH = depthArg > 0 ? Number(process.argv[depthArg + 1]) : 16
/** una mossa "vale quanto la migliore" se perde meno di così (centipawn) */
const ALT_MARGIN = 80

const puzzles = JSON.parse(readFileSync(FILE, 'utf8'))
const sf = startEngine()

/** Controlla un puzzle: restituisce { problem?, alts? } */
export async function checkPuzzle(p, depth = DEPTH) {
  let g
  try {
    g = new Chess(p.fen)
  } catch {
    return { problem: 'FEN non valida' }
  }
  if (!play(p.fen, p.moves)) return { problem: 'sequenza di mosse illegale' }

  if (p.theme === 'mate1') {
    const mates = g
      .moves({ verbose: true })
      .filter((m) => {
        const c = new Chess(p.fen)
        c.move(m)
        return c.isCheckmate()
      })
      .map(moveToUci)
    if (!mates.includes(p.moves[0])) return { problem: 'la soluzione non dà matto' }
    if (JSON.stringify([...mates].sort()) !== JSON.stringify([...(p.mates ?? [])].sort())) return { problem: 'elenco dei matti diverso' }
    return {}
  }

  const res = await sf.analyze(p.fen, depth, 4)
  const best = res[0]
  if (!best) return { problem: 'nessuna analisi' }

  if (p.theme === 'mate2' || p.theme === 'backrank' || p.theme === 'matepat') {
    // matti: la linea salvata deve finire con matto e la prima mossa deve essere un matto forzato nel numero dichiarato
    const fin = play(p.fen, p.moves)
    if (!fin.isCheckmate()) return { problem: 'la linea salvata non finisce con matto' }
    const n = Math.ceil(p.moves.length / 2)
    const mine = res.find((l) => l.pv[0] === p.moves[0])
    if (!mine || mine.mate === undefined || mine.mate < 1 || mine.mate > n) return { problem: `la prima mossa non dà matto in ${n} (motore: ${mine ? (mine.mate ?? mine.cp) : 'mossa non fra le prime'})` }
    return {}
  }

  // temi di materiale / tattica / finali
  if (best.mate !== undefined && best.mate > 0 && p.theme !== 'endgame') return { problem: `c'è un matto forzato (M${best.mate}) al posto del tema ${p.theme}` }
  const mine = res.find((l) => l.pv[0] === p.moves[0])
  const bestScore = score(best)
  if (!mine || bestScore - score(mine) > ALT_MARGIN) {
    return { problem: `il motore preferisce ${best.pv[0]} (${best.cp ?? 'M' + best.mate}) alla soluzione ${p.moves[0]} (${mine ? (mine.cp ?? 'M' + mine.mate) : 'fuori dalle prime 4'})`, best }
  }
  if (p.theme !== 'defend' && (best.cp ?? 0) < 150 && p.theme !== 'endgame') return { problem: `vantaggio troppo basso (${best.cp}cp)` }
  const alts = res.filter((l) => l.pv[0] !== p.moves[0] && bestScore - score(l) <= ALT_MARGIN && score(l) >= score(mine) - ALT_MARGIN).map((l) => l.pv[0])
  return { alts }
}

async function main() {
  const bad = []
  const keep = []
  const dropped = new Set()

  // coppie quasi identiche (stessa partita): si tiene la prima
  const dupOf = new Map()
  for (let i = 0; i < puzzles.length; i++) {
    for (let j = 0; j < i; j++) {
      if (puzzles[i].theme === puzzles[j].theme && !dupOf.has(puzzles[j].id) && pieceOverlap(puzzles[i].fen, puzzles[j].fen) >= 0.8) {
        dupOf.set(puzzles[i].id, puzzles[j].id)
        break
      }
    }
  }

  for (const [i, p] of puzzles.entries()) {
    const r = await checkPuzzle(p)
    if (dupOf.has(p.id)) {
      dropped.add(p.id)
      bad.push({ id: p.id, why: `quasi identico a ${dupOf.get(p.id)}`, minor: true })
    } else if (r.problem) {
      bad.push({ id: p.id, why: r.problem })
      dropped.add(p.id)
    } else {
      const copy = { ...p }
      if (r.alts?.length) copy.alts = r.alts
      else delete copy.alts
      keep.push(copy)
    }
    if ((i + 1) % 50 === 0) console.log(`... ${i + 1}/${puzzles.length}`)
  }

  const serious = bad.filter((b) => !b.minor)
  console.log(`Puzzle: ${puzzles.length} · sbagliati: ${serious.length} · doppioni: ${bad.length - serious.length} · con mosse equivalenti: ${keep.filter((k) => k.alts).length}`)
  for (const b of bad) console.log(' ', b.id, '|', b.why)
  if (FIX) {
    writeFileSync(FILE, JSON.stringify(keep))
    console.log(`Scritti ${keep.length} puzzle in ${FILE}`)
  } else console.log('(nessuna modifica: usa --fix per applicarle)')
  sf.stop()
}

// si esegue solo se lanciato direttamente (così merge-puzzles può importare checkPuzzle)
if (process.argv[1] && process.argv[1].replaceAll('\\', '/').endsWith('verify-puzzles.mjs')) {
  await main()
}
export { sf as verifyEngine }
