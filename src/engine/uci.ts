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
/** tempo massimo di attesa del motore all'avvio */
const INIT_TIMEOUT = 30_000
/** margine oltre il tempo di pensiero richiesto, prima di dichiarare il motore bloccato */
const SEARCH_MARGIN = 10_000

function toCp(cp: number | undefined, mate: number | undefined): number {
  if (mate !== undefined) return Math.sign(mate) * (MATE_CP - Math.min(Math.abs(mate), 50) * 20)
  return cp ?? 0
}

/**
 * Piccolo wrapper UCI attorno a Stockfish (WASM, single thread) che gira in un Web Worker.
 * Se il motore non parte, si blocca o va in errore, la ricerca fallisce con un errore invece di restare
 * in attesa per sempre, e alla prossima richiesta il motore viene riavviato da zero.
 */
export class UciEngine {
  private worker!: Worker
  private listeners = new Set<(line: string) => void>()
  private failers = new Set<(e: Error) => void>()
  private chain: Promise<unknown> = Promise.resolve()
  private ready!: Promise<void>
  private broken = false

  constructor() {
    this.start()
  }

  private start() {
    this.broken = false
    this.listeners.clear()
    this.failers.clear()
    this.worker = new Worker(`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`)
    this.worker.onmessage = (e: MessageEvent) => {
      const line = String(e.data)
      for (const l of this.listeners) l(line)
    }
    this.worker.onerror = () => this.fail(new Error('Il motore non risponde'))
    this.ready = this.init()
    this.ready.catch(() => undefined)
  }

  private fail(err: Error) {
    this.broken = true
    const pending = [...this.failers]
    this.failers.clear()
    for (const f of pending) f(err)
  }

  private restart() {
    try {
      this.worker.terminate()
    } catch {
      /* già chiuso */
    }
    this.start()
  }

  /** Aspetta una riga che inizia con `prefix`; fallisce se il motore si rompe o scade il tempo. */
  private waitFor(prefix: string, ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const done = () => {
        clearTimeout(timer)
        this.listeners.delete(l)
        this.failers.delete(f)
      }
      const l = (line: string) => {
        if (line.startsWith(prefix)) {
          done()
          resolve()
        }
      }
      const f = (e: Error) => {
        done()
        reject(e)
      }
      const timer = setTimeout(() => {
        done()
        reject(new Error('Il motore non risponde'))
      }, ms)
      this.listeners.add(l)
      this.failers.add(f)
    })
  }

  private async init() {
    const uciok = this.waitFor('uciok', INIT_TIMEOUT)
    this.worker.postMessage('uci')
    await uciok
    this.worker.postMessage('setoption name Hash value 16')
    const readyok = this.waitFor('readyok', INIT_TIMEOUT)
    this.worker.postMessage('isready')
    await readyok
  }

  /** Le ricerche vengono messe in coda: una alla volta. */
  search(fen: string, opts: SearchOpts): Promise<SearchResult> {
    const run = async (): Promise<SearchResult> => {
      if (this.broken) this.restart()
      try {
        await this.ready
      } catch (e) {
        this.broken = true
        throw e
      }
      const multipv = opts.multipv ?? 1
      this.worker.postMessage(`setoption name MultiPV value ${multipv}`)
      this.worker.postMessage(`position fen ${fen}`)
      const byPv = new Map<number, PvLine>()
      return new Promise<SearchResult>((resolve, reject) => {
        const done = () => {
          clearTimeout(timer)
          this.listeners.delete(l)
          this.failers.delete(f)
        }
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
            done()
            const lines = [...byPv.values()].sort((a, b) => a.multipv - b.multipv)
            resolve({ lines, bestmove: line.split(' ')[1] })
          }
        }
        const f = (e: Error) => {
          done()
          reject(e)
        }
        // motore bloccato: lo si butta via (un "stop" lascerebbe un bestmove arretrato che sporcherebbe la ricerca dopo)
        const timer = setTimeout(() => {
          done()
          this.restart()
          reject(new Error('Il motore non risponde'))
        }, (opts.movetime ?? 4000) + SEARCH_MARGIN)
        this.listeners.add(l)
        this.failers.add(f)
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
