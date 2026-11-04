import type { Progress } from '../store'
import { rankOfId } from '../engine/bots'

export type Slot = 'crown' | 'face' | 'neck' | 'back' | 'extra'
export type Outfit = Partial<Record<Slot, string>>

export interface OutfitItem {
  id: string
  slot: Slot
  name: string
  /** come si sblocca, in parole */
  how: string
  /** quanto serve per sbloccarlo e quanto hai già (per la barra di avanzamento) */
  need: number
  have: (p: Progress) => number
}

export const SLOT_LABEL: Record<Slot, string> = { crown: 'Corona', face: 'Occhi', neck: 'Collo', back: 'Schiena', extra: 'In ala' }
export const SLOTS: Slot[] = ['crown', 'face', 'neck', 'back', 'extra']

const always = () => 1
const flag = (cond: (p: Progress) => boolean) => (p: Progress) => (cond(p) ? 1 : 0)

/** Guardaroba di Gigi: si sblocca giocando. Tutto resta sul dispositivo, come il resto dei progressi. */
export const OUTFIT: OutfitItem[] = [
  // corone (colori)
  { id: 'oro', slot: 'crown', name: 'Corona d’oro', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'avorio', slot: 'crown', name: 'Corona bianca', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'ebano', slot: 'crown', name: 'Corona nera', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'rubino', slot: 'crown', name: 'Corona rubino', how: 'Vinci 5 partite', need: 5, have: (p) => p.wins },
  { id: 'ghiaccio', slot: 'crown', name: 'Corona di ghiaccio', how: 'Batti 6 avversari diversi', need: 6, have: (p) => p.botsBeaten.length },
  { id: 'smeraldo', slot: 'crown', name: 'Corona smeraldo', how: 'Guadagna 1500 XP', need: 1500, have: (p) => Math.round(p.xp) },
  // occhi
  { id: 'tondi', slot: 'face', name: 'Occhiali da secchione', how: 'Completa 3 lezioni', need: 3, have: (p) => p.lessonsDone.length },
  { id: 'monocolo', slot: 'face', name: 'Monocolo', how: 'Completa 8 lezioni', need: 8, have: (p) => p.lessonsDone.length },
  { id: 'stella', slot: 'face', name: 'Occhiali a stella', how: 'Risolvi 40 puzzle', need: 40, have: (p) => p.puzzlesSolved },
  // collo
  { id: 'papillon', slot: 'neck', name: 'Papillon', how: 'Gioca la tua prima partita', need: 1, have: (p) => p.games },
  { id: 'cravatta', slot: 'neck', name: 'Cravatta rossa', how: 'Completa 5 lezioni', need: 5, have: (p) => p.lessonsDone.length },
  { id: 'sciarpa', slot: 'neck', name: 'Sciarpa', how: 'Risolvi 15 puzzle', need: 15, have: (p) => p.puzzlesSolved },
  { id: 'briciole', slot: 'neck', name: 'Collana di briciole', how: 'Gioca 10 partite', need: 10, have: (p) => p.games },
  { id: 'medaglia', slot: 'neck', name: 'Medaglia d’oro', how: 'Batti 3 avversari diversi', need: 3, have: (p) => p.botsBeaten.length },
  // schiena
  { id: 'zainetto', slot: 'back', name: 'Zainetto', how: 'Completa 12 lezioni', need: 12, have: (p) => p.lessonsDone.length },
  { id: 'fate', slot: 'back', name: 'Ali da fata', how: 'Gioca una partita pulita (senza ritirare mosse)', need: 1, have: (p) => p.cleanGames ?? 0 },
  { id: 'mantello', slot: 'back', name: 'Mantello reale', how: 'Batti Lady Matta (o chi viene dopo)', need: 1, have: flag((p) => p.botsBeaten.some((id) => rankOfId(id) >= 13)) },
  // in ala
  { id: 'caffe', slot: 'extra', name: 'Tazza di caffè', how: 'Gioca 5 partite', need: 5, have: (p) => p.games },
  { id: 'briciola', slot: 'extra', name: 'La briciola', how: 'Risolvi 25 puzzle', need: 25, have: (p) => p.puzzlesSolved },
  { id: 'bandierina', slot: 'extra', name: 'Bandierina a scacchi', how: 'Batti Tony il Cavallo (o chi viene dopo)', need: 1, have: flag((p) => p.botsBeaten.some((id) => rankOfId(id) >= 4)) },
  { id: 'trofeo', slot: 'extra', name: 'Trofeo', how: 'Batti Re Stoccafisso', need: 1, have: flag((p) => p.botsBeaten.includes(8)) },
]

export const outfitItem = (id: string | undefined) => OUTFIT.find((o) => o.id === id)
export const isUnlocked = (o: OutfitItem, p: Progress) => o.have(p) >= o.need
