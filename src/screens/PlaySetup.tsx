import { useState } from 'react'
import type { Color } from 'chess.js'
import { BOTS, type Bot } from '../engine/bots'
import { useApp } from '../store'

export function PlaySetup({ onStart, suggested }: { onStart: (bot: Bot, color: Color) => void; suggested?: number }) {
  const app = useApp()
  const [colorPick, setColorPick] = useState<'w' | 'b' | 'r'>('w')
  const skill = app.progress.skill
  const rec = suggested ?? Math.max(1, Math.min(8, Math.round(skill / 12) + 1))
  const beaten = app.progress.botsBeaten

  return (
    <div className="screen">
      <h2>Scegli l’avversario</h2>
      <div className="seg">
        {(['w', 'b', 'r'] as const).map((c) => (
          <button key={c} className={colorPick === c ? 'on' : ''} onClick={() => setColorPick(c)}>
            {c === 'w' ? '⚪ Bianco' : c === 'b' ? '⚫ Nero' : '🎲 Casuale'}
          </button>
        ))}
      </div>
      <div className="bots">
        {BOTS.map((b) => (
          <button
            key={b.id}
            className={`bot-card${b.id === rec ? ' rec' : ''}`}
            onClick={() => onStart(b, colorPick === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : colorPick)}
          >
            <span className="bot-emoji">{b.emoji}</span>
            <span className="bot-info">
              <strong>{b.name}</strong>
              <small>{b.tagline}</small>
            </span>
            <span className="bot-meta">
              {'⭐'.repeat(Math.ceil(b.id / 2))}
              {beaten.includes(b.id) && <span className="beaten">✔ battuto</span>}
              {b.id === rec && !beaten.includes(b.id) && <span className="tip">consigliato</span>}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
