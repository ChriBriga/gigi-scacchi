import type { ReactNode } from 'react'
import { BookOpenText, CaretDoubleRight, Check, Star, ThumbsUp, X } from '@phosphor-icons/react'
import { QUALITY_INFO, type Quality } from '../engine/analysis'

const GLYPH: Record<string, (s: number) => ReactNode> = {
  star: (s) => <Star size={s} weight="fill" />,
  check: (s) => <Check size={s} weight="bold" />,
  thumb: (s) => <ThumbsUp size={s} weight="fill" />,
  book: (s) => <BookOpenText size={s} weight="fill" />,
  forced: (s) => <CaretDoubleRight size={s} weight="bold" />,
  miss: (s) => <X size={s} weight="bold" />,
}

/** Il simbolo di una mossa: !! ! ?! ? ?? restano testo (come negli scacchi), gli altri sono icone del set dell'app. */
export function QualityIcon({ q, size = '1em' }: { q: Quality; size?: number | string }) {
  const key = QUALITY_INFO[q].icon
  const g = GLYPH[key]
  return g ? g(size as number) : <>{key}</>
}
