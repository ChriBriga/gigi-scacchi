// Crea i set di pezzi alternativi ricolorando le stesse sagome (public/pieces/*.svg = set "classico").
// Uso: node scripts/build-pieces.mjs   ->   scrive public/pieces/<set>/<pezzo>.svg
// Le sagome sono quelle del set di base: cambiano solo i colori, quindi niente nuove licenze da rispettare.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

const SETS = {
  caramella: { w: { body: '#ffd1ea', line: '#7a2a5a' }, b: { body: '#5fd6bd', line: '#1d5a4b', detail: '#d9fff5' } },
  oro: { w: { body: '#ffe58f', line: '#6b4a05' }, b: { body: '#3a2a1a', line: '#120a03', detail: '#e0b85c' } },
  ghiaccio: { w: { body: '#d6f1ff', line: '#1d4e7a' }, b: { body: '#ff7a45', line: '#5a1a08', detail: '#ffd9bd' } },
  neon: { w: { body: '#f2fffc', line: '#00a38c' }, b: { body: '#241660', line: '#ff4de0', detail: '#ff9af0' } },
  legno: { w: { body: '#f3d9a8', line: '#5a3a14' }, b: { body: '#8a5a2b', line: '#2d1b08', detail: '#d9b27a' } },
}

const PIECES = ['K', 'Q', 'R', 'B', 'N', 'P']
const src = (name) => readFileSync(`public/pieces/${name}.svg`, 'utf8')

for (const [set, pal] of Object.entries(SETS)) {
  mkdirSync(`public/pieces/${set}`, { recursive: true })
  for (const color of ['w', 'b']) {
    const c = pal[color]
    for (const p of PIECES) {
      let svg = src(`${color}${p}`)
      if (color === 'w') {
        svg = svg.replaceAll('fill="#fff"', `fill="${c.body}"`).replaceAll('stroke="#000"', `stroke="${c.line}"`).replaceAll('fill="#000"', `fill="${c.line}"`)
      } else {
        svg = svg
          .replaceAll('fill="#000"', `fill="${c.body}"`)
          .replaceAll('stroke="#000"', `stroke="${c.line}"`)
          .replaceAll('#ececec', c.detail)
          // le sagome nere si affidano al riempimento nero di default: lo si imposta sul contenitore
          .replace('<svg ', `<svg fill="${c.body}" `)
      }
      writeFileSync(`public/pieces/${set}/${color}${p}.svg`, svg)
    }
  }
}
console.log('Set creati:', Object.keys(SETS).join(', '))
