import { useState } from 'react'
import type { Color } from 'chess.js'
import { Check, Crown, Handshake, Medal, Shuffle, Star, StarHalf, type Icon } from '@phosphor-icons/react'
import { DRILLS, type Drill, type DrillGoal } from '../data/drills'
import { BOTS, recommendedBot, starsOf, type Bot } from '../engine/bots'
import { STYLES } from '../engine/style'
import { BotAvatar } from '../components/BotAvatar'
import { useApp } from '../store'

function Dot({ light }: { light: boolean }) {
  return <span style={{ width: 14, height: 14, borderRadius: '50%', background: light ? '#fff' : '#1b1033', border: '2px solid #888', display: 'inline-block' }} />
}

const GOAL_ICON: Record<DrillGoal, Icon> = { mate: Crown, promote: Medal, draw: Handshake }
const LEVEL_NAME = { 1: 'Matti base', 2: 'Vantaggio e pedoni', 3: 'Per veri finalisti' } as const

/** L'elenco dei finali contro il bot, con quelli già superati e il tuo record. */
function DrillList({ onDrill }: { onDrill: (d: Drill) => void }) {
  const { progress } = useApp()
  const done = progress.drills ?? {}
  return (
    <div className="drill-list">
      <p className="sub" style={{ margin: 0 }}>
        Mini-partite da 2-5 minuti: parti da una posizione fissa e devi raggiungere l’obiettivo. Puoi annullare le mosse e chiedere aiuto.
      </p>
      {([1, 2, 3] as const).map((lvl) => (
        <div key={lvl} style={{ display: 'contents' }}>
          <div className="drill-level">{LEVEL_NAME[lvl]}</div>
          {DRILLS.filter((d) => d.level === lvl).map((d) => {
            const I = GOAL_ICON[d.goal]
            const best = done[d.id]
            return (
              <button key={d.id} className={`drill-card${best ? ' done' : ''}`} onClick={() => onDrill(d)}>
                <span className={`tile${best ? ' done' : ''}`}>{best ? <Check size={26} weight="bold" /> : <I size={26} weight="duotone" />}</span>
                <span className="drill-info">
                  <strong>{d.title}</strong>
                  <small>{d.blurb}</small>
                </span>
                {best ? <span className="badge-pill ok">record {best}</span> : null}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

export function PlaySetup({
  onStart,
  onDrill,
  mode,
  onMode,
  suggested,
}: {
  onStart: (bot: Bot, color: Color) => void
  onDrill: (d: Drill) => void
  mode: 'games' | 'drills'
  onMode: (m: 'games' | 'drills') => void
  suggested?: number
}) {
  const app = useApp()
  const [colorPick, setColorPick] = useState<'w' | 'b' | 'r'>('w')
  const skill = app.progress.skill
  const rec = suggested ?? recommendedBot(skill).id
  const beaten = app.progress.botsBeaten

  return (
    <div className="screen">
      <div className="seg" style={{ maxWidth: 460 }}>
        <button className={mode === 'games' ? 'on' : ''} onClick={() => onMode('games')}>
          Partite
        </button>
        <button className={mode === 'drills' ? 'on' : ''} onClick={() => onMode('drills')}>
          Finali ({Object.keys(app.progress.drills ?? {}).length}/{DRILLS.length})
        </button>
      </div>
      {mode === 'drills' ? (
        <DrillList onDrill={onDrill} />
      ) : (
        <>
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
              {b.style !== 'balanced' && (
                <span className="style-pill" title={`${STYLES[b.style].blurb} ${STYLES[b.style].tip}`}>
                  Stile {STYLES[b.style].label.toLowerCase()}
                </span>
              )}
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
        </>
      )}
    </div>
  )
}
