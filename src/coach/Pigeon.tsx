import { memo, useEffect, useId, useMemo, useRef } from 'react'
import type { Mood } from './lines'
import { useAppSelector } from '../store'
import { DEFAULT_CROWN, outfitOf, validOutfit, type Outfit } from './outfits'
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
  /** colore scuro del contorno */
  line: string
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
    line: '#303a78',
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
    line: '#46506e',
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
    line: '#3d2410',
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
    line: '#85591f',
    iris: '#b8683a',
    irisAngry: '#d9482a',
    lid: '#f0d8b4',
    headScale: 1.12,
  },
}

/** Varianti di copricapo degli altri coach (la struttura è la stessa, cambiano i colori). */
const PIRATE_HAT: Record<string, { fill: string; edge: string; trim: string }> = {
  tricorno: { fill: '#232338', edge: '#0b0b14', trim: '#ffcf3a' },
  'tricorno-rosso': { fill: '#b3123a', edge: '#5e0a21', trim: '#ffe08a' },
  'tricorno-blu': { fill: '#1f3f8a', edge: '#0f2257', trim: '#ffd23f' },
  'tricorno-oro': { fill: '#e9b02a', edge: '#8a5a0a', trim: '#fff3b0' },
}
const GRAD_CAP: Record<string, { top: string; band: string; edge: string; tassel: string }> = {
  tocco: { top: '#2c3570', band: '#232a5a', edge: '#141a3c', tassel: '#ffcf3a' },
  'tocco-nero': { top: '#34343f', band: '#24242d', edge: '#0d0d12', tassel: '#ffcf3a' },
  'tocco-bordeaux': { top: '#8a2f4a', band: '#6b2038', edge: '#3d0f20', tassel: '#ffcf3a' },
  'tocco-oro': { top: '#e0ac2a', band: '#c2891a', edge: '#7a5008', tassel: '#7a2342' },
}
const CREST: Record<string, { top: string; bottom: string; edge: string }> = {
  cresta: { top: '#ff6a7c', bottom: '#d12a42', edge: '#a3162b' },
  'cresta-rosa': { top: '#ffc0dc', bottom: '#f56fa6', edge: '#b8366b' },
  'cresta-gialla': { top: '#fff0a0', bottom: '#f5b82e', edge: '#b8760e' },
}

/**
 * I coach (Gigi il piccione, Capitan Gabbiano, Professor Gufo, Nonna Gallina): mascotte in SVG con
 * espressioni, accessori e animazioni idle. Le animazioni sono in CSS (classi pg-*), così costano pochissimo.
 */
