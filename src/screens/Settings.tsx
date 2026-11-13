import { useRef, useState } from 'react'
import { ArrowsClockwise, ChalkboardTeacher, Check, Checkerboard, CloudCheck, CloudSlash, Download, Eye, EyeSlash, Export, GoogleLogo, Key, Lightning, Lock, PlugsConnected, Palette, Smiley, SpeakerHigh, UserCircle } from '@phosphor-icons/react'
import { FX_LABEL, setFxPref, useFx, type FxPref } from '../perf'
import { BOARD_STYLES, PIECE_SETS, pieceUrl } from '../chess/look'
import { canVibrate } from '../haptics'
import { COACHES, activeCoach, coachInfo, coachUnlocked } from '../coach/coaches'
import { exportCode, importCode, update, useApp, type DangerMode } from '../store'
import { ensureVoice, type Mood, type Tone } from '../coach/lines'
import { explainWithGemini, lastModelUsed } from '../coach/gemini'
import { Pigeon } from '../coach/Pigeon'
import { TONE_ICON } from '../components/icons'
import { THEMES, type ThemeId } from '../themes'
import { Wardrobe } from '../components/Wardrobe'
import { AvatarFace, PIECE_AVATARS, useProfile } from '../components/Avatar'
import { BOTS } from '../engine/bots'
import { sfx } from '../sound'
import { useOnline } from '../net'
import { signIn, signOutSync, syncNow, useSyncStatus } from '../sync/cloud'

const MOODS: [Mood, string][] = [
  ['neutral', 'Normale'],
  ['happy', 'Felice'],
  ['cool', 'Figo'],
  ['shocked', 'Sotto choc'],
  ['angry', 'Furioso'],
  ['confused', 'Dubbioso'],
  ['smug', 'Compiaciuto'],
  ['thinking', 'Pensieroso'],
  ['sad', 'Triste'],
  ['sleepy', 'Assonnato'],
]

type Tab = 'profilo' | 'aspetto' | 'coach' | 'partita' | 'dati'
const TABS: [Tab, string][] = [
  ['profilo', 'Profilo'],
  ['aspetto', 'Aspetto'],
  ['coach', 'Coach'],
  ['partita', 'Partita'],
  ['dati', 'Dati'],
]

