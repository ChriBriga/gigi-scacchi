import { useState } from 'react'
import type { Color } from 'chess.js'
import { Check, Shuffle, Star, StarHalf } from '@phosphor-icons/react'
import { BOTS, recommendedBot, starsOf, type Bot } from '../engine/bots'
import { BotAvatar } from '../components/BotAvatar'
import { useApp } from '../store'

function Dot({ light }: { light: boolean }) {
  return <span style={{ width: 14, height: 14, borderRadius: '50%', background: light ? '#fff' : '#1b1033', border: '2px solid #888', display: 'inline-block' }} />
}

export function PlaySetup({ onStart, suggested }: { onStart: (bot: Bot, color: Color) => void; suggested?: number }) {
  const app = useApp()
  const [colorPick, setColorPick] = useState<'w' | 'b' | 'r'>('w')
  const skill = app.progress.skill
  const rec = suggested ?? recommendedBot(skill).id
  const beaten = app.progress.botsBeaten

  return (
    <div className="screen">
      <h2>Scegli l’avversario</h2>
      <p className="sub">Parti da quello consigliato e sali di livello man mano che li batti.</p>
      <div className="seg" style={{ maxWidth: 460 }}>
        <button className={colorPick === 'w' ? 'on' : ''} onClick={() => setColorPick('w')}>
          <Dot light /> Bianco
        </button>
        <button className={colorPick === 'b' ? 'on' : ''} onClick={() => setColorPick('b')}>
          <Dot light={false} /> Nero
        </button>
        <button className={colorPick === 'r' ? 'on' : ''} onClick={() => setColorPick('r')}>
          <Shuffle size={18} weight="bold" /> Casuale
        </button>
      </div>
      <div className="bots">
        {BOTS.map((b) => (
          <button
            key={b.id}
            className={`bot-card${b.id === rec ? ' rec' : ''}`}
            onClick={() => onStart(b, colorPick === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : colorPick)}
          >
            <BotAvatar id={b.id} size={58} />
            <span className="bot-info">
              <strong>{b.name}</strong>
              <small>{b.tagline}</small>
            </span>
            <span className="bot-meta">
              <span className="stars" title={`${starsOf(b)} stelle`}>
                {Array.from({ length: Math.floor(starsOf(b)) }, (_, i) => (
                  <Star key={i} size={13} weight="fill" />
                ))}
                {starsOf(b) % 1 !== 0 && <StarHalf size={13} weight="fill" />}
              </span>
              {beaten.includes(b.id) ? (
                <span className="badge-pill ok">
                  <Check size={12} weight="bold" /> battuto
                </span>
              ) : b.id === rec ? (
                <span className="badge-pill tip">consigliato</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
