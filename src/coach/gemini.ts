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

  const now = Date.now()
  for (const model of models.slice(0, 8)) {
    if ((dead.get(model) ?? 0) > now) continue
    try {
      const res = await fetch(`${API}/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 160 },
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
      /* rete assente o errore: prova il modello successivo */
    }
  }
  return null
}
