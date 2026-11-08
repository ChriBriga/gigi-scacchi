import { useEffect, useState } from 'react'
import type { Color } from 'chess.js'
import { evaluate, winPct } from '../engine/analysis'

/** Barra di valutazione: quanto sta meglio il bianco (parte chiara) o il nero (parte scura). Facoltativa, si spegne dalle impostazioni. */
export function EvalBar({ fen, orientation }: { fen: string; orientation: Color }) {
  const [cpWhite, setCpWhite] = useState<{ cp: number; mate?: number } | null>(null)

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      evaluate(fen)
        .then((e) => {
          if (!alive) return
          const sign = fen.split(' ')[1] === 'w' ? 1 : -1
          setCpWhite({ cp: e.cp * sign, mate: e.mate !== undefined ? e.mate * sign : undefined })
        })
        .catch(() => undefined)
    }, 250)
    return () => {
      alive = false
      clearTimeout(t)
    }
  }, [fen])

  const white = cpWhite ? winPct(cpWhite.cp) : 50
  const label = !cpWhite
    ? ''
    : cpWhite.mate !== undefined
      ? `M${Math.abs(cpWhite.mate)}`
      : (Math.abs(cpWhite.cp) / 100).toFixed(1)
  const whiteAhead = (cpWhite?.cp ?? 0) >= 0
  // a chi gioca il bianco la parte chiara sta in basso, a chi gioca il nero in alto
  const flip = orientation === 'b'
  return (
    <div className={`eval-bar${flip ? ' flip' : ''}`} title="Chi sta meglio (valutazione del motore)" aria-hidden>
      <div className="eval-white" style={{ height: `${white}%` }} />
      {label && <span className={`eval-num ${whiteAhead ? 'at-white' : 'at-black'}`}>{label}</span>}
    </div>
  )
}
