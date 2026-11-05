import type { Progress } from '../store'
import { rankOfId } from '../engine/bots'
import type { CoachId } from './coaches'

export type Slot = 'crown' | 'face' | 'neck' | 'back' | 'extra'
export type Outfit = Partial<Record<Slot, string>>

export interface OutfitItem {
  id: string
  /** di chi è: senza indicazione vale per tutti i coach (le corone/copricapi sono sempre di un coach preciso) */
  coach?: CoachId
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
  { id: 'oro', coach: 'gigi', slot: 'crown', name: 'Corona d’oro', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'avorio', coach: 'gigi', slot: 'crown', name: 'Corona bianca', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'ebano', coach: 'gigi', slot: 'crown', name: 'Corona nera', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'rubino', coach: 'gigi', slot: 'crown', name: 'Corona rubino', how: 'Vinci 5 partite', need: 5, have: (p) => p.wins },
  { id: 'ghiaccio', coach: 'gigi', slot: 'crown', name: 'Corona di ghiaccio', how: 'Batti 6 avversari diversi', need: 6, have: (p) => p.botsBeaten.length },
  { id: 'smeraldo', coach: 'gigi', slot: 'crown', name: 'Corona smeraldo', how: 'Guadagna 1500 XP', need: 1500, have: (p) => Math.round(p.xp) },
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

  // ---- Capitan Gabbiano: solo suoi ----
  { id: 'tricorno', coach: 'gabbiano', slot: 'crown', name: 'Tricorno nero', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'tricorno-rosso', coach: 'gabbiano', slot: 'crown', name: 'Tricorno rosso', how: 'Vinci 3 partite', need: 3, have: (p) => p.wins },
  { id: 'tricorno-blu', coach: 'gabbiano', slot: 'crown', name: 'Tricorno da ammiraglio', how: 'Batti 4 avversari diversi', need: 4, have: (p) => p.botsBeaten.length },
  { id: 'tricorno-oro', coach: 'gabbiano', slot: 'crown', name: 'Tricorno d’oro', how: 'Guadagna 1200 XP', need: 1200, have: (p) => Math.round(p.xp) },
  { id: 'benda', coach: 'gabbiano', slot: 'face', name: 'Benda da pirata', how: 'Gioca 3 partite', need: 3, have: (p) => p.games },
  { id: 'doblone', coach: 'gabbiano', slot: 'neck', name: 'Dobbolone d’oro', how: 'Batti 2 avversari diversi', need: 2, have: (p) => p.botsBeaten.length },
  { id: 'cannocchiale', coach: 'gabbiano', slot: 'extra', name: 'Cannocchiale', how: 'Risolvi 20 puzzle', need: 20, have: (p) => p.puzzlesSolved },
  { id: 'forziere', coach: 'gabbiano', slot: 'extra', name: 'Forziere del tesoro', how: 'Vinci 8 partite', need: 8, have: (p) => p.wins },

  // ---- Professor Gufo: solo suoi ----
  { id: 'tocco', coach: 'gufo', slot: 'crown', name: 'Tocco blu', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'tocco-nero', coach: 'gufo', slot: 'crown', name: 'Tocco nero', how: 'Completa 2 lezioni', need: 2, have: (p) => p.lessonsDone.length },
  { id: 'tocco-bordeaux', coach: 'gufo', slot: 'crown', name: 'Tocco bordeaux', how: 'Vinci 4 partite', need: 4, have: (p) => p.wins },
  { id: 'tocco-oro', coach: 'gufo', slot: 'crown', name: 'Tocco d’oro', how: 'Guadagna 1200 XP', need: 1200, have: (p) => Math.round(p.xp) },
  { id: 'mezzaluna', coach: 'gufo', slot: 'face', name: 'Occhiali a mezzaluna', how: 'Completa 4 lezioni', need: 4, have: (p) => p.lessonsDone.length },
  { id: 'orologio', coach: 'gufo', slot: 'neck', name: 'Orologio da taschino', how: 'Gioca 4 partite', need: 4, have: (p) => p.games },
  { id: 'libro', coach: 'gufo', slot: 'extra', name: 'Libro antico', how: 'Completa 6 lezioni', need: 6, have: (p) => p.lessonsDone.length },
  { id: 'pergamena', coach: 'gufo', slot: 'extra', name: 'Pergamena', how: 'Risolvi 30 puzzle', need: 30, have: (p) => p.puzzlesSolved },

