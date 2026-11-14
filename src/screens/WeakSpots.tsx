import { useMemo } from 'react'
import { ArrowLeft, Binoculars, BookOpen, Flag, Notebook as NotebookIcon, PuzzlePiece } from '@phosphor-icons/react'
import { CoachBubble } from '../components/CoachBubble'
import { EmptyState } from '../ui/EmptyState'
import { LESSONS, type Lesson } from '../data/lessons'
import { botById } from '../engine/bots'
import { MISTAKE_INFO, weakSpots, type GameRecord } from '../engine/mistakes'
import { STYLES, type StyleId } from '../engine/style'
import type { Puzzle } from './Puzzles'
import { dueNotebook, useApp } from '../store'

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0)

/** La precisione delle ultime partite come linea (una partita = un punto). */
function AccuracyChart({ history, pick = (g) => g.acc, lo = 0, hi = 100, label = 'Precisione delle ultime partite' }: { history: GameRecord[]; pick?: (g: GameRecord) => number; lo?: number; hi?: number; label?: string }) {
  const pts = history.slice(-15)
  const W = 320
  const H = 90
  const x = (i: number) => (pts.length === 1 ? W / 2 : 14 + (i / (pts.length - 1)) * (W - 28))
  const y = (a: number) => H - 10 - ((a - lo) / Math.max(1, hi - lo)) * (H - 20)
  const d = pts.map((g, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(pick(g)).toFixed(1)}`).join(' ')
  return (
    <svg className="win-graph acc-chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label}>
      <rect x="0" y="0" width={W} height={H} rx="10" className="wg-bg" />
      {[0.25, 0.5, 0.75].map((f) => lo + (hi - lo) * f).map((v) => (
        <line key={v} x1="0" x2={W} y1={y(v)} y2={y(v)} className="wg-mid" />
      ))}
      {pts.length > 1 && <path d={d} className="wg-line" />}
      {pts.map((g, i) => (
        <circle key={g.id} cx={x(i)} cy={y(pick(g))} r="4" className={`acc-dot ${g.outcome}`} />
      ))}
    </svg>
  )
}

/**
 * "Il tuo punto debole": dove perdi più punti nelle ultime partite, come ti stai muovendo e cosa fare per migliorare.
 * Usa lo storico delle partite (precisione + tipo di ogni errore) salvato a fine partita.
 */
export function WeakSpots({
  onExit,
  onLesson,
  onPuzzles,
  onDrills,
  onNotebook,
}: {
  onExit: () => void
  onLesson: (l: Lesson) => void
  onPuzzles: (themes: Puzzle['theme'][], title: string) => void
  onDrills: () => void
  onNotebook: () => void
}) {
  const { progress } = useApp()
  const history = useMemo(() => progress.history ?? [], [progress.history])
  const spots = useMemo(() => weakSpots(history), [history])
  const top = spots[0]
  const info = top ? MISTAKE_INFO[top.kind] : null
  const lesson = info?.lesson ? LESSONS.find((l) => l.id === info.lesson) : undefined
  const due = dueNotebook(progress).length
  const maxPer = Math.max(0.01, ...spots.map((s) => s.perGame))

  const last = history[history.length - 1]
  const recent = history.slice(-5).map((g) => g.acc)
  const before = history.slice(-10, -5).map((g) => g.acc)
  const trend = history.length >= 6 && before.length ? Math.round(mean(recent) - mean(before)) : null

  // come ti va contro ogni stile di gioco
  const byStyle = useMemo(() => {
    const out = new Map<StyleId, { w: number; l: number; d: number }>()
    for (const g of history) {
      const s = botById(g.bot)?.style
      if (!s || s === 'balanced') continue
      const cur = out.get(s) ?? { w: 0, l: 0, d: 0 }
      if (g.outcome === 'win') cur.w++
      else if (g.outcome === 'lose') cur.l++
      else cur.d++
      out.set(s, cur)
    }
    return [...out.entries()].map(([style, r]) => ({ style, ...r, n: r.w + r.l + r.d, rate: (r.w + r.d * 0.5) / (r.w + r.l + r.d) }))
  }, [history])
  const hardest = byStyle.filter((s) => s.n >= 3).sort((a, b) => a.rate - b.rate)[0]

  // minacce dell'avversario nelle ultime partite: quante ne hai parate
  const threats = useMemo(() => {
    const t = { seen: 0, handled: 0, missed: 0, asked: 0, games: 0 }
    for (const g of history.slice(-15)) {
      if (!g.threats) continue
      t.games++
      t.seen += g.threats.seen
      t.handled += g.threats.handled
      t.missed += g.threats.missed
      t.asked += g.threats.asked
    }
    return t.seen >= 3 ? t : null
  }, [history])

  // statistiche più ricche: vantaggio sprecato, rimonte, fasi, colore, punteggio (solo le partite che hanno i dati)
  const stats = useMemo(() => {
    const withPeak = history.filter((g) => g.peak !== undefined && g.low !== undefined)
    const wasted = withPeak.filter((g) => g.peak! >= 80 && g.outcome !== 'win')
    const comebacks = withPeak.filter((g) => g.low! <= 20 && g.outcome === 'win')
    const winning = withPeak.filter((g) => g.peak! >= 80)
    const avgPhase = (k: 'o' | 'm' | 'e') => {
      const v = history.map((g) => g.ph?.[k]).filter((x): x is number => x !== undefined)
      return v.length >= 2 ? Math.round(mean(v)) : null
    }
    const color = (c: 'w' | 'b') => {
      const gs = history.filter((g) => g.color === c)
      return gs.length >= 2 ? { n: gs.length, acc: Math.round(mean(gs.map((g) => g.acc))), wins: gs.filter((g) => g.outcome === 'win').length } : null
    }
    const rated = history.filter((g) => g.rating !== undefined)
    return {
      games: withPeak.length,
      wasted: wasted.length,
      winning: winning.length,
      comebacks: comebacks.length,
      phases: { o: avgPhase('o'), m: avgPhase('m'), e: avgPhase('e') },
      w: color('w'),
      b: color('b'),
      rated,
    }
  }, [history])

  const header = (
    <div className="topbar">
      <button className="ghost" onClick={onExit}>
        <ArrowLeft size={20} weight="bold" /> Esci
      </button>
      <div className="title">
        <Binoculars size={24} weight="duotone" /> Il tuo punto debole
      </div>
    </div>
  )

  if (history.length < 2) {
    return (
      <div className="screen">
        {header}
        <div className="card">
          <EmptyState
            text={
              history.length === 0
                ? 'Non ho ancora abbastanza partite per dirti dove perdi punti. Gioca un paio di partite con il giudizio acceso e torna qui.'
                : 'Una partita sola non basta per capire un andamento. Giocane ancora una e ti dico cosa non va.'
            }
            mood="thinking"
            action={
              <button className="btn primary" onClick={onExit}>
                Va bene
              </button>
            }
          />
        </div>
      </div>
    )
  }

  const verdict = top
    ? `Nelle ultime ${Math.min(history.length, 15)} partite perdi più punti qui: ${info!.label.toLowerCase()} (${top.count} ${top.count === 1 ? 'volta' : 'volte'}). ${info!.tip}`
    : 'Nelle ultime partite non ho trovato errori gravi: ottimo lavoro. Continua così e prova un avversario più forte.'

  return (
    <div className="screen weak">
      {header}

      <div className="hero">
        <CoachBubble text={verdict} mood={top ? 'smug' : 'happy'} size={96}>
          {top && info && (
            <div className="row">
              {lesson && (
                <button className="btn" onClick={() => onLesson(lesson)}>
                  <BookOpen size={18} weight="bold" /> Lezione: {lesson.title}
                </button>
              )}
              {info.themes && (
                <button className="btn primary" onClick={() => onPuzzles(info.themes!, info.label)}>
                  <PuzzlePiece size={18} weight="fill" /> Allena con i puzzle
                </button>
              )}
              {info.drills && (
                <button className="btn primary" onClick={onDrills}>
                  <Flag size={18} weight="fill" /> Finali contro il bot
                </button>
              )}
            </div>
          )}
        </CoachBubble>
      </div>

      <div className="weak-grid">
        <div className="card">
          <h3>Dove perdi punti</h3>
          {spots.length === 0 ? (
            <p className="muted" style={{ margin: 0 }}>
              Nessun errore grave nelle ultime partite.
            </p>
          ) : (
            <div className="weak-bars">
              {spots.map((s) => (
                <div className="weak-row" key={s.kind}>
                  <span className="weak-label">{MISTAKE_INFO[s.kind].label}</span>
                  <span className="weak-track">
                    <i style={{ width: `${Math.max(6, (s.perGame / maxPer) * 100)}%` }} />
                  </span>
                  <b>{s.perGame.toFixed(1)}</b>
                </div>
              ))}
              <small className="muted">errori gravi per partita, ultime {Math.min(history.length, 15)} partite</small>
            </div>
          )}
          {due > 0 && (
            <button className="btn" style={{ marginTop: 12 }} onClick={onNotebook}>
              <NotebookIcon size={18} weight="duotone" /> {due === 1 ? '1 errore' : `${due} errori`} sul quaderno da ripassare
            </button>
          )}
        </div>

        <div className="card">
          <h3>Precisione</h3>
          <div className="acc-head">
            <b className="acc-big">{last.acc}%</b>
            <span className="muted">nell’ultima partita</span>
            {trend !== null && (
              <span className={`badge-pill ${trend >= 0 ? 'ok' : 'tip'}`}>
                {trend >= 0 ? '+' : ''}
                {trend}% sulle 5 partite prima
              </span>
            )}
          </div>
          <AccuracyChart history={history} />
          <small className="muted">Ogni punto è una partita (verde vittoria, rosso sconfitta). La precisione dice quanto vicino alle mosse migliori hai giocato.</small>
        </div>

        {stats.games >= 3 && (
          <div className="card">
            <h3>Vantaggi e rimonte</h3>
            <div className="stats">
              <div className="stat">
                <b>{stats.wasted}</b> vantaggi sprecati
              </div>
              <div className="stat">
                <b>{stats.comebacks}</b> {stats.comebacks === 1 ? 'rimonta' : 'rimonte'}
              </div>
            </div>
            <small className="muted">
              {stats.winning > 0
                ? `Su ${stats.winning} ${stats.winning === 1 ? 'partita' : 'partite'} in cui eri in netto vantaggio, ${stats.winning - stats.wasted} ${stats.winning - stats.wasted === 1 ? 'è finita' : 'sono finite'} con una vittoria.`
                : 'Non sei ancora stato in netto vantaggio in queste partite.'}
              {stats.wasted > 0 ? ' Per trasformare un vantaggio in vittoria, allenati sui finali contro il bot.' : ''}
            </small>
          </div>
        )}

        {(stats.phases.o !== null || stats.phases.m !== null || stats.phases.e !== null) && (
          <div className="card">
            <h3>Per fase e per colore</h3>
            <div className="weak-bars">
              {([['o', 'Apertura'], ['m', 'Mediogioco'], ['e', 'Finale']] as const).map(([k, name]) =>
                stats.phases[k] === null ? null : (
                  <div className="weak-row" key={k}>
                    <span className="weak-label">{name}</span>
                    <span className="weak-track">
                      <i style={{ width: `${Math.max(6, stats.phases[k]!)}%` }} />
                    </span>
                    <b>{stats.phases[k]}%</b>
                  </div>
                ),
              )}
              {([['w', 'Con il bianco'], ['b', 'Con il nero']] as const).map(([k, name]) =>
                stats[k] === null ? null : (
                  <div className="weak-row" key={k}>
                    <span className="weak-label">{name}</span>
                    <span className="weak-track">
                      <i style={{ width: `${Math.max(6, stats[k]!.acc)}%` }} />
                    </span>
                    <b>{stats[k]!.acc}%</b>
                  </div>
                ),
              )}
              <small className="muted">precisione media; apertura = mosse 1-10, mediogioco 11-25, finale dalla 26ª</small>
            </div>
          </div>
        )}

        {stats.rated.length >= 2 && (
          <div className="card">
            <h3>Punteggio nel tempo</h3>
            <div className="acc-head">
              <b className="acc-big">{stats.rated[stats.rated.length - 1].rating}</b>
              <span className="muted">dopo {stats.rated.length} partite valide</span>
            </div>
            <AccuracyChart
              history={stats.rated}
              pick={(g) => g.rating!}
              lo={Math.min(...stats.rated.slice(-15).map((g) => g.rating!)) - 20}
              hi={Math.max(...stats.rated.slice(-15).map((g) => g.rating!)) + 20}
              label="Punteggio delle ultime partite"
            />
            <small className="muted">Conta solo Senza rete e Torneo. È un punteggio interno di Gigi, non un Elo vero.</small>
          </div>
        )}

        {threats && (
          <div className="card">
            <h3>Minacce dell’avversario</h3>
            <div className="acc-head">
              <b className="acc-big">{Math.round((threats.handled / Math.max(1, threats.handled + threats.missed)) * 100)}%</b>
              <span className="muted">parate su {threats.handled + threats.missed}</span>
            </div>
            <small className="muted">
              Pezzi in presa e matti in arrivo che l’avversario ti ha messo davanti, nelle ultime {threats.games} partite
              {threats.asked > 0 ? `; hai premuto T ${threats.asked} ${threats.asked === 1 ? 'volta' : 'volte'}` : ''}.
              {threats.missed > threats.handled ? ' Prima di muovere chiediti sempre: cosa vuole fare lui?' : ''}
            </small>
          </div>
        )}

        {byStyle.length > 0 && (
          <div className="card">
            <h3>Contro ogni stile</h3>
            <div className="weak-bars">
              {byStyle.map((s) => (
                <div className="weak-row" key={s.style}>
                  <span className="weak-label">{STYLES[s.style].label}</span>
                  <span className="weak-track">
                    <i style={{ width: `${Math.max(6, s.rate * 100)}%` }} />
                  </span>
                  <b title="vittorie / patte / sconfitte">
                    {s.w}-{s.d}-{s.l}
                  </b>
                </div>
              ))}
            </div>
            {hardest && (
              <p className="review-note" style={{ marginBottom: 0 }}>
                Contro lo stile {STYLES[hardest.style].label.toLowerCase()} fai più fatica. {STYLES[hardest.style].tip}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