export const Pigeon = memo(function Pigeon({ mood = 'neutral', size = 96, outfit, view, coach, still, talk }: { mood?: Mood; size?: number; outfit?: Outfit; view?: string; coach?: CoachId; still?: boolean; talk?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement>(null)
  // gli occhi seguono il dito o il cursore (se l'utente non ha chiesto meno animazioni)
  useEffect(() => {
    if (still || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let timer = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = svgRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const dx = e.clientX - (r.left + r.width / 2)
        const dy = e.clientY - (r.top + r.height * 0.35)
        const d = Math.hypot(dx, dy) || 1
        const k = Math.min(1, d / 180)
        el.style.setProperty('--lx', ((dx / d) * k * 2.4).toFixed(2))
        el.style.setProperty('--ly', ((dy / d) * k * 1.8).toFixed(2))
        el.classList.add('track')
        window.clearTimeout(timer)
        timer = window.setTimeout(() => svgRef.current?.classList.remove('track'), 4000)
      })
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
      window.clearTimeout(timer)
    }
  }, [still])
  const id = (n: string) => `${n}-${uid}`
  const url = (n: string) => `url(#${id(n)})`
  // si ridisegna solo se cambia il coach attivo o l'abbigliamento, non a ogni salvataggio dei progressi
  const activeId = useAppSelector((s) => activeCoach(s.settings, s.progress))
  const who: CoachId = coach ?? activeId
  const outfitKey = useAppSelector((s) => JSON.stringify(outfitOf(s.settings, coach ?? activeCoach(s.settings, s.progress))))
  const savedOutfit = useMemo<Outfit>(() => JSON.parse(outfitKey) as Outfit, [outfitKey])
  const S = SPECIES[who]
  // ogni coach ha il suo guardaroba; ciò che non esiste (più) per quel coach si ignora e si vede il look di serie
  const worn: Outfit = validOutfit(who, outfit ?? savedOutfit)
  const hat = worn.crown ?? DEFAULT_CROWN[who]

  const crown = CROWN[hat] ?? CROWN.oro
  const pirate = PIRATE_HAT[hat] ?? PIRATE_HAT.tricorno
  const cap = GRAD_CAP[hat] ?? GRAD_CAP.tocco
  const crest = CREST[hat] ?? CREST.cresta
  const headT = S.headScale === 1 ? undefined : `translate(80 86) scale(${S.headScale}) translate(-80 -86)`
  const cheek = mood === 'happy' ? 0.7 : mood === 'sad' ? 0.15 : mood === 'smug' ? 0.55 : 0.4

  return (
    <svg ref={svgRef} key={`${who}-${mood}`} className={`pigeon mood-${mood} coach-${who}${still ? ' still' : ''}${talk ? ' talking' : ''}`} width={size} height={size} viewBox={view ?? '0 0 160 160'} aria-hidden="true">
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
        <linearGradient id={id('crest')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={crest.top} />
          <stop offset="1" stopColor={crest.bottom} />
        </linearGradient>
        <linearGradient id={id('side')} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity=".26" />
          <stop offset=".38" stopColor="#fff" stopOpacity="0" />
          <stop offset=".68" stopColor="#0a0620" stopOpacity="0" />
          <stop offset="1" stopColor="#0a0620" stopOpacity=".26" />
        </linearGradient>
        <radialGradient id={id('iris')} cx=".38" cy=".3" r=".85">
          <stop offset="0" style={{ stopColor: `color-mix(in srgb, ${S.iris}, white 55%)` }} />
          <stop offset=".55" stopColor={S.iris} />
          <stop offset="1" style={{ stopColor: `color-mix(in srgb, ${S.iris}, #5a1a00 35%)` }} />
        </radialGradient>
        <radialGradient id={id('shadow')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#0a0620" stopOpacity=".3" />
          <stop offset="1" stopColor="#0a0620" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={id('blush')} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#ff7fae" stopOpacity="1" />
          <stop offset=".6" stopColor="#ff8fb4" stopOpacity=".7" />
          <stop offset="1" stopColor="#ff8fb4" stopOpacity="0" />
        </radialGradient>
        <clipPath id={id('headclip')}>
          <ellipse cx="80" cy="57" rx="27" ry="26" />
        </clipPath>
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
          <g className="pg-tail">
            <g stroke={S.line} strokeOpacity=".8" strokeWidth="1.7" strokeLinejoin="round">
              <path d="M104 126 Q128 84 146 90 Q152 108 128 134 Z" fill={S.tail} />
              <path d="M108 130 Q140 96 156 110 Q154 128 124 142 Z" fill={S.tail2} />
              <path d="M100 136 Q130 118 152 136 Q142 150 108 148 Z" fill={S.tail} />
            </g>
            <path d="M118 124 Q134 104 144 100 M122 134 Q142 118 150 118" stroke={S.tailLine} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
          </g>
        ) : (
          <g className="pg-tail">
            <path d="M98 114 Q128 108 151 124 Q158 136 146 147 Q120 151 94 145 Z" fill={S.tail} stroke={S.line} strokeOpacity=".8" strokeWidth="1.8" strokeLinejoin="round" />
            <path d="M137 119 Q153 128 151 139 Q149 145 143 148 Q150 134 137 119 Z" fill={S.tail2} />
            <path d="M120 118 Q140 122 150 132 M114 128 Q134 134 146 143" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity=".18" />
            <path d="M108 124 Q124 124 138 132 M106 134 Q122 135 134 141" stroke={S.tailLine} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".6" />
          </g>
        )}

        {/* zampe */}
        <g strokeLinecap="round" strokeLinejoin="round" fill="none">
          <g strokeWidth="6.4" style={{ stroke: `color-mix(in srgb, ${S.legs}, black 45%)` }}>
            <path d="M66 140 V149 M58 152.5 L66 149 L74 152.5" />
            <path d="M94 140 V149 M86 152.5 L94 149 L102 152.5" />
          </g>
          <g strokeWidth="4" stroke={S.legs}>
            <path d="M66 140 V149 M58 152.5 L66 149 L74 152.5" />
            <path d="M94 140 V149 M86 152.5 L94 149 L102 152.5" />
          </g>
        </g>

        <g className="pg-body">
          {/* corpo a pera: spalle strette, petto in fuori */}
          <path
            d="M63 70 C42 76 28 98 30 122 C32 142 54 149 80 149 C106 149 128 142 130 122 C132 98 118 76 97 70 Z"
            fill={url('body')}
            stroke={S.line}
            strokeOpacity=".85"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M63 70 C42 76 28 98 30 122 C32 142 54 149 80 149 C106 149 128 142 130 122 C132 98 118 76 97 70 Z" fill={url('side')} />
          <path d="M60 75 C45 81 34 98 35 120" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".3" />
          <path d="M101 75 C116 81 126 98 125 120" stroke="#0a0620" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity=".1" />
          {/* petto chiaro con piumette */}
          <path d="M80 86 C58 88 44 106 47 126 C50 142 66 146 80 146 C94 146 110 142 113 126 C116 106 102 88 80 86 Z" fill={url('breast')} />
          <ellipse cx="68" cy="108" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-25 68 108)" />
          {(who === 'gigi' || who === 'gabbiano') && (
            <g stroke={S.stroke} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".4">
              <path d="M64 100 q4 4 8 0 M76 98 q4 4 8 0 M88 100 q4 4 8 0" />
              <path d="M58 112 q4 4 8 0 M70 112 q4 4 8 0 M82 112 q4 4 8 0 M94 112 q4 4 8 0" />
              <path d="M62 124 q4 4 8 0 M74 125 q4 4 8 0 M86 125 q4 4 8 0 M98 124 q4 4 8 0" />
              <path d="M68 136 q4 4 8 0 M80 137 q4 4 8 0 M92 136 q4 4 8 0" />
            </g>
          )}

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
            <path d="M42 90 C24 106 23 130 29 142 L33 138 L34 148 L39 142 L42 151 C55 143 62 120 58 98 Z" fill={url('wing')} stroke={S.line} strokeOpacity=".85" strokeWidth="1.8" strokeLinejoin="round" />
            {who === 'gabbiano' && <path d="M28 140 Q36 137 44 141 L42 151 L39 142 L34 148 L33 138 L29 142 Z" fill={S.wingBar} stroke={S.line} strokeOpacity=".85" strokeWidth="1.8" strokeLinejoin="round" />}
            {who === 'gallina' && <g fill="#fff1d6" opacity=".8"><circle cx="35" cy="106" r="1.8" /><circle cx="44" cy="112" r="1.5" /><circle cx="36" cy="136" r="1.6" /><circle cx="46" cy="130" r="1.4" /><circle cx="38" cy="122" r="1.4" /></g>}
            {who === 'gufo' && <g fill="#f2e2c4" opacity=".75"><circle cx="36" cy="108" r="2.2" /><circle cx="45" cy="121" r="2" /><circle cx="35" cy="125" r="1.8" /></g>}
            <path d="M43 95 C32 108 30 122 33 132" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".22" />
            <path d="M33 138 Q38 124 46 104 M39 142 Q46 126 52 106" stroke={S.wingBar} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".35" />
            <path d="M31 118 L50 111 M33 129 L52 122" stroke={S.wingBar} strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M35 104 q5 4 10 -1 M35 140 q5 3 10 -2" stroke={S.wingFeather} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>
          <g className="pg-wing-r">
            <path d="M118 90 C137 106 137 130 131 142 L127 138 L126 148 L121 142 L118 151 C105 143 98 120 102 98 Z" fill={url('wing')} stroke={S.line} strokeOpacity=".85" strokeWidth="1.8" strokeLinejoin="round" />
            {who === 'gabbiano' && <path d="M132 140 Q124 137 116 141 L118 151 L121 142 L126 148 L127 138 L131 142 Z" fill={S.wingBar} stroke={S.line} strokeOpacity=".85" strokeWidth="1.8" strokeLinejoin="round" />}
 {who === 'gallina' && <g fill="#fff1d6" opacity=".8"><circle cx="125" cy="106" r="1.8" /><circle cx="116" cy="112" r="1.5" /><circle cx="124" cy="136" r="1.6" /><circle cx="114" cy="130" r="1.4" /><circle cx="122" cy="122" r="1.4" /></g>}
            {who === 'gufo' && <g fill="#f2e2c4" opacity=".75"><circle cx="124" cy="108" r="2.2" /><circle cx="115" cy="121" r="2" /><circle cx="125" cy="125" r="1.8" /></g>}
            <path d="M117 95 C128 108 130 122 127 132" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" fill="none" opacity=".12" />
            <path d="M127 138 Q122 124 114 104 M121 142 Q114 126 108 106" stroke={S.wingBar} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".35" />
            <path d="M129 118 L110 111 M127 129 L108 122" stroke={S.wingBar} strokeWidth="3" strokeLinecap="round" opacity=".7" />
            <path d="M125 104 q-5 4 -10 -1 M125 140 q-5 3 -10 -2" stroke={S.wingFeather} strokeWidth="1.6" strokeLinecap="round" fill="none" opacity=".55" />
          </g>

          {/* collo cangiante (solo il piccione), bordo a piume */}
          {who === 'gigi' && (
            <>
              <path
                d="M48 80 Q80 64 112 80 C114 90 108 97 100 98 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 q-5 5 -10 0 C52 97 46 90 48 80 Z"
                fill={url('collar')}
                stroke="#2c2a78"
                strokeOpacity=".5"
                strokeWidth="1.4"
                strokeLinejoin="round"
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
            {/* ciuffetti di piume che spuntano ai lati della corona (solo Gigi) */}
            {who === 'gigi' && (
              <g stroke={S.line} strokeOpacity=".85" strokeWidth="1.6" strokeLinejoin="round" fill={url('head')}>
                <path className="pg-tuft" d="M58 42 Q49 41 47 34 Q55 33 62 38 Z" />
                <path className="pg-tuft t2" d="M60 38 Q53 34 54 27 Q60 29 64 35 Z" />
                <path className="pg-tuft" d="M102 42 Q111 41 113 34 Q105 33 98 38 Z" />
                <path className="pg-tuft t2" d="M100 38 Q107 34 106 27 Q100 29 96 35 Z" />
              </g>
            )}
            <ellipse cx="80" cy="87" rx="30" ry="8" fill={url('shadow')} />
            <ellipse cx="80" cy="57" rx="28" ry="27" fill={url('head')} stroke={S.line} strokeOpacity=".85" strokeWidth="2" />
            <ellipse cx="80" cy="57" rx="28" ry="27" fill={url('side')} />
            <ellipse cx="68" cy="40" rx="13" ry="7" fill={url('glow')} />
            {/* disco facciale del gufo */}
            {who === 'gufo' && (
              <g fill="#f6e8cc" stroke="#a97c47" strokeOpacity=".45" strokeWidth="1.4">
                <circle cx="67" cy="55" r="14" />
                <circle cx="93" cy="55" r="14" />
                <path d="M72 60 Q80 52 88 60 Q86 70 80 72 Q74 70 72 60 Z" strokeWidth="0" />
              </g>
            )}
            <g clipPath={url('headclip')} opacity={Math.min(1, cheek * 1.5)}>
              <ellipse cx="60" cy="67" rx="8" ry="5.6" fill={url('blush')} />
              <ellipse cx="100" cy="67" rx="8" ry="5.6" fill={url('blush')} />
            </g>
            <path d="M58 38 Q50 48 53 62" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".32" />
            <path d="M103 38 Q109 50 106 64" stroke="#0a0620" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".1" />
            {who === 'gabbiano' && <circle cx="52" cy="70" r="3.4" fill="none" stroke="#ffcf3a" strokeWidth="1.8" />}

            {/* occhi */}
            <Eyes mood={mood} p={{ ...S, irisG: url('iris') }} />
            {mood !== 'cool' && (worn.face ? <FaceItem item={worn.face} /> : who === 'gufo' ? <FaceItem item="tondi" /> : null)}

            {/* bargigli della gallina */}
            {who === 'gallina' && <path d="M75 76 Q80 98 85 76 Z" fill={url('comb')} stroke="#a3162b" strokeWidth="1.2" strokeLinejoin="round" />}

            {/* becco = bocca: due metà (superiore e inferiore), la linea di separazione è la bocca e cambia con l'umore */}
            <Beak mood={mood} who={who} fill={url('beak')} talk={!!talk && !still} />
            {mood === 'sleepy' && <circle className="pg-snot" cx="90.5" cy="74" r="4.6" fill="#cfeaff" stroke="#fff" strokeWidth="1.4" opacity=".9" />}
          </g>

          {/* accessori del collo: quelli di Gigi dal guardaroba, per gli altri il loro segno distintivo */}
          {worn.neck ? (
            <NeckItem item={worn.neck} />
          ) : (
            <>
              {who === 'gabbiano' && <Bandana />}
              {who === 'gufo' && <BowTie />}
              {who === 'gallina' && <Pearls />}
            </>
          )}
          {worn.back === 'zainetto' && (
            <g fill="none" strokeLinecap="round">
              <path d="M58 84 Q52 112 55 138" stroke="#9b1744" strokeWidth="6" />
              <path d="M102 84 Q108 112 105 138" stroke="#9b1744" strokeWidth="6" />
              <rect x="50" y="110" width="9" height="7" rx="2" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1.2" />
              <rect x="101" y="110" width="9" height="7" rx="2" fill="#ffcf3a" stroke="#b8760e" strokeWidth="1.2" />
            </g>
          )}
        </g>

        {worn.extra && <ExtraItem item={worn.extra} gold={url('gold')} />}

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
                <path d="M65 35 L61 13 L66 27 L70 7 L75.5 26 L80 1 L84.5 26 L90 7 L94 27 L99 13 L95 35 Z" fill={url('side')} />
                <path d="M63 33 Q80 39 97 33 L96.5 40 Q80 46 63.5 40 Z" fill={url('side')} />
                <path d="M63.5 36 Q80 42 96.5 36" stroke="#fff" strokeWidth="1.2" fill="none" opacity=".45" strokeLinecap="round" />
                <path d="M68.5 31 L71 13 M77.5 31 L80 12 M86.5 31 L89 13" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".35" />
                <path d="M96 36.5 Q80 43.5 64 36.5 L63.6 40 Q80 46 96.4 40 Z" fill="#7a4a00" opacity=".25" />
                <circle cx="79" cy="-1.6" r="1" fill="#fff" opacity=".9" />
                <path className="pg-gem" d="M71 20 l1.2 3 l3 1.2 l-3 1.2 l-1.2 3 l-1.2 -3 l-3 -1.2 l3 -1.2 z" fill="#fff" />
                <circle cx="80" cy="37.5" r="2.8" fill="#ff4d6a" stroke="#fff" strokeWidth="1" />
                <circle cx="70" cy="36.5" r="1.7" fill="#3fe0d0" />
                <circle cx="90" cy="36.5" r="1.7" fill="#3fe0d0" />
              </g>
            </g>
          )}
          {who === 'gabbiano' && (
            <g className="pg-crown" strokeLinejoin="round">
              <path d="M44 42 Q48 24 62 24 Q70 10 80 10 Q90 10 98 24 Q112 24 116 42 Q80 30 44 42 Z" fill={pirate.fill} stroke={pirate.edge} strokeWidth="1.8" />
              <path d="M44 42 Q80 30 116 42" fill="none" stroke={pirate.trim} strokeWidth="2.6" strokeLinecap="round" />
              <circle cx="80" cy="22" r="5" fill="#fff" />
              <path d="M77 26 V28.5 H83 V26" fill="#fff" />
              <circle cx="78" cy="21.5" r="1.3" fill={pirate.fill} />
              <circle cx="82" cy="21.5" r="1.3" fill={pirate.fill} />
              <path d="M70 34 L90 30 M70 30 L90 34" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M50 30 Q34 20 38 6 Q48 14 58 26 Z" fill="#e8436a" stroke="#a3162b" strokeWidth="1.2" />
            </g>
          )}
          {who === 'gufo' && (
            <g className="pg-crown" strokeLinejoin="round">
              <path d="M60 32 H100 V42 Q80 49 60 42 Z" fill={cap.band} stroke={cap.edge} strokeWidth="1.4" />
              <path d="M38 26 L80 8 L122 26 L80 42 Z" fill={cap.top} stroke={cap.edge} strokeWidth="1.6" />
              <path d="M80 8 L122 26 L80 42 Z" fill="#fff" opacity=".07" />
              <circle cx="80" cy="25" r="2.8" fill={cap.tassel} />
              <path d="M80 25 L116 30 V46" stroke={cap.tassel} strokeWidth="2" fill="none" strokeLinecap="round" />
              <rect x="112.5" y="44" width="7" height="12" rx="2.4" fill={cap.tassel} stroke={cap.edge} strokeWidth="1" />
            </g>
          )}
          {who === 'gallina' && (
            <g className="pg-crown" strokeLinejoin="round">
              {hat === 'cuoca' ? (
                <>
                  <path d="M60 40 C46 40 42 22 56 20 C54 4 74 -2 80 10 C86 -2 106 4 104 20 C118 22 114 40 100 40 Z" fill="#fff" stroke="#c9c2d9" strokeWidth="1.6" />
                  <path d="M58 36 H102 V44 Q80 50 58 44 Z" fill="#f1eef8" stroke="#c9c2d9" strokeWidth="1.4" />
                  <path d="M66 14 q4 -6 9 -3 M88 12 q5 -4 9 1" stroke="#dcd7ea" strokeWidth="2" strokeLinecap="round" fill="none" />
                </>
              ) : (
                <>
                  <path d="M62 38 C54 22 66 12 73 24 C73 6 91 6 89 24 C98 12 108 22 98 38 Z" fill={url('crest')} stroke={crest.edge} strokeWidth="1.7" />
                  <path d="M70 26 q2 -6 6 -4 M86 26 q2 -5 5 -3" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none" opacity=".5" />
                </>
              )}
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
})

/** Forma della bocca per ogni umore: altezza dei due angoli e del centro (più in basso = sorriso), apertura e curva. */
const MOUTH: Record<Mood, { yl: number; ym: number; yr: number; d: number; c?: [number, number] }> = {
  neutral: { yl: 71, ym: 73, yr: 71, d: 0 },
  happy: { yl: 70, ym: 73, yr: 70, d: 7 },
  shocked: { yl: 72, ym: 72, yr: 72, d: 9 },
  sad: { yl: 75.5, ym: 72.5, yr: 75.5, d: 0 },
  angry: { yl: 75, ym: 73, yr: 75, d: 1.6 },
  cool: { yl: 75, ym: 76, yr: 71, d: 0 },
  smug: { yl: 74.5, ym: 75, yr: 69.5, d: 0 },
  confused: { yl: 73, ym: 73, yr: 73, d: 0, c: [69, 77] },
  thinking: { yl: 76, ym: 74, yr: 75, d: 0 },
  sleepy: { yl: 71, ym: 73, yr: 71, d: 1.4 },
}

function Beak({ mood, who, fill, talk }: { mood: Mood; who: CoachId; fill: string; talk: boolean }) {
  const m = MOUTH[mood] ?? MOUTH.neutral
  const { yl, ym, yr } = m
  // mentre parla la mandibola si muove: la bocca chiusa ha comunque l'interno pronto dietro
  const d = m.d
  const dIn = d || (talk ? 3 : 0)
  const [c1, c2] = m.c ?? [ym, ym]
  // la mandibola inferiore ruota attorno agli angoli: gli estremi restano fermi, solo il centro scende
  const seam = (dy: number) => `Q75 ${c1 + dy} 80 ${ym + dy} Q85 ${c2 + dy} 90 ${yr}`
  const seamBack = (dy: number) => `Q85 ${c2 + dy} 80 ${ym + dy} Q75 ${c1 + dy} 70 ${yl}`
  const bottom = Math.max(yl, yr, ym + d) + (d ? 4.6 : 6.4)
  const edge = '#a24d08'
  const lower = `M70 ${yl} ${seam(d)} C91.5 ${bottom - 2.5} 87 ${bottom} 80 ${bottom} C73 ${bottom} 68.5 ${bottom - 2.5} 70 ${yl} Z`
  const gull = who === 'gabbiano'
  const owl = who === 'gufo'
  const beakT = gull ? 'translate(80 58.5) scale(1.06 1.2) translate(-80 -58.5)' : owl ? 'translate(80 60) scale(0.8 0.9) translate(-80 -60)' : who === 'gallina' ? 'translate(80 60) scale(0.9 0.92) translate(-80 -60)' : undefined
  return (
    <g strokeLinejoin="round" strokeLinecap="round" transform={beakT}>
      {dIn > 0 && (
        <>
          {/* dentro la bocca (a forma di lente, chiusa agli angoli) e lingua */}
          <path d={`M70 ${yl} ${seam(0)} ${seamBack(dIn)} Z`} fill="#7a1f2e" />
          {dIn >= 5 && <ellipse className="pg-tongue" cx="80" cy={ym + d} rx="4.6" ry="3.6" fill="#f06a7e" />}
        </>
      )}
      {/* metà inferiore */}
      <g className={talk && !d ? "pg-beak-low pg-talk" : "pg-beak-low"}>
        <path d={lower} fill={fill} stroke={edge} strokeOpacity=".7" strokeWidth="1.2" />
        <path d={lower} fill="#7a3a00" opacity=".16" />
        {who === 'gabbiano' && <circle cx="85" cy={bottom - 2.8} r="2" fill="#e8312a" />}
      </g>
      {/* linea della bocca */}
      <path d={`M70 ${yl} ${seam(d)}`} fill="none" stroke="#8a3d05" strokeWidth="1.3" opacity={d ? 0 : 0.75} />
      {/* il becco del gabbiano e del gufo ha la punta ricurva sopra la mandibola */}
      {(gull || owl) && !d && <path d={`M75.5 ${bottom - 3.4} Q80 ${bottom + 2.2} 84.5 ${bottom - 3.4} Q80 ${bottom - 2.4} 75.5 ${bottom - 3.4} Z`} fill={fill} stroke={edge} strokeOpacity=".7" strokeWidth="1" />}
      {/* metà superiore */}
      <path d={`M70 ${yl} C67.5 64 74 58.5 80 58.5 C86 58.5 92.5 64 90 ${yr} ${seamBack(0)} Z`} fill={fill} stroke={edge} strokeOpacity=".7" strokeWidth="1.2" />
      <path d="M73 64.5 Q76 61.2 80.5 61" stroke="#fff" strokeWidth="1.7" fill="none" opacity=".55" />
    </g>
  )
}

function Eyes({ mood, p }: { mood: Mood; p: { iris: string; irisAngry: string; lid: string; irisG: string } }) {
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
          <circle cx="67" cy="55" r="10.5" fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
          <circle cx="70" cy="56" r="6.6" fill={p.irisG} />
          <circle cx="71" cy="56" r="3.4" fill="#2a1230" />
          <circle cx="73" cy="53.5" r="2" fill="#fff" />
        </g>
        <g className="pg-eye">
          <circle cx="93" cy="57" r="7.6" fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
          <circle cx="91" cy="58" r="4.8" fill={p.irisG} />
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
            <circle cx={cx} cy={56} r="10" fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
            <circle cx={cx} cy={58} r="7.4" fill={p.irisG} />
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
            <circle cx={cx} cy={55} r="9.5" fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
            <circle cx={cx + 3.2} cy={52} r="6.2" fill={p.irisG} />
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
            <circle cx={cx} cy={55} r="9.5" fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
            <circle cx={cx + 2} cy={57} r="6.2" fill={p.irisG} />
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
          <circle cx={cx} cy={cy} r={r} fill="#fff" stroke="#2a1230" strokeOpacity=".4" strokeWidth="1.3" />
          <path d={`M${cx - r + 0.6} ${cy - 1.5} A${r} ${r} 0 0 1 ${cx + r - 0.6} ${cy - 1.5}`} fill="none" stroke="#2a1230" strokeWidth="1.8" strokeLinecap="round" opacity=".3" />
          <g className="pg-look">
            <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={iris} fill={mood === 'angry' ? p.irisAngry : p.irisG} />
            <circle cx={cx + (mood === 'angry' ? 1 : 0)} cy={mood === 'angry' ? cy + 2 : cy + 1} r={pupil} fill="#2a1230" />
            <circle cx={cx + 2.4} cy={cy - 2} r="2" fill="#fff" />
            <circle cx={cx - 2} cy={cy + 4} r="1" fill="#fff" opacity=".8" />
          </g>
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
  if (item === 'cannocchiale') {
    return (
      <g transform="rotate(-32 30 132)" strokeLinejoin="round">
        <rect x="6" y="126" width="20" height="13" rx="4" fill="#8a5a2b" stroke="#4d2f12" strokeWidth="1.5" />
        <rect x="24" y="128" width="17" height="9" rx="3" fill="#e9b02a" stroke="#8a5a0a" strokeWidth="1.5" />
        <rect x="39" y="129.5" width="12" height="6" rx="2.4" fill="#8a5a2b" stroke="#4d2f12" strokeWidth="1.3" />
        <ellipse cx="51" cy="132.5" rx="2" ry="3.4" fill="#bfe6ff" stroke="#4d2f12" strokeWidth="1" />
        <path d="M9 129 H22" stroke="#fff" strokeWidth="1.4" opacity=".4" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'forziere') {
    return (
      <g strokeLinejoin="round">
        <path d="M10 134 Q10 118 30 118 Q50 118 50 134 Z" fill="#a8692a" stroke="#4d2f12" strokeWidth="1.8" />
        <rect x="10" y="134" width="40" height="17" rx="2.5" fill="#8a5a2b" stroke="#4d2f12" strokeWidth="1.8" />
        <path d="M10 134 H50 M22 120 V151 M38 120 V151" stroke="#e9b02a" strokeWidth="3" />
        <rect x="26" y="130" width="8" height="9" rx="2" fill="#ffcf3a" stroke="#8a5a0a" strokeWidth="1.3" />
        <circle cx="30" cy="135" r="1.3" fill="#4d2f12" />
        <g fill="#ffcf3a" stroke="#b8760e" strokeWidth="1">
          <circle cx="54" cy="150" r="3" />
          <circle cx="60" cy="146" r="2.4" />
        </g>
      </g>
    )
  }
  if (item === 'libro') {
    return (
      <g strokeLinejoin="round">
        <rect x="10" y="120" width="38" height="30" rx="3" fill="#7a2342" stroke="#3d0f20" strokeWidth="1.8" />
        <rect x="14" y="123" width="31" height="24" rx="2" fill="#8f2f50" />
        <path d="M10 146 H48" stroke="#f6e8cc" strokeWidth="3" />
        <path d="M19 130 H40 M21 136 H38" stroke="#ffcf3a" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="42" y="120" width="4.5" height="30" fill="#e9b02a" opacity=".85" />
      </g>
    )
  }
  if (item === 'pergamena') {
    return (
      <g strokeLinejoin="round">
        <path d="M14 124 H46 V146 H14 Z" fill="#f6e3b4" stroke="#a87a3a" strokeWidth="1.6" />
        <rect x="9" y="121" width="9" height="28" rx="4.5" fill="#e8cf94" stroke="#a87a3a" strokeWidth="1.6" />
        <rect x="42" y="121" width="9" height="28" rx="4.5" fill="#e8cf94" stroke="#a87a3a" strokeWidth="1.6" />
        <path d="M21 131 H40 M21 136 H37 M21 141 H40" stroke="#8a6a32" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="38" cy="142" r="3" fill="#c0392b" />
      </g>
    )
  }
  if (item === 'mestolo') {
    return (
      <g strokeLinejoin="round" strokeLinecap="round">
        <path d="M48 154 L26 116" stroke="#c98a3f" strokeWidth="5" />
        <path d="M48 154 L26 116" stroke="#e8b46a" strokeWidth="1.6" />
        <ellipse cx="22" cy="109" rx="12" ry="9" transform="rotate(-30 22 109)" fill="#aab4cc" stroke="#5a6684" strokeWidth="1.8" />
        <ellipse cx="22" cy="108" rx="8" ry="5.5" transform="rotate(-30 22 108)" fill="#7e8aa8" />
      </g>
    )
  }
  if (item === 'torta') {
    return (
      <g strokeLinejoin="round">
        <ellipse cx="32" cy="150" rx="26" ry="5" fill="#fff" stroke="#c9d0ee" strokeWidth="1.5" />
        <path d="M14 132 V144 Q32 152 50 144 V132 Z" fill="#f6b6cf" stroke="#c9507a" strokeWidth="1.6" />
        <ellipse cx="32" cy="132" rx="18" ry="6" fill="#fff6fa" stroke="#c9507a" strokeWidth="1.6" />
        <path d="M18 136 q3 5 6 0 M26 138 q3 5 6 0 M34 138 q3 5 6 0 M42 136 q3 5 6 0" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="127" r="3.4" fill="#e8312a" stroke="#a3162b" strokeWidth="1" />
      </g>
    )
  }
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
  if (item === 'benda') {
    return (
      <g strokeLinecap="round">
        <path d="M50 40 Q80 46 110 50" stroke="#14091f" strokeWidth="3.4" fill="none" />
        <ellipse cx="93" cy="55" rx="12.5" ry="11.5" fill="#14091f" stroke="#3a2a55" strokeWidth="1.4" />
        <path d="M86 50 q4 -3 9 -1" stroke="#fff" strokeWidth="1.6" opacity=".35" fill="none" />
      </g>
    )
  }
  if (item === 'mezzaluna') {
    return (
      <g fill="#fff" fillOpacity=".14" stroke="#e9a91c" strokeWidth="2.4" strokeLinejoin="round">
        <path d="M54 53 H80 Q80 69 67 69 Q54 69 54 53 Z" />
        <path d="M80 53 H106 Q106 69 93 69 Q80 69 80 53 Z" />
        <path d="M54 53 L48 50 M106 53 L112 50" fill="none" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'nonna') {
    return (
      <g fill="#fff" fillOpacity=".16" stroke="#c9507a" strokeWidth="2.2">
        <circle cx="67" cy="57" r="10.5" />
        <circle cx="93" cy="57" r="10.5" />
        <path d="M77.5 56 Q80 53.5 82.5 56" fill="none" />
        <path d="M56.5 55 L50 52 M103.5 55 L110 52" fill="none" strokeLinecap="round" />
        <path d="M50 52 Q40 70 52 88" fill="none" stroke="#e8b04a" strokeWidth="1.4" strokeDasharray="2 2.2" />
      </g>
    )
  }
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
  if (item === 'doblone') {
    return (
      <g strokeLinejoin="round">
        <path d="M58 84 Q80 110 102 84" fill="none" stroke="#7a4a1e" strokeWidth="3.4" strokeLinecap="round" />
        <circle cx="80" cy="110" r="10" fill="#ffcf3a" stroke="#b8760e" strokeWidth="2" />
        <circle cx="80" cy="110" r="6.4" fill="none" stroke="#e9981a" strokeWidth="1.3" />
        <path d="M76 106 L84 114 M84 106 L76 114" stroke="#b8760e" strokeWidth="2" strokeLinecap="round" />
      </g>
    )
  }
  if (item === 'orologio') {
    return (
      <g strokeLinejoin="round">
        <path d="M56 86 Q74 112 98 104" fill="none" stroke="#e9a91c" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 2" />
        <circle cx="101" cy="112" r="10.5" fill="#ffcf3a" stroke="#b8760e" strokeWidth="2" />
        <circle cx="101" cy="112" r="7.4" fill="#fffdf2" stroke="#b8760e" strokeWidth="1" />
        <path d="M101 112 V107 M101 112 L105 114" stroke="#3a2a55" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="101" cy="100.5" r="2" fill="#b8760e" />
      </g>
    )
  }
  if (item === 'scialle') {
    return (
      <g strokeLinejoin="round">
        <path d="M42 100 Q80 86 118 100 L122 130 Q80 144 38 130 Z" fill="#9a6bd1" stroke="#5e3a91" strokeWidth="1.4" />
        <path d="M44 111 Q80 126 116 111 M41 121 Q80 137 119 121" fill="none" stroke="#e9d9ff" strokeWidth="3" strokeLinecap="round" opacity=".7" />
        <path d="M44 130 V137 M52 133 V140 M60 135 V142 M68 137 V144 M76 138 V145 M84 138 V145 M92 137 V144 M100 135 V142 M108 133 V140 M116 130 V137" stroke="#5e3a91" strokeWidth="2" strokeLinecap="round" />
      </g>
    )
  }
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
