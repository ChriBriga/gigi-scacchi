import { useSyncExternalStore } from 'react'
import { toast } from './ui/Toast'

/**
 * Stato della rete. Si parte da navigator.onLine e poi ci si fida solo degli eventi online/offline
 * (in alcune anteprime navigator.onLine resta true anche quando l'evento offline scatta).
 */
let online = typeof navigator === 'undefined' ? true : navigator.onLine
const listeners = new Set<() => void>()

function setOnline(v: boolean) {
  if (v === online) return
  online = v
  listeners.forEach((l) => l())
  if (v) toast('Sei di nuovo online.', 'ok')
  else toast('Sei offline: si gioca lo stesso, niente sync né spiegazioni di Gemini.', 'info', 5000)
}

/** Da chiamare una volta all'avvio. */
export function initNet() {
  window.addEventListener('online', () => setOnline(true))
  window.addEventListener('offline', () => setOnline(false))
  // aperta già senza rete: l'avviso compare subito
  if (!online) toast('Sei offline: si gioca lo stesso, niente sync né spiegazioni di Gemini.', 'info', 5000)
}

export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => online,
  )
}
