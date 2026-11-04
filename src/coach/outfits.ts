import type { Progress } from '../store'

export type Slot = 'crown' | 'face' | 'neck' | 'back'
export type Outfit = Partial<Record<Slot, string>>

export interface OutfitItem {
  id: string
  slot: Slot
  name: string
  /** come si sblocca, in parole */
  how: string
  unlocked: (p: Progress) => boolean
}

export const SLOT_LABEL: Record<Slot, string> = { crown: 'Corona', face: 'Occhi', neck: 'Collo', back: 'Schiena' }

/** Guardaroba di Gigi: si sblocca giocando. Tutto resta sul dispositivo, come il resto dei progressi. */
export const OUTFIT: OutfitItem[] = [
  { id: 'avorio', slot: 'crown', name: 'Corona bianca', how: 'Sempre disponibile', unlocked: () => true },
  { id: 'ebano', slot: 'crown', name: 'Corona nera', how: 'Sempre disponibile', unlocked: () => true },
  { id: 'papillon', slot: 'neck', name: 'Papillon', how: 'Gioca la tua prima partita', unlocked: (p) => p.games >= 1 },
  { id: 'tondi', slot: 'face', name: 'Occhiali da secchione', how: 'Completa 3 lezioni', unlocked: (p) => p.lessonsDone.length >= 3 },
  { id: 'sciarpa', slot: 'neck', name: 'Sciarpa', how: 'Risolvi 15 puzzle', unlocked: (p) => p.puzzlesSolved >= 15 },
  { id: 'monocolo', slot: 'face', name: 'Monocolo', how: 'Completa 8 lezioni', unlocked: (p) => p.lessonsDone.length >= 8 },
  { id: 'medaglia', slot: 'neck', name: 'Medaglia d’oro', how: 'Batti 3 avversari diversi', unlocked: (p) => p.botsBeaten.length >= 3 },
  { id: 'mantello', slot: 'back', name: 'Mantello reale', how: 'Batti Lady Matta (o chi viene dopo)', unlocked: (p) => p.botsBeaten.some((id) => id >= 6) },
]

export const outfitItem = (id: string | undefined) => OUTFIT.find((o) => o.id === id)
