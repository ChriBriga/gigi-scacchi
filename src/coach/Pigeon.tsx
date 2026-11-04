import { useId } from 'react'
import type { Mood } from './lines'
import { useApp } from '../store'
import type { Outfit } from './outfits'
import { activeCoach, type CoachId } from './coaches'

const CROWN: Record<string, { top: string; mid: string; bottom: string; edge: string }> = {
  oro: { top: '#fff0a0', mid: '#ffcf3a', bottom: '#e9981a', edge: '#b8760e' },
  avorio: { top: '#ffffff', mid: '#eef0fb', bottom: '#b9bfdc', edge: '#6c7399' },
  ebano: { top: '#5b5670', mid: '#2c2838', bottom: '#14111c', edge: '#08060d' },
  rubino: { top: '#ffc2cf', mid: '#ff4d6a', bottom: '#b3123a', edge: '#6d0a24' },
  smeraldo: { top: '#c4ffe0', mid: '#2fd08a', bottom: '#0c8a55', edge: '#065a37' },
  ghiaccio: { top: '#f4fdff', mid: '#9fe3ff', bottom: '#4aa8e0', edge: '#2a6aa0' },
}

/** Colori e dettagli di ogni coach: la struttura (e quindi le espressioni) è la stessa per tutti. */
interface Species {
  body: [string, string]
  breast: [string, string]
  head: [string, string]
  wing: [string, string]
  wingStroke: string
  wingBar: string
  wingFeather: string
  tail: string
  tail2: string
  tailLine: string
  legs: string
  beak: [string, string]
  stroke: string
  headStroke: string
  /** colori degli occhi: iride, iride arrabbiata e palpebra */
  iris: string
  irisAngry: string
  lid: string
  /** quanto è grande la testa rispetto al corpo (1 = Gigi) */
  headScale: number
}

const SPECIES: Record<CoachId, Species> = {
  gigi: {
    body: ['#b9c3e8', '#7c8ac2'],
    breast: ['#f3f5ff', '#cfd6f2'],
    head: ['#d9e0fa', '#a9b4de'],
    wing: ['#8794c9', '#566199'],
    wingStroke: '#4a5590',
    wingBar: '#252e5e',
    wingFeather: '#a7b3e6',
    tail: '#56629c',
    tail2: '#2c3566',
    tailLine: '#3a4580',
    legs: '#f4785a',
    beak: ['#ffcf86', '#f08f3a'],
    stroke: '#5a669f',
    headStroke: '#7b88c0',
    iris: '#ff9a1f',
    irisAngry: '#ff6a1f',
    lid: '#a9b4de',
    headScale: 1,
  },
  gabbiano: {
    body: ['#f4f6fa', '#c4ccda'],
    breast: ['#ffffff', '#e9edf5'],
    head: ['#ffffff', '#e3e8f2'],
    wing: ['#a3b0c6', '#65738f'],
    wingStroke: '#4a5570',
    wingBar: '#1b2236',
    wingFeather: '#d3dcec',
    tail: '#a9b4c8',
    tail2: '#6b7690',
    tailLine: '#7b869f',
    legs: '#ff9a3c',
    beak: ['#ffe27a', '#f5b82e'],
    stroke: '#8a94ab',
    headStroke: '#9aa4bf',
    iris: '#ffe14a',
    irisAngry: '#ffb000',
    lid: '#e3e8f2',
    headScale: 1.1,
  },
  gufo: {
    body: ['#c79a62', '#8a5f33'],
    breast: ['#f2e2c4', '#d8c096'],
    head: ['#d9b887', '#a97c47'],
    wing: ['#9a6d3d', '#5e3d1d'],
    wingStroke: '#4a2f16',
    wingBar: '#33200f',
    wingFeather: '#c9a574',
    tail: '#7a5230',
    tail2: '#4a2f16',
    tailLine: '#3a2410',
    legs: '#e6b84a',
    beak: ['#f6c968', '#c98a1f'],
    stroke: '#6b4726',
    headStroke: '#6b4726',
    iris: '#ffb347',
    irisAngry: '#ff7a1f',
    lid: '#c79a62',
    headScale: 1.2,
  },
  gallina: {
    body: ['#fff1dc', '#e8c9a0'],
    breast: ['#fffaf0', '#f3e0c2'],
    head: ['#fff6e6', '#f0d8b4'],
    wing: ['#f1d3a1', '#c99a5a'],
    wingStroke: '#a8742f',
    wingBar: '#b9803a',
    wingFeather: '#fff1d6',
    tail: '#d9a868',
    tail2: '#a8742f',
    tailLine: '#8d5e22',
    legs: '#f2b53a',
    beak: ['#ffd870', '#f0a020'],
    stroke: '#b58a52',
    headStroke: '#c9a06a',
    iris: '#b8683a',
    irisAngry: '#d9482a',
    lid: '#f0d8b4',
    headScale: 1.12,
  },
}

/**
 * I coach (Gigi il piccione, Capitan Gabbiano, Professor Gufo, Nonna Gallina): mascotte in SVG con
 * espressioni, accessori e animazioni idle. Le animazioni sono in CSS (classi pg-*), così costano pochissimo.
 */
