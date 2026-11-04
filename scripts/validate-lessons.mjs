// Controlla che tutte le lezioni abbiano FEN valide e mosse legali.
// Uso: node --experimental-strip-types scripts/validate-lessons.mjs
import { Chess } from 'chess.js'
import { LESSONS } from '../src/data/lessons.ts'

let errors = 0
const fail = (m) => {
  errors++
  console.log('ERRORE', m)
}

for (const lesson of LESSONS) {
  lesson.steps.forEach((s, i) => {
    const tag = `${lesson.id}#${i + 1}`
    let c
    try {
      c = new Chess(s.fen)
    } catch (e) {
      return fail(`${tag}: FEN non valida (${e.message})`)
    }
    if (s.kind === 'try') {
      const legal = c.moves({ verbose: true })
      const uci = (m) => m.from + m.to + (m.promotion ?? '')
      let good = 0
      for (const m of legal) {
        const ok =
          (s.accept && s.accept.some((a) => uci(m).startsWith(a))) ||
          (s.acceptFrom && m.from === s.acceptFrom) ||
          (s.mate && (() => { const t = new Chess(s.fen); t.move(m); return t.isCheckmate() })())
        if (ok) good++
      }
      if (good === 0) fail(`${tag}: nessuna mossa legale accettata`)
      if (s.mate) {
        const mates = legal.filter((m) => { const t = new Chess(s.fen); t.move(m); return t.isCheckmate() })
        console.log(`${tag}: matti possibili = ${mates.map(uci).join(',')}`)
      }
      if (s.accept) for (const a of s.accept) if (!legal.some((m) => uci(m).startsWith(a))) fail(`${tag}: ${a} non è legale`)
      if (s.hint) {
        const [f, t] = s.hint
        if (!legal.some((m) => m.from === f && m.to === t)) fail(`${tag}: hint ${f}${t} non legale`)
      }
    } else if (s.kind === 'line') {
      const t = new Chess(s.fen)
      for (const u of s.moves) {
        try {
          t.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] })
        } catch {
          fail(`${tag}: mossa ${u} illegale`)
          break
        }
      }
    }
  })
}
console.log(errors ? `${errors} errori` : 'Tutte le lezioni sono valide')
