import { useMemo } from 'react'
import { ArrowLeft, Notebook as NotebookIcon } from '@phosphor-icons/react'
import { CoachBubble } from '../components/CoachBubble'
import { GameReview, type ReviewItem } from '../components/GameReview'
import { dueNotebook, getState, notebookId, resolveNotebook, useApp, type NotebookItem } from '../store'

/** Un errore del quaderno, nel formato che sa mostrare la revisione. */
export function toReviewItem(n: NotebookItem): ReviewItem {
  return {
    moveNo: 0,
    san: n.playedSan,
    uci: n.played,
    fenBefore: n.fen,
    color: n.color,
    tag: n.tag,
    judgement: {
      quality: n.j.quality,
      loss: n.j.loss,
      bestUci: n.best,
      playedUci: n.played,
      cpAfter: n.j.cpAfter,
      bestWasPlayed: false,
      swing: n.j.loss,
      missedMate: n.j.missedMate,
    },
  }
}

/** Ripasso degli errori che sono "scaduti": al massimo 5 alla volta, uno per posizione. */
export function NotebookSession({ onExit }: { onExit: () => void }) {
  const { settings, progress } = useApp()
  // gli errori da ripassare si fissano all'apertura: mentre li risolvi la lista non deve cambiare sotto i piedi
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const items = useMemo(() => dueNotebook(getState().progress).slice(0, 5).map(toReviewItem), [])

  if (items.length === 0) {
    const total = progress.notebook?.length ?? 0
    return (
      <div className="screen">
        <div className="topbar">
          <button className="ghost" onClick={onExit}>
            <ArrowLeft size={20} weight="bold" /> Esci
          </button>
          <div className="title">
            <NotebookIcon size={24} weight="duotone" /> Quaderno degli errori
          </div>
        </div>
        <div className="hero">
          <CoachBubble
            text={total ? 'Per oggi niente da ripassare. Gli errori sul quaderno tornano quando è il momento giusto.' : 'Il quaderno è vuoto. Gioca una partita: gli errori che contano finiscono qui.'}
            mood="cool"
            size={96}
          />
        </div>
        <button className="btn primary big" onClick={onExit}>
          Va bene
        </button>
      </div>
    )
  }

  return (
    <GameReview
      items={items}
      color="w"
      tone={settings.tone}
      geminiKey={settings.geminiKey}
      mode="notebook"
      onClose={onExit}
      onResolved={(it, ok) => resolveNotebook(notebookId(it.fenBefore), ok)}
    />
  )
}
