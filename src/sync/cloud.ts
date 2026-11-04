import { useSyncExternalStore } from 'react'
import { applySynced, getState, pickSynced, subscribe } from '../store'
import { FIREBASE_CONFIG } from './config'
import { mergeDoc, mergeProgress, type CloudDoc } from './merge'

/**
 * Sincronizzazione automatica dei progressi con il tuo account Google (Firebase Auth + Firestore).
 * Firebase viene caricato solo se la sincronizzazione è configurata e attiva: altrimenti non costa nulla.
 */

export type SyncPhase = 'unconfigured' | 'signedOut' | 'working' | 'ok' | 'error'
export interface SyncStatus {
  phase: SyncPhase
  email?: string
  /** nome e foto dell'account Google (servono al profilo) */
  name?: string
  photo?: string
  message?: string
  /** ultima sincronizzazione riuscita (ms) */
  last?: number
}

const FLAG = 'gigi-sync-on'
const PROFILE_CACHE = 'gigi-profile'
const PUSH_DELAY = 4000

/** Ultimo profilo Google visto su questo dispositivo: così nome e foto compaiono subito, anche offline. */
function readProfileCache(): Pick<SyncStatus, 'name' | 'photo' | 'email'> {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_CACHE) ?? '{}') as Pick<SyncStatus, 'name' | 'photo' | 'email'>
  } catch {
    return {}
  }
}
function writeProfileCache(p: Pick<SyncStatus, 'name' | 'photo' | 'email'> | null) {
  try {
    if (p) localStorage.setItem(PROFILE_CACHE, JSON.stringify(p))
    else localStorage.removeItem(PROFILE_CACHE)
  } catch {
    /* storage non disponibile */
  }
}

function flagOn(): boolean {
  try {
    return localStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}

let status: SyncStatus = FIREBASE_CONFIG ? { phase: 'signedOut', ...(flagOn() ? readProfileCache() : {}) } : { phase: 'unconfigured' }
const listeners = new Set<() => void>()
function setStatus(patch: Partial<SyncStatus>) {
  status = { ...status, ...patch }
  listeners.forEach((l) => l())
}

export function useSyncStatus(): SyncStatus {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => status,
  )
}

const readFlag = () => {
  try {
    return localStorage.getItem(FLAG) === '1'
  } catch {
    return false
  }
}
const writeFlag = (on: boolean) => {
  try {
    if (on) localStorage.setItem(FLAG, '1')
    else localStorage.removeItem(FLAG)
  } catch {
    /* storage non disponibile */
  }
}

type FB = {
  auth: import('firebase/auth').Auth
  authMod: typeof import('firebase/auth')
  db: import('firebase/firestore').Firestore
  fs: typeof import('firebase/firestore')
}
let fbPromise: Promise<FB> | null = null
function loadFirebase(): Promise<FB> {
  if (!FIREBASE_CONFIG) return Promise.reject(new Error('Sincronizzazione non configurata'))
  fbPromise ??= (async () => {
    const [{ initializeApp }, authMod, fs] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')])
    const app = initializeApp(FIREBASE_CONFIG!)
    return { auth: authMod.getAuth(app), authMod, db: fs.getFirestore(app), fs }
  })()
  return fbPromise
}

let started = false
let applying = false
let running = false
let again = false
let pushTimer: ReturnType<typeof setTimeout> | undefined
let lastPull = 0

function friendly(e: unknown): string {
  const code = (e as { code?: string })?.code ?? ''
  if (code.includes('permission-denied')) return 'Firestore ha rifiutato l’accesso: controlla le regole del database.'
  if (code.includes('unavailable') || code.includes('network')) return 'Sei offline: riprovo appena torna la connessione.'
  if (code.includes('unauthorized-domain')) return 'Questo indirizzo non è tra i domini autorizzati di Firebase.'
  return (e as Error)?.message ?? 'Errore sconosciuto'
}

const plain = <T,>(x: T): T => JSON.parse(JSON.stringify(x)) as T

function localDoc(): CloudDoc {
  const s = getState()
  return { progress: s.progress, settings: pickSynced(s.settings) }
}

