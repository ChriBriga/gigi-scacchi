import type { Voice } from '../lines'
import { GIGI_CORE } from './gigi-core'
import { GIGI_EXTRA } from './gigi-extra'
import { GIGI_QUALITY } from './gigi-quality'

/** Gigi il piccione: sarcastico, di parco, con un nemico giurato di nome Osvaldo (il gatto). */
export const GIGI: Voice = { ...GIGI_CORE, ...GIGI_QUALITY, ...GIGI_EXTRA }
