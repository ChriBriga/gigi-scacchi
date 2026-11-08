// Unisce i candidati creati da gen-themes.mjs ai puzzle esistenti, dopo un controllo più profondo con Stockfish.
// Uso: node scripts/merge-puzzles.mjs [--write] [--depth 18] scripts/.shard1.json scripts/.shard2.json ...
// Senza --write mostra solo cosa farebbe. Scarta: posizioni già presenti, quasi identiche a un'altra,
// con soluzione non confermata o con troppe alternative equivalenti (nei puzzle di difesa).
import { readFileSync, writeFileSync } from 'node:fs'
import { pieceOverlap } from './puzzle-lib.mjs'
import { checkPuzzle, verifyEngine } from './verify-puzzles.mjs'

const args = process.argv.slice(2)
const WRITE = args.includes('--write')
const di = args.indexOf('--depth')
const DEPTH = di >= 0 ? Number(args[di + 1]) : 18
const files = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--depth')
/** quanti puzzle al massimo per tema nuovo */
const CAP = { backrank: 25, matepat: 20, pin: 25, skewer: 15, discover: 20, defend: 30, endgame: 25 + 48 }
/** nei finali: al massimo così tanti per tipo (kp, kpd, race, rook, rookd, rookp), per avere varietà */
const KIND_CAP = 10
const kindTaken = {}

const FILE = 'src/data/puzzles.json'
const all = JSON.parse(readFileSync(FILE, 'utf8'))
const key = (f) => f.split(' ').slice(0, 2).join(' ')
const have = new Set(all.map((p) => key(p.fen)))

let cands = files.flatMap((f) => JSON.parse(readFileSync(f, 'utf8')))
// mescola, così nessun shard prevale
cands = cands.sort(() => Math.random() - 0.5)
console.log(`Candidati: ${cands.length}`)

const taken = Object.fromEntries(Object.keys(CAP).map((t) => [t, 0]))
const lastNum = (t) => Math.max(0, ...all.filter((p) => p.theme === t).map((p) => Number(p.id.split('-')[1])))
const next = Object.fromEntries(Object.keys(CAP).map((t) => [t, lastNum(t)]))
const added = []
const why = {}

for (const c of cands) {
  if (!(c.theme in CAP) || taken[c.theme] >= CAP[c.theme]) continue
  if (c.theme === 'endgame' && c.kind && (kindTaken[c.kind] ?? 0) >= KIND_CAP) continue
  if (have.has(key(c.fen))) {
    why.presente = (why.presente ?? 0) + 1
    continue
  }
  if ([...all, ...added].some((p) => pieceOverlap(p.fen, c.fen) >= 0.8)) {
    why.simile = (why.simile ?? 0) + 1
    continue
  }
  const r = await checkPuzzle(c, DEPTH)
  if (r.problem) {
    why[`non confermato (${c.theme})`] = (why[`non confermato (${c.theme})`] ?? 0) + 1
    continue
  }
  if (c.theme === 'defend' && (r.alts?.length ?? 0) > 2) {
    why['troppe alternative'] = (why['troppe alternative'] ?? 0) + 1
    continue
  }
  const p = { id: `${c.theme}-${++next[c.theme]}`, fen: c.fen, theme: c.theme, moves: c.moves }
  if (c.kind) p.kind = c.kind
  if (c.threat) p.threat = c.threat
  if (r.alts?.length) p.alts = r.alts
  added.push(p)
  have.add(key(c.fen))
  taken[c.theme]++
  if (c.theme === 'endgame' && c.kind) kindTaken[c.kind] = (kindTaken[c.kind] ?? 0) + 1
}

console.log('Aggiunti:', JSON.stringify(taken))
console.log('Scartati:', JSON.stringify(why))
if (WRITE) {
  writeFileSync(FILE, JSON.stringify([...all, ...added]))
  console.log(`Scritti ${all.length + added.length} puzzle in ${FILE}`)
} else console.log('(nessuna modifica: usa --write per salvare)')
verifyEngine.stop()
process.exit(0)
