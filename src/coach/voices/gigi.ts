import type { Voice } from '../lines'
import { GIGI_CORE } from './gigi-core'
import { GIGI_EXTRA } from './gigi-extra'

/** Gigi il piccione: sarcastico, di parco, con un nemico giurato di nome Osvaldo (il gatto). */
export const GIGI: Voice = { ...GIGI_CORE, ...GIGI_EXTRA }
