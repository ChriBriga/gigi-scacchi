import type { Progress, Settings } from '../store'

export type CoachId = 'gigi' | 'gabbiano' | 'gufo' | 'gallina'

export interface CoachInfo {
  id: CoachId
  name: string
  /** una riga che lo presenta */
  blurb: string
  /** come parla, per Gemini (resta in italiano, breve) */
  persona: string
  /** come si sblocca, in parole */
  how: string
  need: number
  have: (p: Progress) => number
}

/**
 * I coach: tutti uccelli, tutti con le stesse espressioni, ma ognuno con la sua voce.
 * Gigi c'è da subito; gli altri si sbloccano giocando, uno alla volta.
 */
export const COACHES: CoachInfo[] = [
  {
    id: 'gigi',
    name: 'Gigi',
    blurb: 'Il piccione di parco: sarcastico, affezionato, nemico giurato del gatto Osvaldo.',
    persona: 'Sei Gigi, un piccione allenatore di scacchi di parco, simpatico e diretto.',
    how: 'Sempre disponibile',
    need: 1,
    have: () => 1,
  },
  {
    id: 'gabbiano',
    name: 'Capitan Gabbiano',
    blurb: 'Pirata dei mari e dei ponti di scacchiera: parla di bordate, ciurma e tesori.',
    persona: 'Sei Capitan Gabbiano, un gabbiano pirata che allena a scacchi: parli con gergo marinaresco ("mille balene!", "mozzo", "all’arrembaggio").',
    how: 'Gioca 5 partite',
    need: 5,
    have: (p) => p.games,
  },
  {
    id: 'gufo',
    name: 'Professor Gufo',
    blurb: 'Pomposo e coltissimo: latino maccheronico, citazioni inventate e bocciature solenni.',
    persona: 'Sei il Professor Gufo, un gufo accademico pomposo che allena a scacchi: parli in modo formale con finto latino ("egregio", "ergo", "quod erat demonstrandum").',
    how: 'Batti 5 avversari diversi',
    need: 5,
    have: (p) => p.botsBeaten.length,
  },
  {
    id: 'gallina',
    name: 'Nonna Gallina',
    blurb: 'Affettuosa e severa: coccole, rimproveri e metafore di cucina.',
    persona: 'Sei Nonna Gallina, una gallina nonna che allena a scacchi: affettuosa e un po’ severa, con metafore di cucina ("tesoro", "bello di nonna", "ai miei tempi").',
    how: 'Gioca 2 partite pulite (senza ritirare mosse)',
    need: 2,
    have: (p) => p.cleanGames ?? 0,
  },
]

export const coachInfo = (id: string | undefined): CoachInfo => COACHES.find((c) => c.id === id) ?? COACHES[0]
export const coachUnlocked = (c: CoachInfo, p: Progress): boolean => c.have(p) >= c.need

/** Il coach in uso: quello scelto, se è davvero sbloccato (altrimenti Gigi). */
export function activeCoach(s: Pick<Settings, 'coach'>, p: Progress): CoachId {
  const c = coachInfo(s.coach)
  return coachUnlocked(c, p) ? c.id : 'gigi'
}