  // ---- Nonna Gallina: solo suoi ----
  { id: 'cresta', coach: 'gallina', slot: 'crown', name: 'Cresta rossa', how: 'Sempre disponibile', need: 1, have: always },
  { id: 'cresta-rosa', coach: 'gallina', slot: 'crown', name: 'Cresta rosa', how: 'Gioca 4 partite', need: 4, have: (p) => p.games },
  { id: 'cresta-gialla', coach: 'gallina', slot: 'crown', name: 'Cresta dorata', how: 'Gioca 8 partite', need: 8, have: (p) => p.games },
  { id: 'cuoca', coach: 'gallina', slot: 'crown', name: 'Cappello da cuoca', how: 'Gioca 2 partite pulite', need: 2, have: (p) => p.cleanGames ?? 0 },
  { id: 'nonna', coach: 'gallina', slot: 'face', name: 'Occhiali da nonna', how: 'Completa 2 lezioni', need: 2, have: (p) => p.lessonsDone.length },
  { id: 'scialle', coach: 'gallina', slot: 'neck', name: 'Scialle a righe', how: 'Gioca 3 partite', need: 3, have: (p) => p.games },
  { id: 'mestolo', coach: 'gallina', slot: 'extra', name: 'Mestolo', how: 'Gioca 6 partite', need: 6, have: (p) => p.games },
  { id: 'torta', coach: 'gallina', slot: 'extra', name: 'Torta della nonna', how: 'Vinci 5 partite', need: 5, have: (p) => p.wins },
]

export const outfitItem = (id: string | undefined) => OUTFIT.find((o) => o.id === id)
export const isUnlocked = (o: OutfitItem, p: Progress) => o.have(p) >= o.need

/** Il copricapo di serie di ogni coach (quello che si vede se non ne scegli un altro). */
export const DEFAULT_CROWN: Record<CoachId, string> = { gigi: 'oro', gabbiano: 'tricorno', gufo: 'tocco', gallina: 'cresta' }

/** Gli oggetti che un coach può indossare in un certo spazio: i suoi più quelli comuni (tranne i copricapi, sempre personali). */
export const itemsFor = (coach: CoachId, slot: Slot): OutfitItem[] =>
  OUTFIT.filter((o) => o.slot === slot && (o.coach ? o.coach === coach : slot !== 'crown'))

/** Tutto quello che un coach può sbloccare (per il conteggio «x/y sbloccati»). */
export const earnableFor = (coach: CoachId): OutfitItem[] =>
  SLOTS.flatMap((s) => itemsFor(coach, s)).filter((o) => o.need > 1 || o.how !== 'Sempre disponibile')

/** Quello che indossa un coach: Gigi usa `outfit` (com'era prima), gli altri `outfits`. */
export const outfitOf = (s: { outfit?: Outfit; outfits?: Partial<Record<CoachId, Outfit>> }, coach: CoachId): Outfit =>
  coach === 'gigi' ? (s.outfit ?? {}) : (s.outfits?.[coach] ?? {})

/** Se un oggetto salvato non esiste più o non è di quel coach, si ignora (si vede il look di serie). */
export const validOutfit = (coach: CoachId, o: Outfit): Outfit => {
  const out: Outfit = {}
  for (const s of SLOTS) {
    const id = o[s]
    if (id && itemsFor(coach, s).some((it) => it.id === id)) out[s] = id
  }
  return out
}
