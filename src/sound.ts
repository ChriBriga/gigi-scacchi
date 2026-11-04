import { getState } from './store'

let ctx: AudioContext | null = null

function tone(freq: number, dur: number, type: OscillatorType = 'sine', when = 0, vol = 0.12) {
  if (!getState().settings.sound) return
  try {
    ctx ??= new AudioContext()
    const t0 = ctx.currentTime + when
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, t0)
    g.gain.setValueAtTime(vol, t0)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    o.connect(g).connect(ctx.destination)
    o.start(t0)
    o.stop(t0 + dur)
  } catch {
    /* audio non disponibile */
  }
}

export const sfx = {
  move: () => tone(300, 0.08, 'triangle'),
  capture: () => {
    tone(180, 0.12, 'square', 0, 0.1)
    tone(120, 0.14, 'triangle', 0.02, 0.1)
  },
  good: () => {
    tone(660, 0.1, 'sine')
    tone(880, 0.14, 'sine', 0.08)
  },
  brilliant: () => {
    tone(660, 0.1)
    tone(880, 0.1, 'sine', 0.09)
    tone(1320, 0.22, 'sine', 0.18)
  },
  bad: () => {
    tone(220, 0.16, 'sawtooth', 0, 0.09)
    tone(165, 0.22, 'sawtooth', 0.12, 0.09)
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', i * 0.11)),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, 0.25, 'sawtooth', i * 0.16, 0.08)),
}
