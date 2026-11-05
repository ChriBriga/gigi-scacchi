import { PuzzleRunner, pickPuzzle } from './Puzzles'
import { getState } from '../store'

/** I 5 puzzle del giorno: sta in un file a parte così l'elenco dei puzzle si carica solo quando serve. */
export function DailyPuzzles({ onClose }: { onClose: () => void }) {
  return (
    <PuzzleRunner
      total={5}
      title="Puzzle del giorno"
      next={(_, res) => pickPuzzle(getState().progress, res.map((r) => r.id))}
      onFinish={onClose}
      onExit={onClose}
    />
  )
}
