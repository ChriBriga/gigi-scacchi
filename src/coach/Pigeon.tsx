import { useId } from 'react'
import type { Mood } from './lines'
import { useApp } from '../store'
import type { Outfit } from './outfits'

const CROWN: Record<string, { top: string; mid: string; bottom: string; edge: string }> = {
  oro: { top: '#fff0a0', mid: '#ffcf3a', bottom: '#e9981a', edge: '#b8760e' },
  avorio: { top: '#ffffff', mid: '#eef0fb', bottom: '#b9bfdc', edge: '#6c7399' },
  ebano: { top: '#5b5670', mid: '#2c2838', bottom: '#14111c', edge: '#08060d' },
}

/**
 * Gigi il piccione: mascotte in SVG con espressioni, accessori e animazioni idle.
 * Tutte le animazioni sono in CSS (classi pg-*), così costano pochissimo.
 */
export function Pigeon({ mood = 'neutral', size = 96, outfit }: { mood?: Mood; size?: number; outfit?: Outfit }) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  const url = (n: string) => `url(#${id(n)})`
  const stored = useApp().settings.outfit
  const worn = outfit ?? stored ?? {}

  const open = mood === 'happy' || mood === 'shocked'
  const crown = CROWN[worn.crown ?? 'oro'] ?? CROWN.oro

  return (
    <svg key={mood} className={`pigeon mood-${mood}`} width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#b9c3e8" />
          <stop offset="1" stopColor="#7c8ac2" />
        </linearGradient>
        <linearGradient id={id('breast')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3f5ff" />
          <stop offset="1" stopColor="#cfd6f2" />
        </linearGradient>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d9e0fa" />
          <stop offset="1" stopColor="#a9b4de" />
        </linearGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8794c9" />
          <stop offset="1" stopColor="#566199" />
        </linearGradient>
        <linearGradient id={id('collar')} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2fd0a6" />
          <stop offset=".45" stopColor="#7b6ae6" />
          <stop offset="1" stopColor="#e458b8" />
        </linearGradient>
        <linearGradient id={id('beak')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffcf86" />
          <stop offset="1" stopColor="#f08f3a" />
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

        {/* coda: si intravede a destra, sotto il corpo */}
        <path d="M98 114 Q128 108 151 124 Q158 136 146 147 Q120 151 94 145 Z" fill="#56629c" />
        <path d="M137 119 Q153 128 151 139 Q149 145 143 148 Q150 134 137 119 Z" fill="#2c3566" />
        <path d="M108 124 Q124 124 138 132 M106 134 Q122 135 134 141" stroke="#3a4580" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />

        {/* zampe */}
        <g stroke="#f4785a" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M66 140 V149 M59 152 L66 149 L73 152" />
          <path d="M94 140 V149 M87 152 L94 149 L101 152" />
        </g>

        <g className="pg-body">
          {/* corpo a pera: spalle strette, petto in fuori */}
          <path
            d="M63 70 C42 76 28 98 30 122 C32 142 54 149 80 149 C106 149 128 142 130 122 C132 98 118 76 97 70 Z"
            fill={url('body')}
            stroke="#5a669f"
            strokeOpacity=".35"
            strokeWidth="1.5"
          />
          {/* petto chiaro con piumette */}
          <path d="M80 86 C58 88 44 106 47 126 C50 142 66 146 80 146 C94 146 110 142 113 126 C116 106 102 88 80 86 Z" fill={url('breast')} />
          <ellipse cx="68" cy="108" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-25 68 108)" />

          {/* ali richiuse sui fianchi */}
          <g className="pg-wing-l">
            <path d="M42 90 C24 106 24 136 40 150 C54 144 62 120 58 98 Z" fill={url('wing')} stroke="#4a5590" strokeOpacity=".5" strokeWidth="1.2" />
            <path d="M31 118 L50 111 M33 129 L52 122" stroke="#252e5e" strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M35 104 q5 4 10 -1 M35 140 q5 3 10 -2" stroke="#a7b3e6" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>
          <g className="pg-wing-r">
            <path d="M118 90 C136 106 136 136 120 150 C106 144 98 120 102 98 Z" fill={url('wing')} stroke="#4a5590" strokeOpacity=".5" strokeWidth="1.2" />
            <path d="M129 118 L110 111 M127 129 L108 122" stroke="#252e5e" strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M125 104 q-5 4 -10 -1 M125 140 q-5 3 -10 -2" stroke="#a7b3e6" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>

          {/* collo cangiante, bordo a piume */}
          <path
            d="M48 80 Q80 64 112 80 C114 90 108 97 100 98 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 C52 97 46 90 48 80 Z"
            fill={url('collar')}
          />
          <path d="M58 82 Q80 72 102 82" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" fill="none" opacity=".4" />

          {/* testa: piccola e un po' avanti, come un vero piccione */}
          <ellipse cx="80" cy="57" rx="28" ry="27" fill={url('head')} stroke="#7b88c0" strokeOpacity=".35" strokeWidth="1.5" />
          <ellipse cx="68" cy="40" rx="13" ry="7" fill={url('glow')} />
          <circle cx="56" cy="67" r="5.5" fill="#ff8fb4" opacity={mood === 'happy' ? 0.7 : 0.4} />
          <circle cx="104" cy="67" r="5.5" fill="#ff8fb4" opacity={mood === 'happy' ? 0.7 : 0.4} />

          {/* occhi */}
          <Eyes mood={mood} />
          {worn.face && mood !== 'cool' && <FaceItem item={worn.face} />}

          {/* becco corto con la cera bianca in cima */}
          {open ? (
            <>
              <path d="M70 66 Q80 59 90 66 Q89 74 80 76 Q71 74 70 66 Z" fill={url('beak')} />
              <path d="M72 75 Q80 92 88 75 Z" fill="#7a1f2e" />
              <path d="M75 77 Q80 87 85 77 Q80 81 75 77 Z" fill="#f06a7e" />
              <path d="M75.5 61.5 Q80 57.5 84.5 61.5 Q83.5 65 80 65.5 Q76.5 65 75.5 61.5 Z" fill="#efe7ff" />
            </>
          ) : (
            <>
              <path d="M70 66 Q80 59 90 66 Q89 78 80 81 Q71 78 70 66 Z" fill={url('beak')} />
              <path d="M74 73 Q80 75.5 86 73" stroke="#b9601a" strokeWidth="1.4" fill="none" strokeLinecap="round" opacity=".6" />
              <path d="M75.5 61.5 Q80 57.5 84.5 61.5 Q83.5 65 80 65.5 Q76.5 65 75.5 61.5 Z" fill="#efe7ff" />
            </>
          )}
          {mood === 'cool' && <path d="M73 77 Q82 81 90 73" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}
          {mood === 'angry' && <path d="M73 79 Q80 75 87 79" stroke="#a24d08" strokeWidth="1.8" fill="none" strokeLinecap="round" />}

          {/* accessori del collo */}
          {worn.neck && <NeckItem item={worn.neck} />}
        </g>

        {/* corona da regina: stretta e alta, come il pezzo degli scacchi (oro, avorio o ebano) */}
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
      </g>
    </svg>
  )
}

function Eyes({ mood }: { mood: Mood }) {
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
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={iris} fill={mood === 'angry' ? '#ff6a1f' : '#ff9a1f'} />
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={pupil} fill="#2a1230" />
          <circle cx={cx + 2.4} cy={cy - 2} r="2" fill="#fff" />
          <circle cx={cx - 2} cy={cy + 4} r="1" fill="#fff" opacity=".8" />
        </g>
      ))}
      {mood === 'angry' && (
        <g>
          <path d="M54 43 L76 52 L76 43 Z" fill="#a9b4de" />
          <path d="M106 43 L84 52 L84 43 Z" fill="#a9b4de" />
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

function FaceItem({ item }: { item: string }) {
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
