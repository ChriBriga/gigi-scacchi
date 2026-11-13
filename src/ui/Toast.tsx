import { useSyncExternalStore } from 'react'

/** Avvisi brevi in basso: compaiono, restano qualche secondo e spariscono da soli (o con un tocco). */
export interface ToastItem {
  id: number
  text: string
  kind: 'info' | 'ok' | 'bad'
  /** tasto opzionale dentro l'avviso */
  action?: { label: string; onClick: () => void }
  /** resta finché non lo tocchi (durata 0) */
  sticky?: boolean
}

let items: ToastItem[] = []
let nextId = 1
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function dismissToast(id: number) {
  items = items.filter((t) => t.id !== id)
  emit()
}

/** Mostra un avviso. Lo stesso testo non si accumula: sostituisce quello già visibile. */
export function toast(text: string, kind: ToastItem['kind'] = 'info', ms = 3200, action?: ToastItem['action']) {
  const id = nextId++
  items = [...items.filter((t) => t.text !== text).slice(-2), { id, text, kind, action, sticky: ms === 0 }]
  emit()
  // durata 0: l'avviso resta finché non lo tocchi
  if (ms > 0) window.setTimeout(() => dismissToast(id), ms)
}

/** Va montato una volta sola (in App). */
export function ToastHost() {
  const list = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => items,
  )
  return (
    <div className="toasts" role="status" aria-live="polite">
      {list.map((t) => (
        <div key={t.id} className={`toast ${t.kind}${t.sticky ? ' sticky' : ''}`}>
          <button className="toast-text" onClick={() => dismissToast(t.id)}>
            {t.text}
          </button>
          {t.action && (
            <button
              className="toast-action"
              onClick={() => {
                dismissToast(t.id)
                t.action!.onClick()
              }}
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
