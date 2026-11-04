import { useId } from 'react'
import type { Mood } from './lines'

/**
 * Gigi il piccione: mascotte in SVG con espressioni e animazioni idle.
 * Tutte le animazioni sono in CSS (classi pg-*), così costano pochissimo.
 */
export function Pigeon({ mood = 'neutral', size = 96 }: { mood?: Mood; size?: number }) {
  const uid = useId().replace(/:/g, '')
  const id = (n: string) => `${n}-${uid}`
  const url = (n: string) => `url(#${id(n)})`

  const open = mood === 'happy' || mood === 'shocked'

  return (
    <svg key={mood} className={`pigeon mood-${mood}`} width={size} height={size} viewBox="0 0 160 160" aria-hidden="true">
      <defs>
        <linearGradient id={id('body')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c9d2f3" />
          <stop offset="1" stopColor="#8592c6" />
        </linearGradient>
        <linearGradient id={id('head')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6ddf8" />
          <stop offset="1" stopColor="#a2aedb" />
        </linearGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7d89bd" />
          <stop offset="1" stopColor="#505b94" />
        </linearGradient>
        <linearGradient id={id('collar')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#35cdb0" />
          <stop offset=".5" stopColor="#8a6ee8" />
          <stop offset="1" stopColor="#e05fc0" />
        </linearGradient>
        <linearGradient id={id('beak')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffc962" />
          <stop offset="1" stopColor="#ef8419" />
        </linearGradient>
        <linearGradient id={id('gold')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe681" />
          <stop offset="1" stopColor="#f0a91c" />
        </linearGradient>
        <radialGradient id={id('glow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".28" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="80" cy="151" rx="40" ry="6" fill="#000" opacity=".28" />

      <g className="pg-all">
        {/* coda */}
        <path d="M112 118 C130 120 144 130 150 144 C132 146 116 140 104 132 Z" fill={url('wing')} />
        {/* zampe */}
        <g stroke="#f08a1c" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M66 138 V148 M60 150 L66 148 L72 150" />
          <path d="M94 138 V148 M88 150 L94 148 L100 150" />
        </g>

        <g className="pg-body">
          {/* corpo */}
          <path d="M28 108 C28 70 52 50 80 50 C108 50 132 70 132 108 C132 130 108 143 80 143 C52 143 28 130 28 108 Z" fill={url('body')} />
          <ellipse cx="80" cy="120" rx="32" ry="21" fill="#eef1fd" opacity=".75" />

          {/* ali */}
          <g className="pg-wing-l">
            <path d="M34 82 C16 94 16 122 34 130 C46 124 50 98 44 84 Z" fill={url('wing')} />
            <path d="M30 104 L42 100 M31 114 L43 110" stroke="#3f4a80" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          </g>
          <g className="pg-wing-r">
            <path d="M126 82 C144 94 144 122 126 130 C114 124 110 98 116 84 Z" fill={url('wing')} />
            <path d="M130 104 L118 100 M129 114 L117 110" stroke="#3f4a80" strokeWidth="2" strokeLinecap="round" opacity=".55" />
          </g>

          {/* collo cangiante */}
          <ellipse cx="80" cy="90" rx="36" ry="15" fill={url('collar')} opacity=".95" />

          {/* testa */}
          <circle cx="80" cy="62" r="35" fill={url('head')} />
          <ellipse cx="68" cy="44" rx="14" ry="8" fill={url('glow')} />
          <circle cx="50" cy="74" r="6.5" fill="#ff8fb4" opacity={mood === 'happy' ? 0.7 : 0.42} />
          <circle cx="110" cy="74" r="6.5" fill="#ff8fb4" opacity={mood === 'happy' ? 0.7 : 0.42} />

          {/* occhi */}
          <Eyes mood={mood} />

          {/* becco */}
          <ellipse cx="80" cy="70" rx="6.5" ry="4" fill="#f6f2ff" />
          {open ? (
            <>
              <path d="M69 72 Q80 64 91 72 Q88 79 80 82 Q72 79 69 72 Z" fill={url('beak')} />
              <path d="M71 80 Q80 98 89 80 Z" fill="#7a1f2e" />
              <path d="M73 82 Q80 92 87 82 Q80 86 73 82 Z" fill="#f06a7e" />
            </>
          ) : (
            <path d="M68 72 Q80 64 92 72 Q89 84 80 90 Q71 84 68 72 Z" fill={url('beak')} />
          )}
          {mood === 'cool' && <path d="M72 82 Q82 86 92 78" stroke="#a24d08" strokeWidth="2" fill="none" strokeLinecap="round" />}
          {mood === 'angry' && <path d="M72 83 Q80 79 88 83" stroke="#a24d08" strokeWidth="2" fill="none" strokeLinecap="round" />}
        </g>

        {/* corona a torre */}
        <g className="pg-crown">
          <path d="M58 36 L58 15 L67 15 L67 22 L75 22 L75 15 L85 15 L85 22 L93 22 L93 15 L102 15 L102 36 Z" fill={url('gold')} stroke="#c98512" strokeWidth="1.8" strokeLinejoin="round" />
          <rect x="56" y="33" width="48" height="7" rx="3" fill={url('gold')} stroke="#c98512" strokeWidth="1.8" />
          <circle cx="80" cy="29" r="3.4" fill="#ff4d6a" stroke="#fff" strokeWidth="1" />
          <circle cx="66" cy="29" r="2.2" fill="#3fe0d0" />
          <circle cx="94" cy="29" r="2.2" fill="#3fe0d0" />
        </g>

        {/* extra d'umore */}
        {mood === 'happy' && (
          <g className="pg-sparkles" fill="#ffe681">
            <path className="pg-sp s1" d="M20 40 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 l7 -3 z" />
            <path className="pg-sp s2" d="M140 30 l2.5 6 l6 2.5 l-6 2.5 l-2.5 6 l-2.5 -6 l-6 -2.5 l6 -2.5 z" />
            <path className="pg-sp s3" d="M142 76 l2 4.5 l4.5 2 l-4.5 2 l-2 4.5 l-2 -4.5 l-4.5 -2 l4.5 -2 z" />
          </g>
        )}
        {mood === 'angry' && (
          <g className="pg-steam" fill="#fff" opacity=".85">
            <circle className="st1" cx="36" cy="40" r="5" />
            <circle className="st2" cx="126" cy="38" r="5" />
            <path d="M118 22 l8 -6 M122 30 l10 -2 M118 14 l3 -9" stroke="#ff4d5e" strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}
        {mood === 'shocked' && (
          <path className="pg-sweat" d="M124 44 C128 52 132 56 128 62 C124 66 118 62 120 56 C121 52 123 49 124 44 Z" fill="#7fd6ff" stroke="#fff" strokeWidth="1.5" />
        )}
      </g>
    </svg>
  )
}

function Eyes({ mood }: { mood: Mood }) {
  const eyes = [64, 96]
  if (mood === 'cool') {
    return (
      <g>
        <path d="M48 52 H78 V62 Q78 74 63 74 Q48 74 48 62 Z" fill="#14091f" />
        <path d="M82 52 H112 V62 Q112 74 97 74 Q82 74 82 62 Z" fill="#14091f" />
        <path d="M76 55 H84" stroke="#14091f" strokeWidth="3" strokeLinecap="round" />
        <path d="M54 56 L62 56 M88 56 L96 56" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".7" />
        <path d="M54 61 L58 61 M88 61 L92 61" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".45" />
      </g>
    )
  }
  if (mood === 'happy') {
    return (
      <g stroke="#2a1230" strokeWidth="4.5" strokeLinecap="round" fill="none">
        <path d="M54 64 Q64 50 74 64" />
        <path d="M86 64 Q96 50 106 64" />
      </g>
    )
  }
  const big = mood === 'shocked'
  const r = big ? 13 : 11
  const iris = big ? 7 : 7.5
  const pupil = big ? 2.6 : 4.2
  return (
    <g>
      {eyes.map((cx) => (
        <g key={cx} className="pg-eye">
          <circle cx={cx} cy="60" r={r} fill="#fff" />
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? 62 : 61} r={iris} fill={mood === 'angry' ? '#ff6a1f' : '#ff9a1f'} />
          <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? 62 : 61} r={pupil} fill="#2a1230" />
          <circle cx={cx + 2.6} cy="57.6" r="2.3" fill="#fff" />
          <circle cx={cx - 2.4} cy="64.4" r="1.1" fill="#fff" opacity=".8" />
        </g>
      ))}
      {mood === 'angry' && (
        <g>
          <path d="M48 48 L76 58 L76 48 Z" fill="#a2aedb" />
          <path d="M112 48 L84 58 L84 48 Z" fill="#a2aedb" />
          <path d="M48 49 L76 59 M112 49 L84 59" stroke="#2a1230" strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
      {mood === 'shocked' && (
        <g stroke="#2a1230" strokeWidth="3.6" strokeLinecap="round" fill="none">
          <path d="M52 40 Q64 34 74 40" />
          <path d="M86 40 Q96 34 108 40" />
        </g>
      )}
      {mood === 'neutral' && (
        <g stroke="#2a1230" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity=".75">
          <path d="M54 44 Q64 40 74 44" />
          <path d="M86 44 Q96 40 106 44" />
        </g>
      )}
    </g>
  )
}
