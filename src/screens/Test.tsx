import { useState } from 'react'
import type { Color } from 'chess.js'
import { Checkerboard } from '@phosphor-icons/react'
import { PUZZLES, PuzzleRunner, THEME_INFO, type Puzzle, type PuzzleResult } from './Puzzles'
import { CoachBubble } from '../components/CoachBubble'
import { BotAvatar } from '../components/BotAvatar'
import { botByRank, recommendedBot, type Bot } from '../engine/bots'
import { update } from '../store'

/** Test iniziale: 5 puzzle a difficoltà crescente per stimare il livello di partenza. */
const PLAN = [1, 1, 2, 2, 3]

/** il test usa solo i temi di base: i temi nuovi (inchiodatura, finali…) sono per dopo */
const BASE_THEMES: Puzzle['theme'][] = ['mate1', 'mate2', 'free', 'fork', 'tactic']
const BASE = PUZZLES.filter((p) => BASE_THEMES.includes(p.theme))

function pickByDifficulty(d: number, used: string[]): Puzzle | null {
  const pool = BASE.filter((p) => THEME_INFO[p.theme].difficulty === d && !used.includes(p.id))
  const any = pool.length ? pool : BASE.filter((p) => !used.includes(p.id))
  return any.length ? any[Math.floor(Math.random() * any.length)] : null
}

export function PlacementTest({ onExit, startGame }: { onExit: () => void; startGame: (b: Bot, c: Color) => void }) {
  const [result, setResult] = useState<{ score: number; bot: Bot } | null>(null)

  const finish = (res: PuzzleResult[]) => {
    const score = res.filter((r) => r.firstTry).length
    // 5 puzzle facili misurano l'occhio tattico, non la forza di gioco: si parte da un livello prudente
    const skill = 6 + score * 9
    update((s) => {
      s.progress.placementDone = true
      s.progress.skill = skill
      s.progress.xp += 30
    })
    // la partita di prova non deve mai essere contro un avversario troppo forte
    const rec = recommendedBot(skill)
    const bot = rec.rank > 6 ? botByRank(6) : rec
    setResult({ score, bot })
  }

  if (result) {
    const text =
      result.score <= 1
        ? 'Partiamo dalle basi, pivello. Niente paura: si impara in fretta.'
        : result.score <= 3
          ? 'Non male! Hai già un po’ d’occhio. Ti metto un livello adatto.'
          : 'Ma allora sai qualcosa! Parti già da un buon livello.'
    return (
      <div className="screen" style={{ maxWidth: 640 }}>
        <h2>Test completato</h2>
        <div className="hero">
          <CoachBubble text={`${text} Hai risolto ${result.score}/${PLAN.length} al primo colpo.`} mood={result.score >= 3 ? 'happy' : 'cool'} size={96} />
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <BotAvatar id={result.bot.id} size={60} />
          <p className="muted" style={{ margin: 0 }}>
            Ora una partita di prova contro <b style={{ color: 'var(--ink)' }}>{result.bot.name}</b>, giusto per rodare.
          </p>
        </div>
        <button className="btn primary big" onClick={() => startGame(result.bot, 'w')}>
          <Checkerboard size={24} weight="fill" /> Gioca contro {result.bot.name}
        </button>
        <button className="btn big" onClick={onExit}>
          Più tardi
        </button>
      </div>
    )
  }

  return (
    <PuzzleRunner
      title="Test iniziale"
      total={PLAN.length}
      next={(i, res) => pickByDifficulty(PLAN[i], res.map((r) => r.id))}
      onFinish={finish}
      onExit={onExit}
    />
  )
}
