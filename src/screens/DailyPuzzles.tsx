import { PuzzleRunner, pickPuzzle, type Puzzle } from './Puzzles'
import { getState } from '../store'

/** I 5 puzzle del giorno: sta in un file a parte così l'elenco dei puzzle si carica solo quando serve. */
export function DailyPuzzles({ onClose, themes, title }: { onClose: () => void; themes?: Puzzle['theme'][]; title?: string }) {
  return (
    <PuzzleRunner
      total={5}
      title={title ?? "Puzzle del giorno"}
      next={(_, res) => pickPuzzle(getState().progress, res.map((r) => r.id), themes)}
      onFinish={onClose}
      onExit={onClose}
    />
  )
}