export function Pigeon({ mood = 'neutral', size = 96, outfit, view, coach }: { mood?: Mood; size?: number; outfit?: Outfit; view?: string; coach?: CoachId }) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  const url = (n: string) => `url(#${id(n)})`
  const app = useApp()
  const who: CoachId = coach ?? activeCoach(app.settings, app.progress)
  const S = SPECIES[who]
  // il guardaroba è di Gigi: gli altri coach hanno già il loro look
  const worn: Outfit = who === 'gigi' ? (outfit ?? app.settings.outfit ?? {}) : (outfit ?? {})

  const open = mood === 'happy' || mood === 'shocked'
  const crown = CROWN[worn.crown ?? 'oro'] ?? CROWN.oro
  const headT = S.headScale === 1 ? undefined : `translate(80 86) scale(${S.headScale}) translate(-80 -86)`
  const cheek = mood === 'happy' ? 0.7 : mood === 'sad' ? 0.15 : mood === 'smug' ? 0.55 : 0.4

  return (
    <svg key={`${who}-${mood}`} className={`pigeon mood-${mood} coach-${who}`} width={size} height={size} viewBox={view ?? '0 0 160 160'} aria-hidden="true">
      <defs>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.body[0]} />
          <stop offset="1" stopColor={S.body[1]} />
        </linearGradient>
        <linearGradient id={id('breast')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.breast[0]} />
          <stop offset="1" stopColor={S.breast[1]} />
        </linearGradient>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.head[0]} />
          <stop offset="1" stopColor={S.head[1]} />
        </linearGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.wing[0]} />
          <stop offset="1" stopColor={S.wing[1]} />
        </linearGradient>
        <linearGradient id={id('collar')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fd0a6" />
          <stop offset=".45" stopColor="#7b6ae6" />
          <stop offset="1" stopColor="#e458b8" />
        </linearGradient>
        <linearGradient id={id('beak')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={S.beak[0]} />
          <stop offset="1" stopColor={S.beak[1]} />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff0a0" />
          <stop offset=".55" stopColor="#ffcf3a" />
          <stop offset="1" stopColor="#e9981a" />
        </linearGradient>
        <linearGradient id={id('crown')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={crown.top} />
          <stop offset=".55" stopColor={crown.mid} />
          <stop offset="1" stopColor={crown.bottom} />
        </linearGradient>
        <linearGradient id={id('cape')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e8436a" />
          <stop offset="1" stopColor="#9b1744" />
        </linearGradient>
        <linearGradient id={id('comb')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ff6a7c" />
          <stop offset="1" stopColor="#d12a42" />
        </linearGradient>
        <radialGradient id={id('glow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".34" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="153" rx="38" ry="5.5" fill="#000" opacity=".28" />

      <g className="pg-all">
        {/* mantello (dietro tutto) */}
        {worn.back === 'mantello' && (
          <path d="M46 80 C16 104 14 140 28 152 L132 152 C146 140 144 104 114 80 Z" fill={url('cape')} stroke="#7a1138" strokeWidth="1.5" />
        )}

        {worn.back === 'fate' && <FairyWings />}
        {worn.back === 'zainetto' && (
          <g>
            <rect x="18" y="86" width="124" height="54" rx="18" fill="#e8436a" stroke="#9b1744" strokeWidth="1.6" />
            <rect x="22" y="112" width="30" height="20" rx="7" fill="#c92f58" />
            <rect x="108" y="112" width="30" height="20" rx="7" fill="#c92f58" />
          </g>
        )}

        {/* coda: si intravede a destra, sotto il corpo (la gallina ha un pennacchio all'insù) */}
        {who === 'gallina' ? (
          <g>
            <path d="M104 126 Q128 84 146 90 Q152 108 128 134 Z" fill={S.tail} />
            <path d="M108 130 Q140 96 156 110 Q154 128 124 142 Z" fill={S.tail2} />
            <path d="M100 136 Q130 118 152 136 Q142 150 108 148 Z" fill={S.tail} />
            <path d="M118 124 Q134 104 144 100 M122 134 Q142 118 150 118" stroke={S.tailLine} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
          </g>
        ) : (
          <g>
            <path d="M98 114 Q128 108 151 124 Q158 136 146 147 Q120 151 94 145 Z" fill={S.tail} />
            <path d="M137 119 Q153 128 151 139 Q149 145 143 148 Q150 134 137 119 Z" fill={S.tail2} />
            <path d="M108 124 Q124 124 138 132 M106 134 Q122 135 134 141" stroke={S.tailLine} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
          </g>
        )}

        {/* zampe */}
        <g stroke={S.legs} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M66 140 V149 M59 152 L66 149 L73 152" />
          <path d="M94 140 V149 M87 152 L94 149 L101 152" />
        </g>

        <g className="pg-body">
          {/* corpo a pera: spalle strette, petto in fuori */}
          <path
            d="M63 70 C42 76 28 98 30 122 C32 142 54 149 80 149 C106 149 128 142 130 122 C132 98 118 76 97 70 Z"
            fill={url('body')}
            stroke={S.stroke}
            strokeOpacity=".35"
            strokeWidth="1.5"
          />
          {/* petto chiaro con piumette */}
          <path d="M80 86 C58 88 44 106 47 126 C50 142 66 146 80 146 C94 146 110 142 113 126 C116 106 102 88 80 86 Z" fill={url('breast')} />
          <ellipse cx="68" cy="108" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-25 68 108)" />

          {/* il gufo ha il petto a pallini */}
          {who === 'gufo' && (
            <g stroke="#a97c47" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".8">
              <path d="M66 112 q3 3 6 0 M82 108 q3 3 6 0 M96 114 q3 3 6 0 M60 126 q3 3 6 0 M76 124 q3 3 6 0 M92 128 q3 3 6 0 M70 138 q3 3 6 0 M86 140 q3 3 6 0" />
            </g>
          )}
          {/* la nonna ha il grembiule a quadretti */}
          {who === 'gallina' && (
            <g>
              <path d="M62 102 L58 84 M98 102 L102 84" stroke="#ff9fbd" strokeWidth="5" strokeLinecap="round" />
              <path d="M60 102 H100 L110 147 Q80 152 50 147 Z" fill="#ff9fbd" stroke="#e8648f" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="M60 114 H105 M56 126 H108 M53 138 H110 M72 102 L66 148 M88 102 L94 148" stroke="#fff" strokeWidth="1.8" opacity=".55" />
              <rect x="68" y="122" width="24" height="14" rx="4" fill="#ffd0de" stroke="#e8648f" strokeWidth="1.2" />
            </g>
          )}

          {/* ali richiuse sui fianchi */}
          <g className="pg-wing-l">
            <path d="M42 90 C24 106 24 136 40 150 C54 144 62 120 58 98 Z" fill={url('wing')} stroke={S.wingStroke} strokeOpacity=".5" strokeWidth="1.2" />
            <path d="M31 118 L50 111 M33 129 L52 122" stroke={S.wingBar} strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M35 104 q5 4 10 -1 M35 140 q5 3 10 -2" stroke={S.wingFeather} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>
          <g className="pg-wing-r">
            <path d="M118 90 C136 106 136 136 120 150 C106 144 98 120 102 98 Z" fill={url('wing')} stroke={S.wingStroke} strokeOpacity=".5" strokeWidth="1.2" />
            <path d="M129 118 L110 111 M127 129 L108 122" stroke={S.wingBar} strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M125 104 q-5 4 -10 -1 M125 140 q-5 3 -10 -2" stroke={S.wingFeather} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>

          {/* collo cangiante (solo il piccione), bordo a piume */}
          {who === 'gigi' && (
            <>
              <path
                d="M48 80 Q80 64 112 80 C114 90 108 97 100 98 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 C52 97 46 90 48 80 Z"
                fill={url('collar')}
              />
              <path d="M58 82 Q80 72 102 82" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".4" />
            </>
          )}

          {/* testa: più o meno grande a seconda del coach */}
          <g transform={headT}>
            {/* ciuffi del gufo, dietro la testa */}
            {who === 'gufo' && (
              <g fill={S.body[1]} stroke={S.stroke} strokeWidth="1.4" strokeLinejoin="round">
                <path d="M54 40 L46 12 L70 32 Z" />
                <path d="M106 40 L114 12 L90 32 Z" />
              </g>
            )}
            <ellipse cx="80" cy="57" rx="28" ry="27" fill={url('head')} stroke={S.headStroke} strokeOpacity=".35" strokeWidth="1.5" />
            <ellipse cx="68" cy="40" rx="13" ry="7" fill={url('glow')} />
            {/* disco facciale del gufo */}
            {who === 'gufo' && (
              <g fill="#f6e8cc" opacity=".95">
                <circle cx="67" cy="55" r="14" />
                <circle cx="93" cy="55" r="14" />
              </g>
            )}
            <circle cx="56" cy="67" r="5.5" fill="#ff8fb4" opacity={cheek} />
            <circle cx="104" cy="67" r="5.5" fill="#ff8fb4" opacity={cheek} />
            {who === 'gabbiano' && <circle cx="52" cy="70" r="3.4" fill="none" stroke="#ffcf3a" strokeWidth="1.8" />}

            {/* occhi */}
            <Eyes mood={mood} p={S} />
            {worn.face && who === 'gigi' && mood !== 'cool' && <FaceItem item={worn.face} />}
            {who === 'gufo' && mood !== 'cool' && <FaceItem item="tondi" />}

            {/* bargigli della gallina */}
            {who === 'gallina' && <path d="M75 76 Q80 98 85 76 Z" fill={url('comb')} stroke="#a3162b" strokeWidth="1.2" strokeLinejoin="round" />}

            {/* becco (il piccione ha la cera bianca in cima, il gabbiano la macchia rossa) */}
            {open ? (
              <>
                <path d="M70 66 Q80 59 90 66 Q89 74 80 76 Q71 74 70 66 Z" fill={url('beak')} />
                <path d="M72 75 Q80 92 88 75 Z" fill="#7a1f2e" />
                <path d="M75 77 Q80 87 85 77 Q80 81 75 77 Z" fill="#f06a7e" />
                {who === 'gigi' && <path d="M75.5 61.5 Q80 57.5 84.5 61.5 Q83.5 65 80 65.5 Q76.5 65 75.5 61.5 Z" fill="#efe7ff" />}
                {who === 'gabbiano' && <circle cx="86" cy="72" r="2.2" fill="#e8312a" />}
              </>
            ) : (
              <>
                <path d="M70 66 Q80 59 90 66 Q89 78 80 81 Q71 78 70 66 Z" fill={url('beak')} />
                <path d="M74 73 Q80 75.5 86 73" stroke="#b9601a" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".6" />
                {who === 'gigi' && <path d="M75.5 61.5 Q80 57.5 84.5 61.5 Q83.5 65 80 65.5 Q76.5 65 75.5 61.5 Z" fill="#efe7ff" />}
                {who === 'gabbiano' && <circle cx="85" cy="76" r="2.3" fill="#e8312a" />}
              </>
            )}
            {mood === 'cool' && <path d="M73 77 Q82 81 90 73" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            {mood === 'angry' && <path d="M73 79 Q80 75 87 79" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            {mood === 'sad' && <path className="pg-lip" d="M73 80 Q80 75.5 87 80" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            {mood === 'confused' && <path d="M72 77 q3.5 -3.6 7 0 t7 0" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            {mood === 'thinking' && <path d="M75 76 Q82 74 91 77" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
            {mood === 'smug' && (
              <g stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round">
                <path d="M73 77 Q82 82 91 73" />
                <path d="M91 73 q2 -.5 3 -2.6" />
              </g>
            )}
            {mood === 'sleepy' && <circle className="pg-snot" cx="90.5" cy="74" r="4.6" fill="#cfeaff" stroke="#fff" strokeWidth="1.4" opacity=".9" />}
          </g>

          {/* accessori del collo: quelli di Gigi dal guardaroba, per gli altri il loro segno distintivo */}
          {who === 'gigi' && worn.neck && <NeckItem item={worn.neck} />}
          {who === 'gabbiano' && <Bandana />}
          {who === 'gufo' && <BowTie />}
          {who === 'gallina' && <Pearls />}
          {worn.back === 'zainetto' && (
            <g fill="none" strokeLinecap="round">
              <path d="M58 84 Q52 112 55 138" stroke="#9b1744" strokeWidth="6" />
              <path d="M102 84 Q108 112 105 138" stroke="#9b1744" strokeWidth="6" />
              <rect x="50" y="110" width="9" height="7" rx="2" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1.2" />
              <rect x="101" y="110" width="9" height="7" rx="2" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1.2" />
            </g>
          )}
        </g>

        {who === 'gigi' && worn.extra && <ExtraItem item={worn.extra} gold={url('gold')} />}

        {/* copricapo: Gigi ha la corona da regina (stretta e alta, come il pezzo degli scacchi) */}
        <g transform={headT}>
          {who === 'gigi' && (
            <g className="pg-crown">
              <g transform="rotate(-4 80 34) translate(0 1)">
                <path
                  d="M65 35 L61 13 L66 27 L70 7 L75.5 26 L80 1 L84.5 26 L90 7 L94 27 L99 13 L95 35 Z"
                  fill={url('crown')}
                  stroke={crown.edge}
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path d="M63 33 Q80 39 97 33 L96.5 40 Q80 46 63.5 40 Z" fill={url('crown')} stroke={crown.edge} strokeWidth="1.6" strokeLinejoin="round" />
                <g fill={url('crown')} stroke={crown.edge} strokeWidth="1.3">
                  <circle cx="61" cy="11.5" r="2.9" />
                  <circle cx="70" cy="5.5" r="2.9" />
                  <circle cx="80" cy="-.5" r="3.4" />
                  <circle cx="90" cy="5.5" r="2.9" />
                  <circle cx="99" cy="11.5" r="2.9" />
                </g>
                <circle cx="79" cy="-1.6" r="1" fill="#fff" opacity=".9" />
                <circle cx="80" cy="37.5" r="2.8" fill="#ff4d6a" stroke="#fff" strokeWidth="1" />
                <circle cx="70" cy="36.5" r="1.7" fill="#3fe0d0" />
                <circle cx="90" cy="36.5" r="1.7" fill="#3fe0d0" />
              </g>
            </g>
          )}
          {who === 'gabbiano' && (
            <g className="pg-crown" strokeLinejoin="round">
              <path d="M44 42 Q48 24 62 24 Q70 10 80 10 Q90 10 98 24 Q112 24 116 42 Q80 30 44 42 Z" fill="#232338" stroke="#0b0b14" strokeWidth="1.8" />
              <path d="M44 42 Q80 30 116 42" fill="none" stroke="#ffcf3a" strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="80" cy="22" r="5" fill="#fff" />
              <path d="M77 26 V28.5 H83 V26" fill="#fff" />
              <circle cx="78" cy="21.5" r="1.3" fill="#232338" />
              <circle cx="82" cy="21.5" r="1.3" fill="#232338" />
              <path d="M70 34 L90 30 M70 30 L90 34" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M50 30 Q34 20 38 6 Q48 14 58 26 Z" fill="#e8436a" stroke="#a3162b" strokeWidth="1.2" />
            </g>
          )}
          {who === 'gufo' && (
            <g className="pg-crown" strokeLinejoin="round">
              <path d="M60 32 H100 V42 Q80 49 60 42 Z" fill="#232a5a" stroke="#141a3c" strokeWidth="1.4" />
              <path d="M38 26 L80 8 L122 26 L80 42 Z" fill="#2c3570" stroke="#141a3c" strokeWidth="1.6" />
              <path d="M80 8 L122 26 L80 42 Z" fill="#fff" opacity=".07" />
              <circle cx="80" cy="25" r="2.8" fill="#ffcf3a" />
              <path d="M80 25 L116 30 V46" stroke="#ffcf3a" strokeWidth="2" fill="none" strokeLinecap="round" />
              <rect x="112.5" y="44" width="7" height="12" rx="2.4" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1" />
            </g>
          )}
          {who === 'gallina' && (
            <g className="pg-crown" strokeLinejoin="round">
              <path d="M62 38 C54 22 66 12 73 24 C73 6 91 6 89 24 C98 12 108 22 98 38 Z" fill={url('comb')} stroke="#a3162b" strokeWidth="1.7" />
              <path d="M70 26 q2 -6 6 -4 M86 26 q2 -5 5 -3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5" />
            </g>
          )}
        </g>

        {/* extra d'umore */}
        {mood === 'happy' && (
          <g className="pg-sparkles" fill="#ffe681">
            <path className="pg-sp s1" d="M18 44 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
            <path className="pg-sp s2" d="M140 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" />
            <path className="pg-sp s3" d="M142 76 l2 4.5 l4.5 2 l-4.5 2 l-2 4.5 l-2 -4.5 l-4.5 -2 l4.5 -2 z" />
          </g>
        )}
        {mood === 'angry' && (
          <g className="pg-steam" fill="#fff" opacity=".85">
            <circle className="st1" cx="30" cy="44" r="5" />
            <circle className="st2" cx="130" cy="42" r="5" />
            <path d="M122 24 l8 -6 M126 32 l10 -2 M122 16 l3 -9" stroke="#ff4d5e" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}
        {mood === 'shocked' && (
          <path className="pg-sweat" d="M124 46 C128 54 132 58 128 64 C124 68 118 64 120 58 C121 54 123 51 124 46 Z" fill="#7fd6ff" stroke="#fff" strokeWidth="1.5" />
        )}
        {mood === 'confused' && (
          <g fontFamily="'Fredoka Variable', sans-serif" fontWeight="700" fill="#ffe681" stroke="#2a1230" strokeWidth="1.6" strokeLinejoin="round" paintOrder="stroke">
            <text className="pg-q q1" x="112" y="38" fontSize="34">?</text>
            <text className="pg-q q2" x="22" y="52" fontSize="24">?</text>
            <text className="pg-q q3" x="134" y="72" fontSize="17">?</text>
          </g>
        )}
        {mood === 'sleepy' && (
          <g fontFamily="'Fredoka Variable', sans-serif" fontWeight="700" fill="#d9e8ff" stroke="#2a1230" strokeWidth="1.4" strokeLinejoin="round" paintOrder="stroke">
            <text className="pg-z z1" x="108" y="40" fontSize="24">z</text>
            <text className="pg-z z2" x="122" y="26" fontSize="19">z</text>
            <text className="pg-z z3" x="134" y="14" fontSize="15">Z</text>
          </g>
        )}
        {mood === 'sad' && (
          <g fill="#7fd6ff" stroke="#fff" strokeWidth="1.5">
            <path className="pg-tear t1" d="M58 66 C61 71 63 74 60 77 C57 79 54 76 55 73 C56 70 57 68 58 66 Z" />
            <path className="pg-tear t2" d="M102 66 C105 71 107 74 104 77 C101 79 98 76 99 73 C100 70 101 68 102 66 Z" />
          </g>
        )}
        {mood === 'thinking' && (
          <g className="pg-think">
            <circle cx="114" cy="48" r="2.6" fill="#fff" stroke="#9aa6dd" strokeWidth="1" />
            <circle cx="122" cy="38" r="4" fill="#fff" stroke="#9aa6dd" strokeWidth="1" />
            <ellipse cx="139" cy="22" rx="18" ry="12.5" fill="#fff" stroke="#9aa6dd" strokeWidth="1.3" />
            <g fill="#7a4de8">
              <circle className="pg-dot d1" cx="131" cy="22" r="2.4" />
              <circle className="pg-dot d2" cx="139" cy="22" r="2.4" />
              <circle className="pg-dot d3" cx="147" cy="22" r="2.4" />
            </g>
          </g>
        )}
        {mood === 'smug' && (
          <path className="pg-glint" d="M104 50 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 z" fill="#fff" opacity=".95" />
        )}
      </g>
    </svg>
  )
}

function Eyes({ mood, p }: { mood: Mood; p: { iris: string; irisAngry: string; lid: string } }) {
  const eyes = [67, 93]
  if (mood === 'cool') {
    return (
      <g>
        <path d="M53 47 H79 V57 Q79 69 66 69 Q53 69 53 57 Z" fill="#14091f" />
        <path d="M81 47 H107 V57 Q107 69 94 69 Q81 69 81 57 Z" fill="#14091f" />
        <path d="M77 50 H83" stroke="#14091f" strokeWidth="3" strokeLinecap="round" />
        <path d="M58 52 L66 52 M86 52 L94 52" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
        <path d="M58 57 L62 57 M86 57 L90 57" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      </g>
    )
  }
  if (mood === 'happy') {
    return (
      <g stroke="#2a1230" strokeWidth="4.2" strokeLinecap="round" fill="none">
        <path d="M58 58 Q67 46 76 58" />
        <path d="M84 58 Q93 46 102 58" />
      </g>
    )
  }
  if (mood === 'sleepy') {
    return (
      <g stroke="#2a1230" strokeWidth="4.2" strokeLinecap="round" fill="none">
        <path d="M58 56 Q67 64 76 56" />
        <path d="M84 56 Q93 64 102 56" />
        <path d="M56 59 l-3 2.5 M60 61 l-1.5 3.5 M104 59 l3 2.5 M100 61 l1.5 3.5" strokeWidth="2.2" opacity=".7" />
      </g>
    )
  }
  if (mood === 'confused') {
    return (
      <g>
        <g className="pg-eye">
          <circle cx="67" cy="55" r="10.5" fill="#fff" />
          <circle cx="70" cy="56" r="6.6" fill={p.iris} />
          <circle cx="71" cy="56" r="3.4" fill="#2a1230" />
          <circle cx="73" cy="53.5" r="2" fill="#fff" />
        </g>
        <g className="pg-eye">
          <circle cx="93" cy="57" r="7.6" fill="#fff" />
          <circle cx="91" cy="58" r="4.8" fill={p.iris} />
          <circle cx="90.6" cy="58" r="2.4" fill="#2a1230" />
          <circle cx="92" cy="56.2" r="1.5" fill="#fff" />
        </g>
        <g stroke="#2a1230" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M56 37 Q67 29 78 35" />
          <path d="M84 49 L102 42" />
        </g>
      </g>
    )
  }
  if (mood === 'sad') {
    return (
      <g>
        {eyes.map((cx) => (
          <g key={cx} className="pg-eye">
            <circle cx={cx} cy={56} r="10" fill="#fff" />
            <circle cx={cx} cy={58} r="7.4" fill={p.iris} />
            <circle cx={cx} cy={58} r="4.2" fill="#2a1230" />
            <circle cx={cx + 2.6} cy={55} r="2.8" fill="#fff" />
            <circle cx={cx - 2.4} cy={61} r="1.3" fill="#fff" opacity=".85" />
          </g>
        ))}
        <g stroke="#2a1230" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M55 46 Q66 42 77 35" />
          <path d="M105 46 Q94 42 83 35" />
        </g>
      </g>
    )
  }
  if (mood === 'thinking') {
    return (
      <g>
        {eyes.map((cx) => (
          <g key={cx} className="pg-eye">
            <circle cx={cx} cy={55} r="9.5" fill="#fff" />
            <circle cx={cx + 3.2} cy={52} r="6.2" fill={p.iris} />
            <circle cx={cx + 3.8} cy={51.4} r="3" fill="#2a1230" />
            <circle cx={cx + 5.2} cy={49.6} r="1.8" fill="#fff" />
          </g>
        ))}
        <g stroke="#2a1230" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M57 43 Q66 41 76 43" />
          <path d="M84 39 Q93 31 104 38" />
        </g>
      </g>
    )
  }
  if (mood === 'smug') {
    return (
      <g>
        {eyes.map((cx) => (
          <g key={cx}>
            <circle cx={cx} cy={55} r="9.5" fill="#fff" />
            <circle cx={cx + 2} cy={57} r="6.2" fill={p.iris} />
            <circle cx={cx + 2} cy={57} r="3.3" fill="#2a1230" />
            <circle cx={cx + 3.4} cy={55} r="1.5" fill="#fff" />
            <path d={`M${cx - 10.5} 55.5 A10.5 10.5 0 0 1 ${cx + 10.5} 55.5 Z`} fill={p.lid} />
            <path d={`M${cx - 10.5} 55.5 H${cx + 10.5}`} stroke="#2a1230" strokeWidth="3.2" strokeLinecap="round" />
          </g>
        ))}
        <g stroke="#2a1230" strokeWidth="3.2" strokeLinecap="round" fill="none">
          <path d="M57 43 L76 45" />
          <path d="M84 41 Q94 33 104 39" />
        </g>
      </g>
    )
  }
  const big = mood === 'shocked'
  const r = big ? 11.5 : 9.5
  const iris = big ? 6.4 : 6.6
  const pupil = big ? 2.4 : 3.6
  const cy = 55
  return (
    <g>
      {eyes.map((cx) => (
        <g key={cx} className="pg-eye">
          <circle cx={cx} cy={cy} r={r} fill="#fff" />
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={iris} fill={mood === 'angry' ? p.irisAngry : p.iris} />
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={pupil} fill="#2a1230" />
          <circle cx={cx + 2.4} cy={cy - 2} r="2" fill="#fff" />
          <circle cx={cx - 2} cy={cy + 4} r="1" fill="#fff" opacity=".8" />
        </g>
      ))}
      {mood === 'angry' && (
        <g>
          <path d="M54 43 L76 52 L76 43 Z" fill={p.lid} />
          <path d="M106 43 L84 52 L84 43 Z" fill={p.lid} />
          <path d="M54 44 L76 53 M106 44 L84 53" stroke="#2a1230" strokeWidth="4.2" strokeLinecap="round" />
        </g>
      )}
      {mood === 'shocked' && (
        <g stroke="#2a1230" strokeWidth="3.4" strokeLinecap="round" fill="none">
          <path d="M57 36 Q67 31 76 36" />
          <path d="M84 36 Q93 31 103 36" />
        </g>
      )}
      {mood === 'neutral' && (
        <g stroke="#2a1230" strokeWidth="3" strokeLinecap="round" fill="none" opacity=".7">
          <path d="M58 41 Q67 37 76 41" />
          <path d="M84 41 Q93 37 102 41" />
        </g>
      )}
    </g>
  )
}

/** punti di una stella a 5 punte */
function starPath(cx: number, cy: number, R: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const rad = i % 2 === 0 ? R : r
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(1)} ${(cy + rad * Math.sin(a)).toFixed(1)}`)
  }
  return `M${pts.join(' L')} Z`
}

function FairyWings() {
  return (
    <g className="pg-fairy" stroke="#7bd4f0" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M52 92 C8 74 -6 32 24 22 C46 18 54 58 58 86 Z" fill="#c9f6ff" fillOpacity=".78" />
      <path d="M54 102 C18 100 4 132 28 140 C46 144 56 120 60 106 Z" fill="#e6d4ff" fillOpacity=".78" />
      <path d="M108 92 C152 74 166 32 136 22 C114 18 106 58 102 86 Z" fill="#c9f6ff" fillOpacity=".78" />
      <path d="M106 102 C142 100 156 132 132 140 C114 144 104 120 100 106 Z" fill="#e6d4ff" fillOpacity=".78" />
      <g fill="none" stroke="#fff" strokeWidth="1.4" opacity=".7">
        <path d="M50 84 C32 62 22 44 22 30 M50 108 C36 116 26 128 28 136" />
        <path d="M110 84 C128 62 138 44 138 30 M110 108 C124 116 134 128 132 136" />
      </g>
    </g>
  )
}

function ExtraItem({ item, gold }: { item: string; gold: string }) {
  if (item === 'caffe') {
    return (
      <g>
        <g className="pg-steam-c" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".85">
          <path d="M22 120 q-4 -5 0 -10 q4 -5 0 -10" />
          <path d="M33 120 q-4 -5 0 -10 q4 -5 0 -10" />
        </g>
        <path d="M40 130 Q52 130 50 141 Q47 148 38 145" fill="none" stroke="#c9d0ee" strokeWidth="3.4" strokeLinecap="round" />
        <path d="M14 124 H42 L38 148 Q28 153 18 148 Z" fill="#fff" stroke="#9aa6dd" strokeWidth="1.8" strokeLinejoin="round" />
        <ellipse cx="28" cy="125" rx="13" ry="3" fill="#6b3d1e" />
        <path d="M18 134 H38" stroke="#ff4d8d" strokeWidth="3" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'briciola') {
    return (
      <g strokeLinejoin="round">
        <path d="M10 146 C6 130 20 120 34 122 C48 124 52 136 46 148 Z" fill="#e8b76b" stroke="#a8691e" strokeWidth="1.8" />
        <path d="M15 141 C14 132 23 127 32 129" fill="none" stroke="#fff3cf" strokeWidth="2.4" strokeLinecap="round" opacity=".8" />
        <g fill="#a8691e">
          <circle cx="26" cy="138" r="1.5" />
          <circle cx="36" cy="134" r="1.5" />
          <circle cx="32" cy="143" r="1.5" />
        </g>
        <g fill="#e8b76b" stroke="#a8691e" strokeWidth="1">
          <circle cx="52" cy="150" r="2.2" />
          <circle cx="58" cy="146" r="1.6" />
        </g>
      </g>
    )
  }
  if (item === 'bandierina') {
    const sq = [0, 1, 2].flatMap((c) => [0, 1].map((r) => ({ c, r })))
    return (
      <g>
        <path d="M20 150 V92" stroke="#8c97b0" strokeWidth="3.4" strokeLinecap="round" />
        {sq.map(({ c, r }) => (
          <rect key={`${c}${r}`} x={21.5 + c * 9} y={94 + r * 9} width="9" height="9" fill={(c + r) % 2 ? '#1b1033' : '#fff'} />
        ))}
        <rect x="21.5" y="94" width="27" height="18" fill="none" stroke="#8c97b0" strokeWidth="1.4" />
        <circle cx="20" cy="91" r="3.2" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1" />
      </g>
    )
  }
  if (item === 'trofeo') {
    return (
      <g strokeLinejoin="round">
        <path d="M18 118 H44 V128 C44 138 38 142 31 142 C24 142 18 138 18 128 Z" fill={gold} stroke="#b8760e" strokeWidth="1.8" />
        <path d="M18 122 H11 C9 132 15 137 20 136 M44 122 H51 C53 132 47 137 42 136" fill="none" stroke="#e9981a" strokeWidth="3.2" strokeLinecap="round" />
        <rect x="28" y="142" width="6" height="6" fill="#e9981a" />
        <rect x="20" y="148" width="22" height="5" rx="2" fill="#b8760e" />
        <path d="M31 123 l1.8 3.8 4 .5 -3 2.8 .8 4 -3.6 -2 -3.6 2 .8 -4 -3 -2.8 4 -.5 z" fill="#fff6c8" />
      </g>
    )
  }
  return null
}

function FaceItem({ item }: { item: string }) {
  if (item === 'stella') {
    return (
      <g strokeLinejoin="round">
        <path d={starPath(67, 55, 15, 7)} fill="#ff4d8d" fillOpacity=".38" stroke="#c9254a" strokeWidth="2.4" />
        <path d={starPath(93, 55, 15, 7)} fill="#ff4d8d" fillOpacity=".38" stroke="#c9254a" strokeWidth="2.4" />
        <path d="M80 54 Q80 51.5 80 54" stroke="#c9254a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        <path d="M52 52 L47 49 M108 52 L113 49" stroke="#c9254a" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'tondi') {
    return (
      <g fill="#fff" fillOpacity=".12" stroke="#2f2150" strokeWidth="2.6">
        <circle cx="67" cy="55" r="12.5" />
        <circle cx="93" cy="55" r="12.5" />
        <path d="M79.5 54 Q80 51.5 80.5 54" fill="none" />
        <path d="M54.5 53 L49 50 M105.5 53 L111 50" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'monocolo') {
    return (
      <g fill="none" strokeLinecap="round">
        <circle cx="93" cy="55" r="13" stroke="#e9a91c" strokeWidth="2.8" fill="#fff" fillOpacity=".14" />
        <path d="M103 64 C112 76 108 92 100 104" stroke="#e9a91c" strokeWidth="1.8" strokeDasharray="2.5 2.5" />
        <path d="M86 47 q3 -3 7 -3" stroke="#fff" strokeWidth="1.8" opacity=".8" />
      </g>
    )
  }
  return null
}

function NeckItem({ item }: { item: string }) {
  if (item === 'cravatta') {
    return (
      <g strokeLinejoin="round">
        <path d="M72 94 H88 L84 103 H76 Z" fill="#e8436a" stroke="#9b1744" strokeWidth="1.3" />
        <path d="M76 103 H84 L90 130 L80 138 L70 130 Z" fill="#e8436a" stroke="#9b1744" strokeWidth="1.3" />
        <path d="M74 112 L86 118 M73 121 L87 127" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".55" />
      </g>
    )
  }
  if (item === 'briciole') {
    const beads = [50, 56, 63, 70, 77, 83, 90, 97, 104, 110]
    return (
      <g>
        <path d="M48 86 Q80 112 112 86" fill="none" stroke="#a8691e" strokeWidth="1.3" />
        {beads.map((x, i) => {
          const t = (x - 48) / 64
          const y = 86 + 4 * 13 * t * (1 - t)
          return <circle key={i} cx={x} cy={y} r="3.4" fill="#f3d9a3" stroke="#c99b5a" strokeWidth="1.2" />
        })}
        <path d="M71 111 C70 105 77 103 82 105 C88 104 91 110 88 115 C84 120 74 119 71 111 Z" fill="#e8b76b" stroke="#a8691e" strokeWidth="1.5" />
        <circle cx="79" cy="111" r="1.2" fill="#a8691e" />
        <circle cx="84" cy="113" r="1.2" fill="#a8691e" />
      </g>
    )
  }
  if (item === 'papillon') {
    return (
      <g>
        <path d="M80 92 L62 82 Q58 92 62 102 Z" fill="#ff4d8d" stroke="#b81f5a" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M80 92 L98 82 Q102 92 98 102 Z" fill="#ff4d8d" stroke="#b81f5a" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="80" cy="92" r="5" fill="#e0306f" stroke="#b81f5a" strokeWidth="1.3" />
        <g fill="#fff" opacity=".8">
          <circle cx="68" cy="91" r="1.4" />
          <circle cx="92" cy="91" r="1.4" />
        </g>
      </g>
    )
  }
  if (item === 'sciarpa') {
    return (
      <g strokeLinejoin="round">
        <path d="M46 86 Q80 104 114 86 L112 98 Q80 114 48 98 Z" fill="#ffcf3a" stroke="#c98512" strokeWidth="1.3" />
        <path d="M56 91 L55 102 M70 95 L69 106 M84 96 L84 107 M98 95 L99 106 M110 90 L112 100" stroke="#ff4d6a" strokeWidth="4" strokeLinecap="round" />
        <path d="M96 102 L108 128 L96 132 L88 108 Z" fill="#ffcf3a" stroke="#c98512" strokeWidth="1.3" />
        <path d="M91 114 L102 111 M94 122 L105 119" stroke="#ff4d6a" strokeWidth="4" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'medaglia') {
    return (
      <g strokeLinejoin="round">
        <path d="M62 84 L80 112 L98 84" fill="none" stroke="#e8436a" strokeWidth="6" strokeLinecap="round" />
        <circle cx="80" cy="116" r="12" fill="#ffcf3a" stroke="#b8760e" strokeWidth="2" />
        <circle cx="80" cy="116" r="8" fill="none" stroke="#e9981a" strokeWidth="1.4" />
        <path d="M80 110 l1.9 4 4.3 .5 -3.2 2.9 .9 4.3 -3.9 -2.2 -3.9 2.2 .9 -4.3 -3.2 -2.9 4.3 -.5 z" fill="#b8760e" />
      </g>
    )
  }
  return null
}

/** Il segno distintivo di Capitan Gabbiano: fazzoletto rosso da pirata. */
function Bandana() {
  return (
    <g strokeLinejoin="round">
      <path d="M50 84 Q80 98 110 84 L102 102 Q80 112 58 102 Z" fill="#e8344a" stroke="#a3162b" strokeWidth="1.4" />
      <path d="M80 106 L70 124 L90 124 Z" fill="#e8344a" stroke="#a3162b" strokeWidth="1.4" />
      <g fill="#fff" opacity=".9">
        <circle cx="62" cy="93" r="1.8" />
        <circle cx="72" cy="99" r="1.8" />
        <circle cx="88" cy="99" r="1.8" />
        <circle cx="98" cy="93" r="1.8" />
        <circle cx="80" cy="113" r="1.6" />
      </g>
    </g>
  )
}

/** Il papillon bordeaux del Professor Gufo. */
function BowTie() {
  return (
    <g strokeLinejoin="round">
      <path d="M80 92 L62 82 Q58 92 62 102 Z" fill="#8a2f4a" stroke="#4d1228" strokeWidth="1.3" />
      <path d="M80 92 L98 82 Q102 92 98 102 Z" fill="#8a2f4a" stroke="#4d1228" strokeWidth="1.3" />
      <circle cx="80" cy="92" r="5" fill="#6b2038" stroke="#4d1228" strokeWidth="1.3" />
      <circle cx="80" cy="92" r="1.8" fill="#ffcf3a" />
    </g>
  )
}

/** La collana di perle di Nonna Gallina. */
function Pearls() {
  const beads = [48, 54, 61, 69, 77, 83, 91, 99, 106, 112]
  return (
    <g>
      <path d="M46 86 Q80 114 114 86" fill="none" stroke="#d8c7ad" strokeWidth="1.2" />
      {beads.map((x, i) => {
        const t = (x - 46) / 68
        const y = 86 + 4 * 14 * t * (1 - t)
        return <circle key={i} cx={x} cy={y} r="3.4" fill="#fffdf6" stroke="#cdbb9c" strokeWidth="1" />
      })}
    </g>
  )
}
