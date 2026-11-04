export interface PvLine {
  multipv: number
  depth: number
  /** centipawn dal punto di vista di chi muove */
  cp: number
  mate?: number
  pv: string[]
}

export interface SearchResult {
  lines: PvLine[]
  bestmove: string
}

export interface SearchOpts {
  depth?: number
  movetime?: number
  multipv?: number
}

const MATE_CP = 3000

function toCp(cp: number | undefined, mate: number | undefined): number {
  if (mate !== undefined) return Math.sign(mate) * (MATE_CP - Math.min(Math.abs(mate), 50) * 20)
  return cp ?? 0
}

/** Piccolo wrapper UCI attorno a Stockfish (WASM, single thread) che gira in un Web Worker. */
export class UciEngine {
  private worker: Worker
  private listeners = new Set<(line: string) => void>()
  private chain: Promise<unknown> = Promise.resolve()
  private ready: Promise<void>

  constructor() {
    this.worker = new Worker(`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`)
    this.worker.onmessage = (e: MessageEvent) => {
      const line = String(e.data)
      for (const l of this.listeners) l(line)
    }
    this.ready = this.init()
  }

  private waitFor(prefix: string): Promise<void> {
    return new Promise((resolve) => {
      const l = (line: string) => {
        if (line.startsWith(prefix)) {
          this.listeners.delete(l)
          resolve()
        }
      }
      this.listeners.add(l)
    })
  }

  private async init() {
    const uciok = this.waitFor('uciok')
    this.worker.postMessage('uci')
    await uciok
    this.worker.postMessage('setoption name Hash value 16')
    const readyok = this.waitFor('readyok')
    this.worker.postMessage('isready')
    await readyok
  }

  /** Le ricerche vengono messe in coda: una alla volta. */
  search(fen: string, opts: SearchOpts): Promise<SearchResult> {
    const run = async (): Promise<SearchResult> => {
      await this.ready
      const multipv = opts.multipv ?? 1
      this.worker.postMessage(`setoption name MultiPV value ${multipv}`)
      this.worker.postMessage(`position fen ${fen}`)
      const byPv = new Map<number, PvLine>()
      return new Promise<SearchResult>((resolve) => {
        const l = (line: string) => {
          if (line.startsWith('info') && line.includes(' pv ')) {
            const depth = Number(/ depth (\d+)/.exec(line)?.[1] ?? 0)
            const mpv = Number(/ multipv (\d+)/.exec(line)?.[1] ?? 1)
            const cpM = / score cp (-?\d+)/.exec(line)
            const mateM = / score mate (-?\d+)/.exec(line)
            const pv = line.split(' pv ')[1].trim().split(' ')
            const mate = mateM ? Number(mateM[1]) : undefined
            byPv.set(mpv, { multipv: mpv, depth, cp: toCp(cpM ? Number(cpM[1]) : undefined, mate), mate, pv })
          } else if (line.startsWith('bestmove')) {
            this.listeners.delete(l)
            const lines = [...byPv.values()].sort((a, b) => a.multipv - b.multipv)
            resolve({ lines, bestmove: line.split(' ')[1] })
          }
        }
        this.listeners.add(l)
        const parts = ['go']
        if (opts.depth) parts.push('depth', String(opts.depth))
        if (opts.movetime) parts.push('movetime', String(opts.movetime))
        if (!opts.depth && !opts.movetime) parts.push('depth', '10')
        this.worker.postMessage(parts.join(' '))
      })
    }
    const p = this.chain.then(run, run)
    this.chain = p.catch(() => undefined)
    return p
  }
}
