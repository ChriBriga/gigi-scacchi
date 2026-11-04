import { useState } from 'react'
import { exportCode, importCode, update, useApp, type DangerMode } from '../store'
import type { Tone } from '../coach/lines'
import { explainWithGemini, lastModelUsed } from '../coach/gemini'

export function Settings() {
  const { settings } = useApp()
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [keyMsg, setKeyMsg] = useState('')
  const [testing, setTesting] = useState(false)

  const set = <K extends keyof typeof settings>(k: K, v: (typeof settings)[K]) =>
    update((s) => {
      s.settings[k] = v
    })

  return (
    <div className="screen">
      <h2>Impostazioni</h2>

      <section className="card">
        <h3>Come ti tratta Gigi</h3>
        <div className="seg">
          {(
            [
              ['gentle', '😇 Gentile'],
              ['spicy', '🌶️ Pepato'],
              ['ruthless', '😈 Spietato'],
            ] as [Tone, string][]
          ).map(([t, l]) => (
            <button key={t} className={settings.tone === t ? 'on' : ''} onClick={() => set('tone', t)}>
              {l}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Mappa del pericolo</h3>
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
        <label className="check">
          <input type="checkbox" checked={settings.liveJudging} onChange={(e) => set('liveJudging', e.target.checked)} />
          Giudica ogni mossa mentre gioco (con “ritira la mossa” se sbagli)
        </label>
        <label className="check">
          <input type="checkbox" checked={settings.sound} onChange={(e) => set('sound', e.target.checked)} />
          Suoni
        </label>
      </section>

      <section className="card">
        <h3>Chiave Gemini (facoltativa)</h3>
        <p className="muted">
          Serve per le spiegazioni a parole. Resta salvata solo su questo dispositivo. Si crea gratis su Google AI Studio.
        </p>
        <input
          className="text"
          type="password"
          placeholder="Incolla qui la tua chiave"
          value={settings.geminiKey}
          onChange={(e) => set('geminiKey', e.target.value.trim())}
        />
        <div className="row" style={{ marginTop: 8 }}>
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
            🔌 Prova la chiave
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
              navigator.clipboard?.writeText(c).then(() => setMsg('Codice copiato!'), () => setMsg('Copialo a mano qui sotto.'))
            }}
          >
            📤 Esporta
          </button>
          <button
            className="btn"
            onClick={() => {
              setMsg(importCode(code) ? 'Progressi importati!' : 'Codice non valido.')
            }}
          >
            📥 Importa
          </button>
        </div>
        <textarea className="text" rows={3} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Codice di sincronizzazione" />
        {msg && <p className="muted">{msg}</p>}
      </section>
    </div>
  )
}
