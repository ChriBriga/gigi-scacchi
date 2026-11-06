import type { Tone } from './lines'

const API = 'https://generativelanguage.googleapis.com/v1beta'

interface ModelInfo {
  name: string
  supportedGenerationMethods?: string[]
}

/** Ultimo modello che ha risposto (per mostrarlo nelle impostazioni). */
export let lastModelUsed = ''

let modelOrder: string[] | null = null
let modelOrderKey = ''
const dead = new Map<string, number>()

function versionOf(name: string): number {
  const m = /(\d+(?:\.\d+)?)/.exec(name)
  return m ? Number(m[1]) : 0
}

/** Ordina i modelli disponibili: prima i "flash" (più capaci), poi i "lite", poi il resto; dentro ogni gruppo il più nuovo per primo. */
function rank(models: string[]): string[] {
  const usable = models.filter((n) => !/(image|tts|embedding|live|audio|vision|robotics|computer|aqa|imagen|veo|learnlm|exp|preview-)/i.test(n))
  const group = (n: string) => (/flash-lite/i.test(n) ? 1 : /flash/i.test(n) ? 0 : /gemma/i.test(n) ? 2 : 3)
  return usable.sort((a, b) => group(a) - group(b) || versionOf(b) - versionOf(a) || a.localeCompare(b))
}

async function listModels(key: string): Promise<string[]> {
  if (modelOrder && modelOrderKey === key) return modelOrder
  const res = await fetch(`${API}/models?pageSize=200&key=${encodeURIComponent(key)}`)
  if (!res.ok) throw new Error(`models ${res.status}`)
  const data = (await res.json()) as { models?: ModelInfo[] }
  const names = (data.models ?? [])
    .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
    .map((m) => m.name.replace(/^models\//, ''))
  modelOrder = rank(names)
  modelOrderKey = key
  return modelOrder
}

export interface ExplainInput {
  fen: string
  playedSan: string
  bestSan?: string
  quality: string
  tone: Tone
  facts: string[]
  question?: string
  /** chi parla (il coach scelto): se manca, è Gigi */
  persona?: string
}

const TONE_TEXT: Record<Tone, string> = {
  gentle: 'gentile e incoraggiante',
  spicy: 'ironico e pungente ma affettuoso, con battute leggere',
  ruthless: 'sarcastico e spietato (ma mai offensivo sulla persona: prendi in giro la mossa)',
}

/**
 * Chiede a Gemini una spiegazione breve. Prova i modelli in ordine decrescente di potenza,
 * scendendo al successivo se uno è esaurito o non disponibile. Restituisce null se nessuno risponde.
 */
export async function explainWithGemini(key: string, input: ExplainInput): Promise<string | null> {
  if (!key) return null
  let models: string[]
  try {
    models = await listModels(key)
  } catch {
    return null
  }
  const prompt = [
    `${input.persona ?? 'Sei Gigi, un piccione allenatore di scacchi di parco, simpatico e diretto.'} Parla in italiano.`,
    `Tono: ${TONE_TEXT[input.tone]}.`,
    'Spiega in MASSIMO 2 frasi brevi (sotto 40 parole) a un principiante perché la mossa giocata è stata così, senza gergo tecnico e senza elenchi.',
    'Usa SOLO i fatti forniti qui sotto, non inventare varianti.',
    `Posizione (FEN): ${input.fen}`,
    `Mossa giocata: ${input.playedSan} (giudizio: ${input.quality})`,
    input.bestSan ? `Mossa migliore del motore: ${input.bestSan}` : '',
    ...input.facts.map((f) => `Fatto: ${f}`),
    input.question ? `Domanda dell'utente: ${input.question}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  return generate(models, key, prompt, 160)
}

/** Prova i modelli in ordine finché uno risponde. Con `timeoutMs` ogni richiesta viene interrotta se è troppo lenta. */
async function generate(models: string[], key: string, prompt: string, maxOutputTokens: number, timeoutMs?: number): Promise<string | null> {
  const now = Date.now()
  for (const model of models.slice(0, 8)) {
    if ((dead.get(model) ?? 0) > now) continue
    const ctrl = timeoutMs ? new AbortController() : undefined
    const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : undefined
    try {
      const res = await fetch(`${API}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl?.signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens },
        }),
      })
      if (res.status === 429 || res.status === 503 || res.status === 404 || res.status === 403) {
        dead.set(model, now + (res.status === 429 ? 60_000 : 10 * 60_000))
        continue
      }
      if (!res.ok) continue
      const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim()
      if (text) {
        lastModelUsed = model
        return text
      }
    } catch {
      /* rete assente, richiesta interrotta o errore: prova il modello successivo */
    } finally {
      if (timer) clearTimeout(timer)
    }
  }
  return null
}

export interface GameSummaryInput {
  persona?: string
  tone: Tone
  botName: string
  /** com'è fatto il gioco del bot (es. "attaccante"), se ha uno stile */
  botStyle?: string
  outcome: 'win' | 'lose' | 'draw'
  moves: number
  /** precisione 0-100 */
  accuracy: number
  /** giudizi delle tue mosse: etichetta -> quante (es. "Svarione": 1) */
  judgements: Record<string, number>
  /** errori per tipo (es. "pezzi lasciati in presa": 2) */
  mistakes: Record<string, number>
  /** i due errori più pesanti: mossa e cosa è successo */
  worst: string[]
  cleanGame: boolean
  /** si è arreso (la sconfitta non conta come partita giocata fino in fondo) */
  resigned?: boolean
}

const OUTCOME_TEXT = { win: 'ha vinto', lose: 'ha perso', draw: 'ha pareggiato' } as const

/**
 * Un breve commento a fine partita (3 frasi al massimo) con i temi ricorrenti. Facoltativo: se Gemini non c'è,
 * è lento (oltre ~12 secondi a richiesta) o non risponde, restituisce null e la partita resta com'era.
 */
export async function summarizeGameWithGemini(key: string, input: GameSummaryInput): Promise<string | null> {
  if (!key) return null
  let models: string[]
  try {
    models = await listModels(key)
  } catch {
    return null
  }
  const list = (r: Record<string, number>) =>
    Object.entries(r)
      .map(([k, n]) => `${k}: ${n}`)
      .join(', ') || 'nessuno'
  const prompt = [
    `${input.persona ?? 'Sei Gigi, un piccione allenatore di scacchi di parco, simpatico e diretto.'} Parla in italiano, dando del tu.`,
    `Tono: ${TONE_TEXT[input.tone]}.`,
    'Scrivi un commento di fine partita in MASSIMO 3 frasi brevi (sotto 60 parole) per un giocatore alle prime armi: com’è andata, il tema che ritorna di più negli errori e UN consiglio concreto per la prossima volta.',
    'Niente elenchi, niente gergo tecnico, non inventare mosse o varianti: usa SOLO i fatti qui sotto.',
    `Il giocatore ${input.resigned ? 'si è arreso' : OUTCOME_TEXT[input.outcome]} contro ${input.botName}${input.botStyle ? ` (stile ${input.botStyle})` : ''} in ${input.moves} mosse.`,
    `Precisione: ${input.accuracy}%.`,
    `Giudizi delle sue mosse: ${list(input.judgements)}.`,
    `Tipi di errore: ${list(input.mistakes)}.`,
    ...input.worst.map((w) => `Errore pesante: ${w}`),
    input.cleanGame ? 'Non ha ritirato nessuna mossa (partita pulita).' : '',
  ]
    .filter(Boolean)
    .join('\n')
  return generate(models, key, prompt, 400, 12_000)
}
