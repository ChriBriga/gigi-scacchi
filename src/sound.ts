import { getState } from './store'

/**
 * Suoni sintetizzati con Web Audio (nessun file da scaricare, nessuna licenza da rispettare).
 * I pezzi fanno il "toc" del legno: un colpo di rumore filtrato + una piccola cassa di risonanza.
 */
let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null

function audio(): AudioContext | null {
  if (!getState().settings.sound) return null
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function noiseBuffer(c: AudioContext): AudioBuffer {
  if (!noise) {
    noise = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate)
    const d = noise.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noise
}

/** colpo di legno: rumore passa-banda con attacco istantaneo e coda brevissima */
function knock(when: number, opts: { freq: number; q: number; dur: number; vol: number; body?: number }) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + when
  const src = c.createBufferSource()
  src.buffer = noiseBuffer(c)
  const bp = c.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = opts.freq
  bp.Q.value = opts.q
  const g = c.createGain()
  g.gain.setValueAtTime(opts.vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur)
  src.connect(bp).connect(g).connect(c.destination)
  src.start(t0, Math.random() * 0.3)
  src.stop(t0 + opts.dur + 0.02)
  if (opts.body) {
    const o = c.createOscillator()
    const og = c.createGain()
    o.type = 'sine'
    o.frequency.setValueAtTime(opts.body, t0)
    o.frequency.exponentialRampToValueAtTime(opts.body * 0.55, t0 + opts.dur)
    og.gain.setValueAtTime(opts.vol * 0.9, t0)
    og.gain.exponentialRampToValueAtTime(0.0001, t0 + opts.dur * 1.1)
    o.connect(og).connect(c.destination)
    o.start(t0)
    o.stop(t0 + opts.dur * 1.2)
  }
}

/** nota "campanella": sinusoide con una armonica, attacco morbido e coda lunga */
function chime(freq: number, when: number, dur = 0.5, vol = 0.12) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + when
  for (const [mult, v] of [
    [1, vol],
    [2.01, vol * 0.28],
    [3.97, vol * 0.1],
  ] as const) {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.value = freq * mult
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(v, t0 + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(c.destination)
    o.start(t0)
    o.stop(t0 + dur + 0.05)
  }
}

/** nota bassa e sorda per gli errori */
function thud(freq: number, when: number, dur = 0.3, vol = 0.18) {
  const c = audio()
  if (!c) return
  const t0 = c.currentTime + when
  const o = c.createOscillator()
  const lp = c.createBiquadFilter()
  const g = c.createGain()
  o.type = 'triangle'
  o.frequency.setValueAtTime(freq, t0)
  o.frequency.exponentialRampToValueAtTime(freq * 0.7, t0 + dur)
  lp.type = 'lowpass'
  lp.frequency.value = 700
  g.gain.setValueAtTime(vol, t0)
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  o.connect(lp).connect(g).connect(c.destination)
  o.start(t0)
  o.stop(t0 + dur + 0.05)
}

export const sfx = {
  move: () => knock(0, { freq: 1700 + Math.random() * 300, q: 5, dur: 0.07, vol: 0.55, body: 190 }),
  capture: () => {
    knock(0, { freq: 1300, q: 3.5, dur: 0.1, vol: 0.8, body: 150 })
    knock(0.045, { freq: 2100, q: 5, dur: 0.06, vol: 0.45, body: 240 })
  },
  good: () => {
    chime(784, 0, 0.35, 0.1)
    chime(1175, 0.07, 0.5, 0.1)
  },
  brilliant: () => {
    chime(659, 0, 0.4, 0.1)
    chime(880, 0.09, 0.4, 0.1)
    chime(1319, 0.18, 0.7, 0.12)
    chime(1760, 0.28, 0.8, 0.08)
  },
  bad: () => {
    thud(196, 0, 0.28)
    thud(147, 0.14, 0.4)
  },
  win: () => {
    ;[523, 659, 784, 1047].forEach((f, i) => chime(f, i * 0.11, 0.7, 0.12))
    chime(1568, 0.5, 1.1, 0.1)
  },
  lose: () => {
    ;[392, 330, 262].forEach((f, i) => thud(f, i * 0.2, 0.5, 0.16))
  },
}
