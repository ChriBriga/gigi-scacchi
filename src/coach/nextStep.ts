import { LESSONS, type Lesson } from '../data/lessons'
import { BOTS, botByRank, type Bot } from '../engine/bots'
import { MISTAKE_INFO, type GameRecord, type MistakeKind } from '../engine/mistakes'
import type { Puzzle } from '../screens/Puzzles'
import { dueNotebook, gameModeInfo, medalOf, type GameMode, type Progress } from '../store'

/** Il consiglio di fine partita: una sola cosa da fare adesso, con il motivo. */
export type NextStep = { title: string; why: string; cta: string } & (
  | { kind: 'bot'; bot: Bot; mode: GameMode }
  | { kind: 'puzzles'; themes: Puzzle['theme'][]; puzzleTitle: string }
  | { kind: 'lesson'; lesson: Lesson }
  | { kind: 'notebook' }
)

export interface FinishedGame {
  bot: Bot
  mode: GameMode
  outcome: 'win' | 'lose' | 'draw'
  retracts: number
  /** il riassunto della partita, se è durata abbastanza da averne uno */
  rec: GameRecord | null
}

const play = (bot: Bot, mode: GameMode, title: string, why: string): NextStep => ({ kind: 'bot', bot, mode, title, why, cta: `Gioca contro ${bot.name}` })

/**
 * Cosa conviene fare dopo questa partita. Regole semplici sullo storico, niente AI:
 * se vinci sali (o togli la rete), se perdi tre volte scendi, se ripeti lo stesso errore lo alleni.
 */
export function nextStep(p: Progress, g: FinishedGame): NextStep {
  const { bot, mode } = g
  const acc = g.rec ? Math.round(g.rec.acc) : null
  const up = bot.rank < BOTS.length ? botByRank(bot.rank + 1) : null
  const down = bot.rank > 1 ? botByRank(bot.rank - 1) : null
  const modeName = gameModeInfo(mode).name

  if (g.outcome === 'win') {
    if (mode === 'training' && g.retracts >= 2)
      return play(bot, 'nonet', `Rigioca ${bot.name} Senza rete`, `Hai vinto, ma ritirando ${g.retracts} mosse. Senza rete scopri se lo batti anche quando gli errori restano: vale la medaglia d’argento.`)
    if (mode !== 'training' && acc !== null && acc < 70)
      return play(bot, mode, `Un’altra contro ${bot.name}`, `Vittoria vera, ma con precisione ${acc}%: una conferma prima di salire non guasta.`)
    if (up)
      return play(up, mode, `Sali di un gradino: ${up.name}`, `${mode === 'training' ? 'Hai vinto quasi senza ritirare mosse' : `Hai vinto in ${modeName}`}${acc !== null ? ` (precisione ${acc}%)` : ''}. È ora di un avversario più forte.`)
    if (medalOf(p, bot.id) < 3) return play(bot, 'tournament', 'Manca solo l’oro', `Hai battuto ${bot.name}, il più forte. Riprovaci in Torneo: nessun aiuto, nessun commento.`)
    return play(bot, mode, 'Non c’è più nessuno sopra', `Hai l’oro contro ${bot.name}. Puoi solo rifarlo.`)
  }

  // tre sconfitte di fila: meglio ritrovare fiducia un gradino più giù
  const last3 = (p.history ?? []).slice(-3)
  if (g.outcome === 'lose' && down && last3.length === 3 && last3.every((r) => r.outcome === 'lose'))
    return play(down, mode, `Scendi di un gradino: ${down.name}`, 'Tre sconfitte di fila. Una partita contro un avversario più abbordabile ti rimette in carreggiata, poi risali.')

  // lo stesso tipo di errore più volte in questa partita, o in tre partite di fila: si allena quello
  if (g.rec) {
    const kinds = (Object.entries(g.rec.kinds) as [MistakeKind, number][]).filter(([k]) => k !== 'other').sort((a, b) => b[1] - a[1])
    const top = kinds[0]
    if (top) {
      const [kind, n] = top
      const prev = (p.history ?? []).filter((r) => r.id !== g.rec!.id).slice(-2)
      const streak = prev.length === 2 && prev.every((r) => (r.kinds[kind] ?? 0) > 0)
      if (n >= 2 || streak) {
        const info = MISTAKE_INFO[kind]
        const what = streak ? `Terza partita di fila con questo errore: ${info.label.toLowerCase()}.` : `In questa partita ${n} volte lo stesso errore: ${info.label.toLowerCase()}.`
        const lesson = info.lesson ? LESSONS.find((l) => l.id === info.lesson) : undefined
        if (lesson && !p.lessonsDone.includes(lesson.id)) return { kind: 'lesson', lesson, title: `Lezione: ${lesson.title}`, why: `${what} Due minuti di lezione, poi torni a giocare.`, cta: 'Apri la lezione' }
        if (info.themes?.length) return { kind: 'puzzles', themes: info.themes, puzzleTitle: `Allenamento: ${info.label}`, title: '5 puzzle sul tuo punto debole', why: `${what} ${info.tip}`, cta: 'Fai 5 puzzle' }
      }
    }
  }

  const due = dueNotebook(p).length
  if (due > 0) return { kind: 'notebook', title: 'Ripassa il quaderno', why: `${due === 1 ? 'C’è 1 errore' : `Ci sono ${due} errori`} da ripassare oggi: sono posizioni delle tue partite, meglio fissarle prima di rigiocare.`, cta: 'Apri il quaderno' }

  if (mode !== 'training' && acc !== null && acc < 60)
    return play(bot, 'training', `Rigioca ${bot.name} in Allenamento`, `Precisione ${acc}% in ${modeName}: qui gli errori sono ancora tanti. Una partita con gli avvisi ti fa vedere dove nascono.`)

  return play(bot, mode, `Rivincita contro ${bot.name}`, g.outcome === 'draw' ? 'Patta: eri vicino. Un’altra partita e la porti a casa.' : 'Niente di ripetuto negli errori: è il livello giusto per te, riprovaci.')
}
