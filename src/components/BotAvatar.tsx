import { useId } from 'react'

const BG: Record<number, [string, string]> = {
  1: ['#7fd6a0', '#2f9c78'],
  2: ['#f7a8c8', '#c2569a'],
  3: ['#f4b15f', '#c46a1c'],
  4: ['#6fd3ff', '#2a7bd0'],
  5: ['#b6bfd6', '#5c6a8f'],
  6: ['#ff8a5c', '#d1303f'],
  7: ['#b9a2ff', '#5b3fc0'],
  8: ['#f6d56a', '#b97a12'],
}

/** Avatar illustrati dei bot: personaggi semplici su disco colorato. */
export function BotAvatar({ id, size = 56 }: { id: number; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const [c1, c2] = BG[id] ?? BG[1]
  return (
    <svg className="bot-avatar" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset="1" stopColor={c2} />
        </linearGradient>
        <clipPath id={`c${uid}`}>
          <circle cx="50" cy="50" r="48" />
        </clipPath>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#g${uid})`} />
      <circle cx="50" cy="50" r="48" fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="3" />
      <g clipPath={`url(#c${uid})`}>{FACES[id] ?? FACES[1]}</g>
    </svg>
  )
}

const SKIN = '#ffd9b8'
const INK = '#2a1230'

const FACES: Record<number, React.ReactNode> = {
  // Pedone Pigro: lumaca assonnata
  1: (
    <g>
      <ellipse cx="50" cy="78" rx="38" ry="10" fill="#1f6f55" opacity=".35" />
      <path d="M12 78 C12 62 30 62 44 66 L84 64 C94 64 94 78 84 78 Z" fill="#b8f0c8" />
      <circle cx="58" cy="50" r="22" fill="#ffb347" />
      <path d="M58 50 m-14 0 a14 14 0 1 1 14 14 a8 8 0 1 1 -8 -8 a4 4 0 1 1 4 4" fill="none" stroke="#c46a1c" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M22 66 L20 44 M34 66 L36 44" stroke="#b8f0c8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="20" cy="42" r="6" fill="#fff" />
      <circle cx="36" cy="42" r="6" fill="#fff" />
      <path d="M14 42 H26 M30 42 H42" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 70 Q28 74 34 70" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <text x="70" y="28" fontSize="14" fontWeight="800" fill="#fff" fontFamily="Fredoka Variable, sans-serif">z</text>
      <text x="80" y="18" fontSize="10" fontWeight="800" fill="#fff" fontFamily="Fredoka Variable, sans-serif">z</text>
    </g>
  ),
  // Nonna Gertrude
  2: (
    <g>
      <path d="M14 100 C14 78 30 72 50 72 C70 72 86 78 86 100 Z" fill="#8a4fd0" />
      <path d="M40 72 L50 84 L60 72" fill="#f9f0ff" />
      <circle cx="50" cy="28" r="12" fill="#e7e9f4" />
      <circle cx="50" cy="52" r="27" fill="#e7e9f4" />
      <circle cx="50" cy="55" r="23" fill={SKIN} />
      <path d="M27 50 Q50 28 73 50 Q60 40 50 40 Q40 40 27 50 Z" fill="#e7e9f4" />
      <circle cx="39" cy="55" r="8" fill="none" stroke="#8a4fd0" strokeWidth="2.6" />
      <circle cx="61" cy="55" r="8" fill="none" stroke="#8a4fd0" strokeWidth="2.6" />
      <path d="M47 55 H53" stroke="#8a4fd0" strokeWidth="2.6" />
      <circle cx="39" cy="55" r="2.6" fill={INK} />
      <circle cx="61" cy="55" r="2.6" fill={INK} />
      <circle cx="32" cy="66" r="4.5" fill="#ff8fb4" opacity=".6" />
      <circle cx="68" cy="66" r="4.5" fill="#ff8fb4" opacity=".6" />
      <path d="M42 68 Q50 76 58 68" stroke="#b03a5a" strokeWidth="3" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Tony il Cavallo
  3: (
    <g>
      <path d="M30 100 C30 70 38 50 58 36 L60 18 L68 30 C82 34 92 48 90 64 L84 76 C80 74 76 76 74 82 L74 100 Z" fill="#a8683a" />
      <path d="M58 36 C44 40 34 56 34 76" fill="none" stroke="#3b2414" strokeWidth="9" strokeLinecap="round" />
      <path d="M62 24 L56 10 L72 20 Z" fill="#a8683a" />
      <path d="M84 76 C88 70 94 70 94 78 C94 88 84 90 78 84 Z" fill="#d79a66" />
      <circle cx="72" cy="48" r="5" fill="#fff" />
      <circle cx="73" cy="49" r="2.6" fill={INK} />
      <path d="M66 41 L78 44" stroke="#3b2414" strokeWidth="3" strokeLinecap="round" />
      <circle cx="87" cy="78" r="1.8" fill="#6b3d1e" />
      <path d="M74 84 Q80 88 86 86" stroke="#6b3d1e" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Alfiere Ale: tipo cool con occhiali da sole
  4: (
    <g>
      <path d="M16 100 C16 78 32 74 50 74 C68 74 84 78 84 100 Z" fill="#14283f" />
      <path d="M30 76 L50 90 L70 76" fill="none" stroke="#6fd3ff" strokeWidth="3" />
      <path d="M28 36 C26 14 50 6 56 20 C72 10 80 30 72 38 Z" fill="#12335a" />
      <circle cx="50" cy="52" r="24" fill={SKIN} />
      <path d="M26 46 C30 30 46 26 58 30 C70 26 76 38 74 46 C64 38 40 36 26 46 Z" fill="#12335a" />
      <path d="M28 48 H72 V56 Q72 66 60 66 Q52 66 50 58 Q48 66 40 66 Q28 66 28 56 Z" fill="#0b0f1f" />
      <path d="M33 52 L42 52" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
      <path d="M40 74 Q52 82 62 72" stroke="#b03a5a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Torre di Controllo
  5: (
    <g>
      <rect x="0" y="82" width="100" height="22" fill="#3f4a6b" opacity=".6" />
      <path d="M24 90 L28 34 L72 34 L76 90 Z" fill="#aeb8d3" />
      <path d="M22 34 V14 H34 V22 H44 V14 H56 V22 H66 V14 H78 V34 Z" fill="#c8d0e6" />
      <path d="M28 34 H72" stroke="#7d89b0" strokeWidth="3" />
      <circle cx="40" cy="54" r="6.5" fill="#fff" />
      <circle cx="60" cy="54" r="6.5" fill="#fff" />
      <circle cx="41" cy="55" r="3" fill={INK} />
      <circle cx="61" cy="55" r="3" fill={INK} />
      <path d="M34 46 L46 49 M66 46 L54 49" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M38 68 Q50 74 62 68" stroke={INK} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M50 14 V4 L62 8 L50 12" fill="#ff4d6a" stroke="#ff4d6a" strokeWidth="1.5" />
    </g>
  ),
  // Lady Matta: capelli di fuoco
  6: (
    <g>
      <path d="M14 100 C14 80 30 74 50 74 C70 74 86 80 86 100 Z" fill="#3b1730" />
      <path d="M20 66 C8 48 18 24 30 16 C30 26 36 30 40 30 C38 18 46 8 52 2 C54 14 62 20 66 22 C70 16 76 14 80 8 C86 24 92 48 80 66 Z" fill="#ff7a2f" />
      <path d="M34 44 C38 28 50 22 52 14 C58 26 70 30 68 44 Z" fill="#ffc83d" />
      <circle cx="50" cy="56" r="23" fill={SKIN} />
      <path d="M26 52 C32 34 48 30 56 34 C66 30 74 40 74 52 C64 42 40 40 26 52 Z" fill="#ff7a2f" />
      <circle cx="40" cy="56" r="3.4" fill={INK} />
      <circle cx="60" cy="56" r="3.4" fill={INK} />
      <path d="M33 49 L46 50 M54 47 L67 44" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M38 68 Q52 80 64 66" fill="#fff" stroke="#b03a5a" strokeWidth="2.6" strokeLinejoin="round" />
      <circle cx="26" cy="64" r="3.6" fill="#ffd23f" />
      <circle cx="74" cy="64" r="3.6" fill="#ffd23f" />
    </g>
  ),
  // Il Professore
  7: (
    <g>
      <path d="M14 100 C14 80 30 74 50 74 C70 74 86 80 86 100 Z" fill="#2c2160" />
      <path d="M42 76 L50 84 L58 76 L50 72 Z" fill="#ff4d6a" />
      <circle cx="50" cy="54" r="23" fill={SKIN} />
      <path d="M26 54 C20 50 20 38 28 36 C28 46 30 50 30 56 Z M74 54 C80 50 80 38 72 36 C72 46 70 50 70 56 Z" fill="#f4f4fb" />
      <path d="M34 72 Q50 92 66 72 Q50 80 34 72 Z" fill="#f4f4fb" />
      <circle cx="40" cy="54" r="8" fill="#fff" fillOpacity=".5" stroke={INK} strokeWidth="2.6" />
      <circle cx="60" cy="54" r="8" fill="#fff" fillOpacity=".5" stroke={INK} strokeWidth="2.6" />
      <path d="M48 54 H52" stroke={INK} strokeWidth="2.6" />
      <circle cx="40" cy="55" r="2.6" fill={INK} />
      <circle cx="60" cy="55" r="2.6" fill={INK} />
      <path d="M44 70 Q50 74 56 70" stroke="#b03a5a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M22 32 L50 18 L78 32 L50 44 Z" fill="#1c1442" />
      <path d="M32 38 V48 Q50 56 68 48 V38 L50 46 Z" fill="#1c1442" />
      <path d="M78 32 V50" stroke="#ffd23f" strokeWidth="2.6" />
      <circle cx="78" cy="52" r="3.2" fill="#ffd23f" />
    </g>
  ),
  // Re Stoccafisso: pesce con corona
  8: (
    <g>
      <path d="M8 56 C20 30 56 26 76 44 L96 28 L92 56 L96 84 L76 68 C56 86 20 82 8 56 Z" fill="#ffe3a3" />
      <path d="M8 56 C20 30 56 26 76 44 C60 42 28 44 8 56 Z" fill="#ffc86b" />
      <path d="M36 62 C46 78 62 76 70 66" fill="none" stroke="#ffc86b" strokeWidth="5" strokeLinecap="round" />
      <path d="M44 32 L52 44 L38 44 Z" fill="#e9a23c" />
      <circle cx="24" cy="52" r="7" fill="#fff" />
      <circle cx="25" cy="53" r="3.4" fill={INK} />
      <path d="M12 62 Q22 68 30 64" stroke="#b9791f" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M20 36 L20 20 L28 26 L34 14 L40 26 L48 20 L48 36 Z" fill="#ffd23f" stroke="#c98512" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="34" cy="31" r="2.6" fill="#ff4d6a" />
    </g>
  ),
}
