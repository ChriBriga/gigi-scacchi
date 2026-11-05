import { useSyncExternalStore } from 'react'

/**
 * Livello degli effetti: Leggero (telefoni deboli), Normale, Spettacolare (dispositivi potenti).
 * Si sceglie da solo (core, RAM, risparmio dati, un breve test di fluidità) e si può forzare dalle Impostazioni.
 * È una preferenza del dispositivo: non viaggia con la sincronizzazione.
 */
export type Fx = 'low' | 'mid' | 'high'
export type FxPref = 'auto' | Fx

export const FX_LABEL: Record<Fx, string> = { low: 'Leggero', mid: 'Normale', high: 'Spettacolare' }
const ORDER: Fx[] = ['low', 'mid', 'high']

const PREF_KEY = 'gigi-fx-pref'
/** il livello trovato dal test, con la data: si rifà dopo qualche giorno */
const AUTO_KEY = 'gigi-fx-auto'
const RETEST_MS = 7 * 24 * 3600 * 1000

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* pazienza */
  }
}

interface NavExtra {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

/** Prima stima, in base a quello che il dispositivo dichiara. */
export function guessTier(): Fx {
  const nav = navigator as Navigator & NavExtra
  if (nav.connection?.saveData) return 'low'
  const cores = nav.hardwareConcurrency || 4
  const mem = nav.deviceMemory // solo Chrome/Android/Edge; altrove è undefined
  const touch = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  if (cores <= 2 || (mem !== undefined && mem <= 2)) return 'low'
  if (touch) {
    // telefoni e tablet: "Spettacolare" solo se la RAM è abbondante (o iPhone/iPad recenti)
    if (mem !== undefined) return mem >= 6 && cores >= 6 ? 'high' : mem >= 4 ? 'mid' : 'low'
    if (ios) return cores >= 6 ? 'high' : 'mid'
    return cores >= 8 ? 'mid' : 'low'
  }
  // computer
  if (mem !== undefined && mem < 4) return 'mid'
  return cores >= 6 ? 'high' : 'mid'
}

let pref: FxPref = (['auto', 'low', 'mid', 'high'] as string[]).includes(read(PREF_KEY) ?? '') ? (read(PREF_KEY) as FxPref) : 'auto'
let autoTier: Fx = initialAuto()
const listeners = new Set<() => void>()

function initialAuto(): Fx {
  const saved = read(AUTO_KEY)
  if (saved) {
    try {
      const { tier, at } = JSON.parse(saved) as { tier: Fx; at: number }
      if (ORDER.includes(tier) && Date.now() - at < RETEST_MS) return tier
    } catch {
      /* si rifà */
    }
  }
  return guessTier()
}

export const fxTier = (): Fx => (pref === 'auto' ? autoTier : pref)
export const fxPref = (): FxPref => pref

function apply() {
  document.documentElement.dataset.fx = fxTier()
  listeners.forEach((l) => l())
}

export function setFxPref(next: FxPref) {
  pref = next
  write(PREF_KEY, next)
  apply()
}

function setAuto(tier: Fx) {
  autoTier = tier
  write(AUTO_KEY, JSON.stringify({ tier, at: Date.now() }))
  apply()
}

/** Scende di un gradino (solo in modalità automatica). */
function downgrade(to?: Fx) {
  if (pref !== 'auto') return
  const i = ORDER.indexOf(autoTier)
  const target = to ?? ORDER[Math.max(0, i - 1)]
  if (ORDER.indexOf(target) < i) setAuto(target)
}

/** Misura la fluidità per un po' e restituisce la durata mediana di un frame (ms). */
function sampleFrames(ms: number): Promise<number> {
  return new Promise((resolve) => {
    const gaps: number[] = []
    let last = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      if (document.hidden) {
        // in background il browser rallenta i frame: la misura non vale
        gaps.length = 0
        last = 0
      } else if (last) gaps.push(now - last)
      last = now
      if (now - t0 < ms) requestAnimationFrame(tick)
      else {
        gaps.sort((a, b) => a - b)
        resolve(gaps.length >= 8 ? gaps[Math.floor(gaps.length / 2)] : 0)
      }
    }
    requestAnimationFrame(tick)
  })
}

const slowTier = (frameMs: number): Fx | null => (frameMs > 40 ? 'low' : frameMs > 26 ? 'mid' : null)

/**
 * Da chiamare all'avvio: applica il livello e, se è automatico e non c'è un test recente,
 * lo verifica con un secondo di misura (può solo abbassare il livello, mai alzarlo).
 */
export function initPerf() {
  apply()
  if (pref !== 'auto' || read(AUTO_KEY)) return
  setAuto(autoTier) // registra la stima, così il test non si ripete a ogni avvio
  window.setTimeout(async () => {
    const ms = await sampleFrames(1500)
    const slow = ms ? slowTier(ms) : null
    if (slow) downgrade(slow)
  }, 1200)
}

/**
 * Controllo "sul campo": durante una partita misura la fluidità per qualche secondo;
 * se scatta davvero, abbassa il livello automatico per le volte successive e subito.
 */
export function watchFrames(ms = 4000) {
  if (pref !== 'auto' || autoTier === 'low') return
  void sampleFrames(ms).then((f) => {
    const slow = f ? slowTier(f) : null
    if (slow) downgrade(slow)
  })
}

export function useFx(): { tier: Fx; pref: FxPref } {
  const tier = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    fxTier,
  )
  const p = useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    fxPref,
  )
  return { tier, pref: p }
}
