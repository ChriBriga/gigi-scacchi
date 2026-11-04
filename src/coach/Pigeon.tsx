import type { Mood } from './lines'

/** Gigi il Piccione: il coach. Cambia faccia in base all'umore. */
export function Pigeon({ mood = 'neutral', size = 96 }: { mood?: Mood; size?: number }) {
  const brow =
    mood === 'angry'
      ? { l: 'M34 36 L52 42', r: 'M86 42 L68 36' }
      : mood === 'shocked'
        ? { l: 'M36 30 L52 32', r: 'M84 32 L68 30' }
        : mood === 'happy'
          ? { l: 'M36 36 Q44 32 52 36', r: 'M84 36 Q76 32 68 36' }
          : { l: 'M36 34 L52 34', r: 'M84 34 L68 34' }
  const pupilR = mood === 'shocked' ? 3 : 5
  return (
    <svg className={`pigeon mood-${mood}`} width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <ellipse cx="60" cy="108" rx="26" ry="5" fill="#000" opacity=".25" />
      {/* corpo */}
      <path d="M22 92 C14 62 30 24 62 24 C94 24 106 58 98 92 C90 108 34 108 22 92 Z" fill="#9aa5c7" />
      <path d="M38 98 C50 70 78 70 96 92 C88 106 52 108 38 98 Z" fill="#7d89b0" />
      {/* collo iridescente */}
      <path d="M32 62 C40 76 74 76 90 62 C84 54 74 52 62 52 C48 52 38 54 32 62 Z" fill="#46c1a5" opacity=".75" />
      {/* guance */}
      <circle cx="30" cy="54" r="6" fill="#ff8fb1" opacity=".5" />
      <circle cx="90" cy="54" r="6" fill="#ff8fb1" opacity=".5" />
      {/* occhi */}
      <circle cx="44" cy="46" r="11" fill="#fff" />
      <circle cx="76" cy="46" r="11" fill="#fff" />
      <circle cx="46" cy="47" r={pupilR} fill="#1b1033" />
      <circle cx="74" cy="47" r={pupilR} fill="#1b1033" />
      {mood === 'cool' && <rect x="30" y="38" width="60" height="14" rx="6" fill="#1b1033" />}
      {mood === 'cool' && <rect x="58" y="43" width="4" height="4" fill="#1b1033" />}
      <path d={brow.l} stroke="#1b1033" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d={brow.r} stroke="#1b1033" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      {/* becco */}
      <path d="M52 58 L68 58 L60 72 Z" fill="#ffb02e" />
      {mood === 'happy' && <path d="M52 76 Q60 84 68 76" stroke="#1b1033" strokeWidth="2.5" fill="none" strokeLinecap="round" />}
      {mood === 'shocked' && <ellipse cx="60" cy="80" rx="5" ry="6" fill="#1b1033" />}
      {/* ala */}
      <path d="M92 70 C108 78 106 96 92 98 C88 90 88 78 92 70 Z" fill="#7d89b0" />
      {/* cappellino da scacchi: piccola corona-torre */}
      <path d="M48 24 L48 14 L54 18 L60 10 L66 18 L72 14 L72 24 Z" fill="#ffd23f" stroke="#c9961a" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}
