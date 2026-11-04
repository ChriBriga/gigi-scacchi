import { useState } from 'react'
import type { Color } from 'chess.js'
import { PUZZLES, PuzzleRunner, THEME_INFO, type Puzzle, type PuzzleResult } from './Puzzles'
import { CoachBubble } from '../components/CoachBubble'
import { BOTS, type Bot } from '../engine/bots'
import { update } from '../store'

/** Test iniziale: 5 puzzle a difficoltà crescente per stimare il livello di partenza. */
const PLAN = [1, 1, 2, 2, 3]

function pickByDifficulty(d: number, used: string[]): Puzzle | null {
  const pool = PUZZLES.filter((p) => THEME_INFO[p.theme].difficulty === d && !used.includes(p.id))
  const any = pool.length ? pool : PUZZLES.filter((p) => !used.includes(p.id))
  return any.length ? any[Math.floor(Math.random() * any.length)] : null
}

export function PlacementTest({ onExit, startGame }: { onExit: () => void; startGame: (b: Bot, c: Color) => void }) {
  const [result, setResult] = useState<{ score: number; bot: Bot } | null>(null)

  const finish = (res: PuzzleResult[]) => {
    const score = res.filter((r) => r.firstTry).length
    const skill = Math.min(70, 4 + score * 13)
    update((s) => {
      s.progress.placementDone = true
      s.progress.skill = skill
      s.progress.xp += 30
    })
    const bot = BOTS[Math.max(0, Math.min(7, Math.round(skill / 12)))]
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
      <div className="screen">
        <h2>Test completato</h2>
        <CoachBubble text={`${text} Hai risolto ${result.score}/${PLAN.length} al primo colpo.`} mood={result.score >= 3 ? 'happy' : 'cool'} />
        <p className="muted">Ora una partita di prova contro {result.bot.name} {result.bot.emoji}, giusto per rodare.</p>
        <button className="btn primary big" onClick={() => startGame(result.bot, 'w')}>♟️ Gioca contro {result.bot.name}</button>
        <button className="btn big" onClick={onExit}>Più tardi</button>
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