/** Scarica, unisce con i dati locali, e salva il risultato nel cloud (e sul dispositivo). */
export async function syncNow(): Promise<void> {
  if (!FIREBASE_CONFIG) return
  if (running) {
    again = true
    return
  }
  const f = await loadFirebase()
  const user = f.auth.currentUser
  if (!user) return
  running = true
  setStatus({ phase: 'working', email: user.email ?? undefined, message: undefined })
  try {
    const ref = f.fs.doc(f.db, 'users', user.uid)
    const merged = await f.fs.runTransaction(f.db, async (tx) => {
      const snap = await tx.get(ref)
      const local = localDoc()
      const remote = snap.exists() ? (snap.data() as Partial<CloudDoc>) : null
      const out = remote?.progress && remote.settings ? mergeDoc(local, remote as CloudDoc) : local
      tx.set(ref, { ...plain(out), updatedAt: Date.now() })
      return out
    })
    // nel frattempo potresti aver giocato: unisco anche quello, poi applico
    const now = localDoc()
    const finalProgress = mergeProgress(now.progress, merged.progress)
    applying = true
    applySynced(finalProgress, (now.progress.modified ?? 0) > (merged.progress.modified ?? 0) ? now.settings : merged.settings)
    applying = false
    lastPull = Date.now()
    setStatus({ phase: 'ok', last: lastPull, message: undefined })
    if ((now.progress.modified ?? 0) > (merged.progress.modified ?? 0)) schedulePush()
  } catch (e) {
    applying = false
    setStatus({ phase: 'error', message: friendly(e) })
  } finally {
    running = false
    if (again) {
      again = false
      void syncNow()
    }
  }
}

function schedulePush() {
  if (!FIREBASE_CONFIG || status.phase === 'signedOut' || status.phase === 'unconfigured') return
  clearTimeout(pushTimer)
  pushTimer = setTimeout(() => {
    pushTimer = undefined
    void syncNow()
  }, PUSH_DELAY)
}

async function start() {
  if (started || !FIREBASE_CONFIG) return
  started = true
  const f = await loadFirebase()
  f.authMod.onAuthStateChanged(f.auth, (user) => {
    if (user) {
      const who = { email: user.email ?? undefined, name: user.displayName ?? undefined, photo: user.photoURL ?? undefined }
      writeProfileCache(who)
      setStatus({ phase: 'working', ...who })
      void syncNow()
    } else {
      writeProfileCache(null)
      setStatus({ phase: 'signedOut', email: undefined, name: undefined, photo: undefined, message: undefined })
    }
  })
  f.authMod.getRedirectResult(f.auth).catch((e) => setStatus({ phase: 'error', message: friendly(e) }))
  subscribe(() => {
    if (!applying) schedulePush()
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (pushTimer) {
        clearTimeout(pushTimer)
        void syncNow()
      }
    } else if (Date.now() - lastPull > 30_000) void syncNow()
  })
  window.addEventListener('online', () => void syncNow())
}

/** Da chiamare all'avvio dell'app: se avevi già fatto l'accesso, riprende da solo. */
export function initSync() {
  if (FIREBASE_CONFIG && readFlag()) void start().catch((e) => setStatus({ phase: 'signedOut', message: friendly(e) }))
}

export async function signIn(): Promise<void> {
  if (!FIREBASE_CONFIG) return
  setStatus({ phase: 'working', message: undefined })
  try {
    writeFlag(true)
    await start()
    const f = await loadFirebase()
    const provider = new f.authMod.GoogleAuthProvider()
    try {
      await f.authMod.signInWithPopup(f.auth, provider)
    } catch (e) {
      const code = (e as { code?: string }).code ?? ''
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setStatus({ phase: 'signedOut' })
        return
      }
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        await f.authMod.signInWithRedirect(f.auth, provider)
        return
      }
      throw e
    }
  } catch (e) {
    writeFlag(false)
    setStatus({ phase: 'signedOut', message: friendly(e) })
  }
}

export async function signOutSync(): Promise<void> {
  writeFlag(false)
  clearTimeout(pushTimer)
  try {
    const f = await loadFirebase()
    await f.authMod.signOut(f.auth)
  } catch {
    /* già fuori */
  }
  writeProfileCache(null)
  setStatus({ phase: 'signedOut', email: undefined, name: undefined, photo: undefined, message: undefined })
}