export function Settings() {
  const { settings, progress } = useApp()
  const profile = useProfile()
  const online = useOnline()
  const coachNow = activeCoach(settings, progress)
  const coachName = coachInfo(coachNow).name
  const [code, setCode] = useState('')
  const [msg, setMsg] = useState('')
  const [keyMsg, setKeyMsg] = useState('')
  const [testing, setTesting] = useState(false)
  const [showKey, setShowKey] = useState(false)
  const sync = useSyncStatus()
  const fx = useFx()
  const [hotMood, setHotMood] = useState<Mood | null>(null)
  const [tab, setTab] = useState<Tab>('profilo')
  const top = useRef<HTMLDivElement>(null)
  const goTab = (t: Tab) => {
    setTab(t)
    // il contenitore che scorre è <main>: si torna in cima
    top.current?.closest('main')?.scrollTo(0, 0)
  }
  const vol = settings.sound ? Math.round((settings.volume ?? 0.7) * 100) : 0

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
    <div className="screen" ref={top}>
      <h2>Impostazioni</h2>

      <div className="seg set-tabs" role="tablist" aria-label="Sezioni delle impostazioni">
        {TABS.map(([t, l]) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? 'on' : ''} onClick={() => goTab(t)}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'profilo' && (

      <section className="card">
        <h3>
          <UserCircle size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Il tuo profilo
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Nome e avatar compaiono nella barra a sinistra. {profile.photo ? 'La foto di Google è disponibile come avatar.' : 'Con l’accesso Google puoi usare anche la tua foto.'}
        </p>
        <input
          className="text"
          placeholder={sync.name?.split(' ')[0] ?? 'Come ti chiami?'}
          maxLength={18}
          value={settings.nickname}
          onChange={(e) => set('nickname', e.target.value)}
          aria-label="Il tuo nome"
        />
        <div className="avatar-grid">
          {profile.photo && (
            <button className={`avatar-opt${settings.avatar === 'google' ? ' on' : ''}`} onClick={() => set('avatar', 'google')} aria-label="Foto di Google" title="La tua foto di Google">
              <AvatarFace kind="google" photo={profile.photo} size={54} />
            </button>
          )}
          <button className={`avatar-opt${settings.avatar === 'gigi' ? ' on' : ''}`} onClick={() => set('avatar', 'gigi')} aria-label="Gigi" title="Gigi">
            <AvatarFace kind="gigi" size={54} />
          </button>
          {COACHES.filter((c) => c.id !== 'gigi' && coachUnlocked(c, progress)).map((c) => (
            <button key={c.id} className={`avatar-opt${settings.avatar === `coach:${c.id}` ? ' on' : ''}`} onClick={() => set('avatar', `coach:${c.id}`)} aria-label={c.name} title={c.name}>
              <AvatarFace kind={`coach:${c.id}`} size={54} />
            </button>
          ))}
          {PIECE_AVATARS.map((p) => (
            <button key={p} className={`avatar-opt${settings.avatar === `piece:${p}` ? ' on' : ''}`} onClick={() => set('avatar', `piece:${p}`)} aria-label={`Pezzo ${p}`}>
              <AvatarFace kind={`piece:${p}`} size={54} />
            </button>
          ))}
          {BOTS.map((b) => {
            const ok = progress.botsBeaten.includes(b.id)
            return (
              <button
                key={b.id}
                className={`avatar-opt${settings.avatar === `bot:${b.id}` ? ' on' : ''}${ok ? '' : ' locked'}`}
                disabled={!ok}
                onClick={() => set('avatar', `bot:${b.id}`)}
                aria-label={b.name}
                title={ok ? b.name : `Batti ${b.name} per sbloccarlo`}
              >
                <AvatarFace kind={`bot:${b.id}`} size={54} />
              </button>
            )
          })}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>Gli avversari battuti diventano avatar.</p>
      </section>
      )}

      {tab === 'aspetto' && (
      <>
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

      <section className="card">
        <h3>
          <Checkerboard size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Scacchiera e pezzi
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Colori della scacchiera
        </p>
        <div className="look-grid">
          {BOARD_STYLES.map((b) => (
            <button key={b.id} className={`look-opt${settings.board === b.id ? ' on' : ''}`} onClick={() => set('board', b.id)} aria-pressed={settings.board === b.id}>
              <span className="look-board" style={b.light ? ({ ['--light' as string]: b.light, ['--dark' as string]: b.dark } as React.CSSProperties) : undefined}>
                <i />
                <i />
                <i />
                <i />
              </span>
              <small>{b.name}</small>
            </button>
          ))}
        </div>
        <p className="muted">Stile dei pezzi</p>
        <div className="look-grid">
          {PIECE_SETS.map((p) => (
            <button key={p.id} className={`look-opt${settings.pieces === p.id ? ' on' : ''}`} onClick={() => set('pieces', p.id)} aria-pressed={settings.pieces === p.id}>
              <span className="look-pieces">
                <img src={pieceUrl(p.id, 'w', 'n')} alt="" />
                <img src={pieceUrl(p.id, 'b', 'q')} alt="" />
              </span>
              <small>{p.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>
          <Lightning size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Effetti e fluidità
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          {fx.pref === 'auto' ? `Scelto in automatico per questo dispositivo: ${FX_LABEL[fx.tier]}.` : `Hai scelto: ${FX_LABEL[fx.tier]}.`} Se l’app scatta, scegli Leggero.
        </p>
        <div className="seg seg4">
          {(
            [
              ['auto', 'Auto'],
              ['low', FX_LABEL.low],
              ['mid', FX_LABEL.mid],
              ['high', FX_LABEL.high],
            ] as [FxPref, string][]
          ).map(([p, l]) => (
            <button key={p} className={fx.pref === p ? 'on' : ''} onClick={() => setFxPref(p)}>
              {l}
            </button>
          ))}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>
          Leggero: meno animazioni e ombre, motore più veloce. Spettacolare: scintille sulle catture, onde, bagliore dello scacco, passaggi fra schermate e coriandoli del coach. Questa scelta resta solo su questo dispositivo.
        </p>
        {canVibrate() && (
          <label className="switch">
            <span>Vibrazione (non nel livello Leggero)</span>
            <input type="checkbox" checked={settings.haptics} onChange={(e) => set('haptics', e.target.checked)} />
          </label>
        )}
      </section>
      </>
      )}

      {tab === 'coach' && (
      <>
      <section className="card">
        <h3>
          <ChalkboardTeacher size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
          Il tuo coach
        </h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Ogni coach ha il suo modo di parlare, ma tutti ti trattano come scegli qui sotto. Gli altri si sbloccano giocando.
        </p>
        <div className="coach-grid">
          {COACHES.map((c) => {
            const ok = coachUnlocked(c, progress)
            const on = coachNow === c.id
            const have = Math.min(c.need, c.have(progress))
            return (
              <button key={c.id} className={`coach-card${on ? ' on' : ''}${ok ? '' : ' locked'}`} disabled={!ok} onClick={() => void ensureVoice(c.id).then(() => set('coach', c.id))} title={ok ? c.name : c.how}>
                <span className="coach-portrait">
                  <Pigeon mood={on ? 'happy' : 'cool'} coach={c.id} size={104} still={!on} />
                </span>
                <strong>{c.name}</strong>
                {ok ? (
                  <small>{c.blurb}</small>
                ) : (
                  <>
                    <small>{c.how}</small>
                    <span className="item-progress">
                      <span className="bar">
                        <i style={{ width: `${Math.max(4, (have / c.need) * 100)}%` }} />
                      </span>
                      <small>
                        {have}/{c.need}
                      </small>
                    </span>
                  </>
                )}
                {on && (
                  <span className="item-tick">
                    <Check size={14} weight="bold" />
                  </span>
                )}
                {!ok && (
                  <span className="item-lock">
                    <Lock size={14} weight="fill" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      <Wardrobe />

      <section className="card">
          <h3>
            <Smiley size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            Come ti tratta {coachName}
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
              <div key={m} onPointerEnter={() => setHotMood(m)} onPointerLeave={() => setHotMood(null)}>
                {/* ferme finché non le tocchi: 10 piccioni animati insieme pesano sui telefoni */}
                <Pigeon mood={m} size={80} still={hotMood !== m} />
                {l}
              </div>
            ))}
          </div>
        </section>
      </>
      )}

      {tab === 'partita' && (
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
            <span>Barra di valutazione accanto alla scacchiera</span>
            <input type="checkbox" checked={settings.evalBar} onChange={(e) => set('evalBar', e.target.checked)} />
          </label>
          <div className="vol-row">
            <label htmlFor="vol">
              <SpeakerHigh size={18} weight="duotone" style={{ verticalAlign: -3, marginRight: 6 }} />
              Suoni
            </label>
            <input
              id="vol"
              className="vol"
              type="range"
              min={0}
              max={100}
              step={5}
              value={vol}
              style={{ ['--v' as string]: `${vol}%` }}
              aria-valuetext={vol === 0 ? 'Muto' : `${vol}%`}
              onChange={(e) => {
                const n = Number(e.target.value)
                update((st) => {
                  st.settings.volume = n / 100
                  st.settings.sound = n > 0
                })
              }}
              onPointerUp={() => sfx.move()}
              onKeyUp={(e) => {
                if (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End') sfx.move()
              }}
            />
            <output htmlFor="vol">{vol}%</output>
          </div>
        </section>
      )}

      {tab === 'dati' && (
      <>
        {!online && (
          <p className="muted" role="status">
            <CloudSlash size={16} weight="duotone" style={{ verticalAlign: -3, marginRight: 6 }} />
            Sei offline: si gioca lo stesso, ma la sincronizzazione e le spiegazioni di Gemini aspettano la rete.
          </p>
        )}
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
          <h3>
            {sync.phase === 'unconfigured' ? (
              <CloudSlash size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            ) : (
              <CloudCheck size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
            )}
            Sincronizzazione con Google
          </h3>
          {sync.phase === 'unconfigured' && (
            <p className="muted">Non è ancora attiva su questa versione dell’app. Nel frattempo puoi usare il codice qui sotto.</p>
          )}
          {sync.phase === 'signedOut' && (
            <>
              <p className="muted">Accedi con Google e i progressi (lezioni, puzzle, XP, tema, accessori) restano uguali su PC e telefono, in automatico. La chiave Gemini non viene mai inviata.</p>
              <button className="btn primary" onClick={() => void signIn()}>
                <GoogleLogo size={20} weight="bold" /> Accedi con Google
              </button>
            </>
          )}
          {(sync.phase === 'working' || sync.phase === 'ok' || sync.phase === 'error') && (
            <>
              <p className="muted" style={{ marginTop: 0 }}>
                {sync.email ? `Collegato come ${sync.email}. ` : ''}
                {sync.phase === 'working' && 'Sincronizzo…'}
                {sync.phase === 'ok' && sync.last && `Aggiornato alle ${new Date(sync.last).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}. I cambiamenti si salvano da soli.`}
                {sync.phase === 'error' && (sync.message ?? 'Qualcosa non va.')}
              </p>
              <div className="row">
                <button className="btn" onClick={() => void syncNow()} disabled={sync.phase === 'working'}>
                  <ArrowsClockwise size={20} weight="bold" /> Sincronizza ora
                </button>
                <button className="btn" onClick={() => void signOutSync()}>
                  Esci
                </button>
              </div>
            </>
          )}
          {sync.phase === 'signedOut' && sync.message && <p className="muted">{sync.message}</p>}
        </section>

        <section className="card">
          <h3>Progressi con un codice</h3>
          <p className="muted">Alternativa manuale: copia il codice da un dispositivo e incollalo nell’altro.</p>
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
      </>
      )}
    </div>
  )
}
