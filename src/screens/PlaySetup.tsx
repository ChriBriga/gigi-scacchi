import { useState } from 'react'
import type { Color } from 'chess.js'
import { Check, Crown, Handshake, Medal, Play, Shuffle, Star, StarHalf, type Icon } from '@phosphor-icons/react'
import { DRILLS, type Drill, type DrillGoal } from '../data/drills'
import { BOTS, recommendedBot, starsOf, type Bot } from '../engine/bots'
import { STYLES } from '../engine/style'
import { BotAvatar } from '../components/BotAvatar'
import { GAME_MODES, gameModeInfo, medalOf, update, useApp } from '../store'

function Dot({ light }: { light: boolean }) {
  return <span style={{ width: 14, height: 14, borderRadius: '50%', background: light ? '#fff' : '#1b1033', border: '2px solid #888', display: 'inline-block' }} />
}

function Stars({ bot, size }: { bot: Bot; size: number }) {
  return (
    <span className="stars" title={`${starsOf(bot)} stelle`}>
      {Array.from({ length: Math.floor(starsOf(bot)) }, (_, i) => (
        <Star key={i} size={size} weight="fill" />
      ))}
      {starsOf(bot) % 1 !== 0 && <StarHalf size={size} weight="fill" />}
    </span>
  )
}

function StylePill({ bot }: { bot: Bot }) {
  if (bot.style === 'balanced') return null
  return (
    <span className="style-pill" title={`${STYLES[bot.style].blurb} ${STYLES[bot.style].tip}`}>
      Stile {STYLES[bot.style].label.toLowerCase()}
    </span>
  )
}

const MEDAL_NAME = ['', 'bronzo', 'argento', 'oro']
const MEDAL_HOW = ['', 'Allenamento', 'Senza rete', 'Torneo']

/** La medaglia migliore contro un bot: bronzo in Allenamento, argento Senza rete, oro in Torneo. */
function MedalBadge({ level }: { level: number }) {
  if (level < 1) return null
  return (
    <span className={`badge-pill medal m${level}`} title={`Battuto in ${MEDAL_HOW[level]}`}>
      <Medal size={13} weight="fill" /> {MEDAL_NAME[level]}
    </span>
  )
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
  const gameMode = gameModeInfo(app.settings.gameMode ?? 'training')
  const recBot = BOTS.find((b) => b.id === rec) ?? recommendedBot(skill)
  const start = (b: Bot) => onStart(b, colorPick === 'r' ? (Math.random() < 0.5 ? 'w' : 'b') : colorPick)

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
      <div className="rec-card">
        <span className="rec-label">Consigliato per te</span>
        <div className="rec-main">
          <BotAvatar id={recBot.id} size={88} />
          <span className="rec-info">
            <strong>{recBot.name}</strong>
            <Stars bot={recBot} size={16} />
            <small>{recBot.tagline}</small>
            <StylePill bot={recBot} />
          </span>
        </div>
        <div className="seg rec-seg">
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
        <div className="mode-pick">
          <div className="seg">
            {GAME_MODES.map((m) => (
              <button
                key={m.id}
                className={gameMode.id === m.id ? 'on' : ''}
                onClick={() =>
                  update((s) => {
                    s.settings.gameMode = m.id
                  })
                }
              >
                {m.name}
              </button>
            ))}
          </div>
          <small className="mode-blurb">
            {gameMode.blurb} Se vinci: medaglia d’{gameMode.medalName}.
          </small>
        </div>
        <button className="btn primary big rec-play" onClick={() => start(recBot)}>
          <Play size={22} weight="fill" /> Gioca
        </button>
      </div>
      <h3 className="ladder-title">Tutti gli avversari</h3>
      <div className="ladder">
        {BOTS.map((b) => (
          <button key={b.id} className={`ladder-row${b.id === rec ? ' rec' : ''}`} onClick={() => start(b)}>
            <span className="ladder-rank">{b.rank}</span>
            <BotAvatar id={b.id} size={40} />
            <span className="ladder-name">
              <strong>{b.name}</strong>
              <small>{b.tagline}</small>
            </span>
            <StylePill bot={b} />
            <Stars bot={b} size={13} />
            <span className="ladder-state">
              <MedalBadge level={medalOf(app.progress, b.id)} />
              {b.id === rec && <span className="badge-pill tip">consigliato</span>}
            </span>
          </button>
        ))}
      </div>
        </>
      )}
    </div>
  )
}
