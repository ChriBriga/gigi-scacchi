import { useState } from 'react'
import { Check, Download, Eye, EyeSlash, Export, Key, PlugsConnected, Palette, Smiley, SpeakerHigh } from '@phosphor-icons/react'
import { exportCode, importCode, update, useApp, type DangerMode } from '../store'
import type { Mood, Tone } from '../coach/lines'
import { explainWithGemini, lastModelUsed } from '../coach/gemini'
import { Pigeon } from '../coach/Pigeon'
import { TONE_ICON } from '../components/icons'
import { THEMES, type ThemeId } from '../themes'

const MOODS: [Mood, string][] = [
  ['neutral', 'Normale'],
  ['happy', 'Felice'],
  ['cool', 'Figo'],
  ['shocked', 'Sotto choc'],
  ['angry', 'Furioso'],
]

export function Settings() {
  const { settings } = useApp()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [keyMsg, setKeyMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const set = <K extends keyof typeof settings>(k: K, v: (typeof settings)[K]) =>
    update((s) => {
      s.settings[k] = v
    })

  const tones: [Tone, string][] = [
    ['gentle', 'Gentile'],
    ['spicy', 'Pepato'],
    ['ruthless', 'Spietato'],
  ]

  return (
    <div className="screen">
      <h2>Impostazioni</h2>

      <section className="card">
        <h3>
          <Palette size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Tema
        </h3>
        <div className="theme-grid">
          {THEMES.map((t) => (
            <button key={t.id} className={`theme-card${settings.theme === t.id ? ' on' : ''}`} onClick={() => set('theme', t.id as ThemeId)}>
              <div className="pv" style={{ background: t.preview.bg }}>
                <div className="sqs">
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <i key={i} style={{ background: (i + Math.floor(i / 4)) % 2 ? t.preview.dark : t.preview.light }} />
                  ))}
                </div>
                <div className="acc" style={{ background: t.preview.accent }} />
              </div>
              <strong>{t.name}</strong>
              <small>{t.blurb}</small>
              {settings.theme === t.id && (
                <span className="tick">
                  <Check size={14} weight="bold" />
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <div className="settings-grid">
        <section className="card">
          <h3>
            <Smiley size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            Come ti tratta Gigi
          </h3>
          <div className="seg">
            {tones.map(([t, l]) => {
              const I = TONE_ICON[t]
              return (
                <button key={t} className={settings.tone === t ? 'on' : ''} onClick={() => set('tone', t)}>
                  <I size={20} weight="fill" /> {l}
                </button>
              )
            })}
          </div>
          <div className="moods">
            {MOODS.map(([m, l]) => (
              <div key={m}>
                <Pigeon mood={m} size={80} />
                {l}
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <h3>
            <Eye size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            Partita
          </h3>
          <p className="muted" style={{ marginTop: 0 }}>
            Mappa del pericolo
          </p>
          <div className="seg">
            {(
              [
                ['off', 'Spenta'],
                ['threats', 'Minacce'],
                ['full', 'Completa'],
              ] as [DangerMode, string][]
            ).map(([t, l]) => (
              <button key={t} className={settings.danger === t ? 'on' : ''} onClick={() => set('danger', t)}>
                {l}
              </button>
            ))}
          </div>
          <label className="switch">
            <span>Giudica ogni mossa (e ti lascia ritirare gli errori)</span>
            <input type="checkbox" checked={settings.liveJudging} onChange={(e) => set('liveJudging', e.target.checked)} />
          </label>
          <label className="switch">
            <span>
              <SpeakerHigh size={18} weight="duotone" style={{ verticalAlign: -3, marginRight: 6 }} />
              Suoni
            </span>
            <input type="checkbox" checked={settings.sound} onChange={(e) => set('sound', e.target.checked)} />
          </label>
        </section>

        <section className="card">
          <h3>
            <Key size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            Chiave Gemini (facoltativa)
          </h3>
          <p className="muted">Serve per le spiegazioni a parole. Resta salvata solo su questo dispositivo. Si crea gratis su Google AI Studio.</p>
          <div style={{ position: 'relative' }}>
            <input
              className="text"
              type={showKey ? 'text' : 'password'}
              placeholder="Incolla qui la tua chiave"
              value={settings.geminiKey}
              onChange={(e) => set('geminiKey', e.target.value.trim())}
              style={{ marginTop: 0, paddingRight: 44 }}
            />
            <button
              className="ghost"
              style={{ position: 'absolute', right: 4, top: 6 }}
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Nascondi chiave' : 'Mostra chiave'}
            >
              {showKey ? <EyeSlash size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <button
              className="btn"
              disabled={!settings.geminiKey || testing}
              onClick={async () => {
                setTesting(true)
                setKeyMsg('Provo…')
                const r = await explainWithGemini(settings.geminiKey, {
                  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
                  playedSan: 'e4',
                  quality: 'Migliore',
                  tone: settings.tone,
                  facts: ['Il pedone si è spostato al centro.'],
                })
                setTesting(false)
                setKeyMsg(r ? `Funziona! Modello usato: ${lastModelUsed}` : 'Nessun modello ha risposto: controlla la chiave o riprova tra poco.')
              }}
            >
              <PlugsConnected size={20} weight="duotone" /> Prova la chiave
            </button>
          </div>
          {keyMsg && <p className="muted">{keyMsg}</p>}
        </section>

        <section className="card">
          <h3>Progressi tra PC e telefono</h3>
          <p className="muted">Copia il codice da un dispositivo e incollalo nell’altro.</p>
          <div className="row">
            <button
              className="btn"
              onClick={() => {
                const c = exportCode()
                setCode(c)
                navigator.clipboard?.writeText(c).then(
                  () => setMsg('Codice copiato!'),
                  () => setMsg('Copialo a mano qui sotto.'),
                )
              }}
            >
              <Export size={20} weight="duotone" /> Esporta
            </button>
            <button className="btn" onClick={() => setMsg(importCode(code) ? 'Progressi importati!' : 'Codice non valido.')}>
              <Download size={20} weight="duotone" /> Importa
            </button>
          </div>
          <textarea className="text" rows={3} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Codice di sincronizzazione" />
          {msg && <p className="muted">{msg}</p>}
        </section>
      </div>
    </div>
  )
}
