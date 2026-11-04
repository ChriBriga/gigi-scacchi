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
  9: ['#ffd36b', '#e07a1f'],
  10: ['#7fe3d0', '#1f9c8e'],
  11: ['#d1ad74', '#6e4a26'],
  12: ['#7f9bff', '#2a2f8a'],
  13: ['#c3a3ff', '#4a2fb0'],
  14: ['#8fd3ff', '#2a7a9c'],
  15: ['#b9bccd', '#44475f'],
  16: ['#ffe39a', '#c0881a'],
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
  // Cuoco Cosimo: cappello da chef e baffoni
  9: (
    <g>
      <path d="M12 100 C12 80 28 74 50 74 C72 74 88 80 88 100 Z" fill="#f6f6fb" />
      <circle cx="50" cy="86" r="2.2" fill="#c9cde0" />
      <circle cx="50" cy="95" r="2.2" fill="#c9cde0" />
      <circle cx="50" cy="57" r="22" fill={SKIN} />
      <path d="M29 42 C24 28 34 22 40 24 C42 12 58 12 60 24 C66 22 76 28 71 42 Z" fill="#fff" stroke="#dfe3f2" strokeWidth="2" strokeLinejoin="round" />
      <rect x="29" y="39" width="42" height="9" rx="3" fill="#fff" stroke="#dfe3f2" strokeWidth="2" />
      <circle cx="41" cy="57" r="3" fill={INK} />
      <circle cx="59" cy="57" r="3" fill={INK} />
      <path d="M35 51 L46 53 M65 51 L54 53" stroke="#5a3a22" strokeWidth="3" strokeLinecap="round" />
      <circle cx="33" cy="66" r="4.2" fill="#ff8fb4" opacity=".55" />
      <circle cx="67" cy="66" r="4.2" fill="#ff8fb4" opacity=".55" />
      <path d="M33 67 Q41 60 50 66 Q59 60 67 67 Q60 74 50 69 Q40 74 33 67 Z" fill="#5a3a22" />
      <path d="M44 74 Q50 78 56 74" stroke="#b03a5a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Skater Sasha: cappellino rosso e sorrisone
  10: (
    <g>
      <path d="M12 100 C12 80 28 74 50 74 C72 74 88 80 88 100 Z" fill="#26c6a8" />
      <path d="M40 76 V92 M60 76 V92" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M25 52 C20 56 22 66 26 68 C26 62 28 56 28 54 Z M75 52 C80 56 78 66 74 68 C74 62 72 56 72 54 Z" fill="#4a2b17" />
      <circle cx="50" cy="56" r="22" fill={SKIN} />
      <path d="M26 50 C26 28 40 20 52 20 C66 20 75 32 74 50 Q50 41 26 50 Z" fill="#ff4d6a" />
      <path d="M26 50 Q50 41 74 50" fill="none" stroke="#b3123a" strokeWidth="4" strokeLinecap="round" />
      <circle cx="51" cy="20" r="2.8" fill="#ffc83d" />
      <circle cx="40" cy="58" r="3.2" fill={INK} />
      <circle cx="41" cy="57" r="1" fill="#fff" />
      <path d="M54 58 Q60 53 66 58" stroke={INK} strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <path d="M37 67 Q50 82 63 67 Z" fill="#fff" stroke="#b03a5a" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="31" cy="66" r="3.6" fill="#ff8fb4" opacity=".55" />
    </g>
  ),
  // Detective Dino: cappello, trench e lente
  11: (
    <g>
      <path d="M12 100 C12 80 28 74 50 74 C72 74 88 80 88 100 Z" fill="#8a6a3b" />
      <path d="M34 76 L50 94 L38 100 Z M66 76 L50 94 L62 100 Z" fill="#a98450" />
      <circle cx="50" cy="58" r="21" fill={SKIN} />
      <ellipse cx="50" cy="42" rx="34" ry="8" fill="#5a3b1e" />
      <path d="M31 42 C31 22 42 15 50 15 C58 15 69 22 69 42 Z" fill="#6e4a26" />
      <path d="M31 37 H69 V43 H31 Z" fill="#2c1b0c" />
      <path d="M38 58 H46 M54 56 H62" stroke={INK} strokeWidth="3" strokeLinecap="round" />
      <path d="M36 52 L47 54 M54 50 L65 47" stroke="#3b2414" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M43 71 H57" stroke="#b03a5a" strokeWidth="3" strokeLinecap="round" />
      <circle cx="76" cy="78" r="11" fill="#cfe9ff" fillOpacity=".55" stroke="#c98512" strokeWidth="4" />
      <path d="M84 86 L95 97" stroke="#8a5a1a" strokeWidth="6" strokeLinecap="round" />
    </g>
  ),
  // Astronauta Ada: casco con visiera
  12: (
    <g>
      <circle cx="14" cy="18" r="1.6" fill="#fff" opacity=".8" />
      <circle cx="86" cy="26" r="1.2" fill="#fff" opacity=".8" />
      <circle cx="20" cy="44" r="1" fill="#fff" opacity=".7" />
      <path d="M14 100 C14 82 30 78 50 78 C70 78 86 82 86 100 Z" fill="#f2f4ff" />
      <rect x="41" y="88" width="18" height="8" rx="2" fill="#ff4d6a" />
      <circle cx="50" cy="48" r="34" fill="#f7f8ff" stroke="#c5cbe6" strokeWidth="3" />
      <circle cx="50" cy="48" r="26" fill="#1f2f6b" />
      <circle cx="50" cy="51" r="17" fill={SKIN} />
      <path d="M33 47 C34 36 44 33 50 34 C58 33 67 38 67 47 C60 42 42 42 33 47 Z" fill="#3a2a20" />
      <circle cx="44" cy="52" r="2.4" fill={INK} />
      <circle cx="56" cy="52" r="2.4" fill={INK} />
      <path d="M44 59 Q50 64 56 59" stroke="#b03a5a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M31 40 Q36 29 47 27" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".7" />
      <path d="M50 15 V6" stroke="#c5cbe6" strokeWidth="3" strokeLinecap="round" />
      <circle cx="50" cy="5" r="3.2" fill="#ff4d6a" />
    </g>
  ),
  // Mago Merlo: cappello a punta e barbona
  13: (
    <g>
      <path d="M12 100 C12 82 28 76 50 76 C72 76 88 82 88 100 Z" fill="#5b3fc0" />
      <circle cx="50" cy="52" r="19" fill={SKIN} />
      <path d="M30 58 Q32 92 50 98 Q68 92 70 58 Q60 72 50 70 Q40 72 30 58 Z" fill="#f4f4fb" />
      <circle cx="50" cy="59" r="4.4" fill="#f0b996" />
      <path d="M36 49 Q42 44 47 48 M64 49 Q58 44 53 48" stroke="#f4f4fb" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      <circle cx="42" cy="52" r="2.4" fill={INK} />
      <circle cx="58" cy="52" r="2.4" fill={INK} />
      <ellipse cx="50" cy="40" rx="33" ry="7.5" fill="#4a30b0" />
      <path d="M27 40 L53 -2 L73 40 Z" fill="#6b4fe0" />
      <path d="M27 36 Q50 42 73 36 L73 40 Q50 46 27 40 Z" fill="#ffd23f" />
      <path d="M50 14 l2 5 5 .6 -3.8 3.4 1.2 5 -4.4 -2.7 -4.4 2.7 1.2 -5 -3.8 -3.4 5 -.6 z" fill="#ffd23f" />
      <circle cx="60" cy="30" r="1.6" fill="#fff" />
    </g>
  ),
  // Vichinga Vera: elmo con le corna e trecce
  14: (
    <g>
      <path d="M12 100 C12 82 28 76 50 76 C72 76 88 82 88 100 Z" fill="#2a6fb5" />
      <path d="M30 80 Q36 90 42 80 Q48 90 54 80 Q60 90 66 80 L70 84 Q50 98 30 84 Z" fill="#f4f4fb" />
      <path d="M28 58 Q20 76 29 94 M72 58 Q80 76 71 94" stroke="#f3c74b" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="57" r="22" fill={SKIN} />
      <path d="M28 40 C12 36 8 22 13 10 C19 22 28 26 33 30 Z" fill="#fff" stroke="#cfd4e3" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M72 40 C88 36 92 22 87 10 C81 22 72 26 67 30 Z" fill="#fff" stroke="#cfd4e3" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M26 50 C26 28 38 21 50 21 C62 21 74 28 74 50 Q50 42 26 50 Z" fill="#aab4c8" stroke="#7b869f" strokeWidth="2" />
      <rect x="47" y="30" width="6" height="22" rx="2.5" fill="#8c97b0" />
      <circle cx="40" cy="58" r="3.2" fill={INK} />
      <circle cx="60" cy="58" r="3.2" fill={INK} />
      <path d="M33 52 L46 55 M67 52 L54 55" stroke="#b07a1c" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 69 Q52 76 61 67" stroke="#b03a5a" strokeWidth="2.8" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="66" r="1.2" fill="#c9774a" />
      <circle cx="35" cy="69" r="1.2" fill="#c9774a" />
      <circle cx="68" cy="66" r="1.2" fill="#c9774a" />
    </g>
  ),
  // Barone Von Scacco: cilindro, monocolo, baffi
  15: (
    <g>
      <path d="M12 100 C12 82 28 76 50 76 C72 76 88 82 88 100 Z" fill="#20202e" />
      <path d="M40 78 L50 100 L60 78 Z" fill="#f4f4fb" />
      <path d="M50 82 L41 78 L41 87 Z M50 82 L59 78 L59 87 Z" fill="#c9254a" />
      <circle cx="50" cy="82" r="3" fill="#a3163a" />
      <circle cx="50" cy="57" r="21" fill={SKIN} />
      <ellipse cx="50" cy="39" rx="31" ry="6.5" fill="#14141f" />
      <rect x="34" y="12" width="32" height="27" rx="3" fill="#1c1c2b" />
      <rect x="34" y="30" width="32" height="6" fill="#8a1f3a" />
      <circle cx="41" cy="54" r="2.8" fill={INK} />
      <circle cx="59" cy="54" r="2.8" fill={INK} />
      <circle cx="59" cy="54" r="8.5" fill="#fff" fillOpacity=".2" stroke="#e9a91c" strokeWidth="2.6" />
      <path d="M67 60 Q74 72 70 90" stroke="#e9a91c" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeDasharray="2 2" />
      <path d="M34 50 L47 52" stroke="#3a3a4a" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M35 68 Q41 62 50 67 Q59 62 65 68 Q60 72 50 69 Q40 72 35 68 Z" fill="#3a3a4a" />
      <path d="M35 68 q-5 -1 -4 -7 M65 68 q5 -1 4 -7" stroke="#3a3a4a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  // Sfinge Serafina: copricapo faraonico e occhi bistrati
  16: (
    <g>
      <path d="M16 100 C16 82 32 78 50 78 C68 78 84 82 84 100 Z" fill="#ffcf3a" stroke="#c98512" strokeWidth="2" />
      <path d="M28 86 Q50 96 72 86" stroke="#2b6fd6" strokeWidth="4" fill="none" />
      <path d="M24 60 C20 34 32 16 50 16 C68 16 80 34 76 60 L73 88 L60 80 L40 80 L27 88 Z" fill="#2b6fd6" />
      <path d="M25 30 Q50 22 75 30 M23 42 Q50 34 77 42 M23 54 Q50 46 77 54 M24 66 Q50 58 76 66" stroke="#ffcf3a" strokeWidth="3.2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="58" r="19" fill="#f2c28f" />
      <path d="M32 46 Q50 38 68 46 Q50 42 32 46 Z" fill="#2b6fd6" />
      <ellipse cx="42" cy="56" rx="5.4" ry="3.4" fill="#fff" />
      <ellipse cx="58" cy="56" rx="5.4" ry="3.4" fill="#fff" />
      <circle cx="42" cy="56" r="2.4" fill={INK} />
      <circle cx="58" cy="56" r="2.4" fill={INK} />
      <path d="M33 56 L25 51 M67 56 L75 51 M36 52 Q42 49 48 52 M52 52 Q58 49 64 52" stroke={INK} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M44 68 Q50 72 56 68" stroke="#b03a5a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M50 14 l3 6 -3 5 -3 -5 z" fill="#ffcf3a" stroke="#c98512" strokeWidth="1.2" strokeLinejoin="round" />
    </g>
  ),
}
