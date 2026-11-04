import type { Tone } from '../lines'

/** Scorciatoia per scrivere le battute: i tre mazzi in ordine gentile, pepato, spietato. */
export const tones = (gentle: string[], spicy: string[], ruthless: string[]): Record<Tone, string[]> => ({ gentle, spicy, ruthless })
