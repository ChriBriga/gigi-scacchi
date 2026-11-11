import { useSyncExternalStore } from 'react'

/** Avvisi brevi in basso: compaiono, restano qualche secondo e spariscono da soli (o con un tocco). */
export interface ToastItem {
  id: number
  text: string
  kind: 'info' | 'ok' | 'bad'
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
export function toast(text: string, kind: ToastItem['kind'] = 'info', ms = 3200) {
  const id = nextId++
  items = [...items.filter((t) => t.text !== text).slice(-2), { id, text, kind }]
  emit()
  window.setTimeout(() => dismissToast(id), ms)
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
        <button key={t.id} className={`toast ${t.kind}`} onClick={() => dismissToast(t.id)}>
          {t.text}
        </button>
      ))}
    </div>
  )
}
