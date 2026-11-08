import { Chess } from 'chess.js'

/**
 * Piccolo libro delle aperture: le linee principali, giocate da secoli. Una mossa è "di libro" se la
 * posizione che crea compare in una di queste linee (anche arrivandoci con un ordine di mosse diverso).
 * Più avanti nell'elenco = più specifico: il nome vale per la posizione in cui finisce la linea.
 */
const LINES: [string, string][] = [
  ['Apertura di re', 'e4'],
  ['Apertura di donna', 'd4'],
  ['Apertura inglese', 'c4'],
  ['Apertura Réti', 'Nf3'],
  ['Partita aperta', 'e4 e5'],
  ['Partita di re', 'e4 e5 Nf3'],
  ['Partita di re', 'e4 e5 Nf3 Nc6'],
  ['Partita italiana', 'e4 e5 Nf3 Nc6 Bc4'],
  ['Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5'],
  ['Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Nc3 Nxe4 O-O Bxc3 d5'],
  ['Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 c3 d6 O-O O-O'],
  ['Difesa dei due cavalli', 'e4 e5 Nf3 Nc6 Bc4 Nf6'],
  ['Difesa dei due cavalli', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4'],
  ['Partita spagnola', 'e4 e5 Nf3 Nc6 Bb5'],
  ['Spagnola, difesa Morphy', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3'],
  ['Spagnola, variante chiusa', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5'],
  ['Spagnola, scambio', 'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O'],
  ['Spagnola, difesa Berlino', 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8'],
  ['Partita scozzese', 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6'],
  ['Partita dei quattro cavalli', 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6 Bg5 Bxc3 bxc3 Qe7'],
  ['Difesa russa (Petrov)', 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Nc6 O-O Be7 c4 Nb4 Be2 O-O Nc3 Bf5'],
  ['Gambetto di re', 'e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6'],
  ['Gambetto di re rifiutato', 'e4 e5 f4 Bc5 Nf3 d6 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2'],
  ['Gambetto Evans', 'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O'],
  ['Difesa Philidor', 'e4 e5 Nf3 d6 d4 Nf6 Nc3 Nbd7 Bc4 Be7 O-O O-O'],
  ['Difesa siciliana', 'e4 c5'],
  ['Siciliana aperta', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3'],
  ['Siciliana, variante Najdorf', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O'],
  ['Siciliana, variante Najdorf', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7'],
  ['Siciliana, variante del Drago', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O'],
  ['Siciliana, Scheveningen', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6 Be2 Be7 O-O O-O f4 Nc6 Be3'],
  ['Siciliana, variante Taimanov', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Be2 Nf6 O-O Bb4'],
  ['Siciliana chiusa', 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 Be3 e6 Qd2 Nge7 Nge2 O-O O-O'],
  ['Siciliana, Alapin', 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5 dxe5 Nxe5 Bd7'],
  ['Siciliana, Sveshnikov', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Nd5 Qa5+ Bd2'],
  ['Difesa francese', 'e4 e6 d4 d5'],
  ['Francese, variante di avanzamento', 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 Nh6 b4 cxd4 cxd4 Nf5 Bb2 Bd7'],
  ['Francese, variante Tarrasch', 'e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7 Bd3 c5 c3 Nc6 Ne2 cxd4 cxd4 f6 exf6 Nxf6 Nf3 Bd6 O-O O-O'],
  ['Francese, variante Winawer', 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4 Ne2 Nbc6 f4 Bd7'],
  ['Francese, variante classica', 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5 Qd2 Nc6 O-O-O a6'],
  ['Francese, scambio', 'e4 e6 d4 d5 exd5 exd5 Nf3 Nf6 Bd3 Bd6 O-O O-O Bg5 Bg4 Nbd2 Nbd7'],
  ['Difesa Caro-Kann', 'e4 c6 d4 d5'],
  ['Caro-Kann, variante classica', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bf4 Ngf6'],
  ['Caro-Kann, variante di avanzamento', 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 Nd7 O-O Ne7 c4 Nc6 Nc3 dxc4 Bxc4'],
  ['Caro-Kann, Panov', 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Bb4 cxd5 Nxd5 Bd2 Nc6 Bd3 O-O O-O'],
  ['Difesa scandinava', 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6 Nd5'],
  ['Difesa Pirc', 'e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O O-O c6 a4 Nbd7 Be3 e5'],
  ['Difesa Alekhine', 'e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 c4 Nb6 Nc3 O-O Be3 d5'],
  ['Difesa moderna', 'e4 g6 d4 Bg7 Nc3 d6 Be3 a6 Qd2 b5 f3 Nd7 Bd3 Bb7 Nge2 c5'],
  ['Gambetto di donna', 'd4 d5 c4'],
  ['Gambetto di donna accettato', 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 Qe2 b5 Bb3 Nc6 Rd1 Qc7'],
  ['Gambetto di donna rifiutato', 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5 Bxe7 Qxe7 O-O Nxc3 Rxc3 e5'],
  ['Difesa slava', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O Nbd7 Qe2 Bg6 e4 O-O'],
  ['Semislava', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5'],
  ['Difesa Tarrasch', 'd4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7 O-O O-O Bg5 cxd4 Nxd4 h6 Be3 Re8'],
  ['Partita di donna', 'd4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6'],
  ['Sistema Londra', 'd4 d5 Bf4 Nf6 e3 e6 Nf3 Bd6 Bg3 O-O Nbd2 c5 c3 Nc6 Bd3 Qe7 O-O b6'],
  ['Sistema Londra', 'd4 Nf6 Nf3 d5 Bf4 c5 e3 Nc6 Nbd2 cxd4 exd4 Bf5 c3 e6 Bb5 Bd6 Bxd6 Qxd6 O-O'],
  ['Difesa est-indiana', 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7'],
  ['Difesa est-indiana, Sämisch', 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 Nge2 c6 Qd2 Nbd7 O-O-O a6'],
  ['Difesa Grünfeld', 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Be3 Qa5 Qd2 Bg4 Rb1 O-O'],
  ['Difesa nimzo-indiana', 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6 a3 Bxc3 bxc3 dxc4 Bxc4 Qc7'],
  ['Difesa nimzo-indiana', 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 e3 d6 f3 Nbd7'],
  ['Difesa indiana di donna', 'd4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2 Be7 O-O O-O Nc3 Ne4 Qc2 Nxc3 Qxc3 c5'],
  ['Difesa catalana', 'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4'],
  ['Difesa Benoni', 'd4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 Nf3 Bg7 Be2 O-O O-O Re8 Nd2 Na6'],
  ['Difesa olandese', 'd4 f5 g3 Nf6 Bg2 e6 Nf3 Be7 O-O O-O c4 d6 Nc3 Qe8 Qc2 Qh5'],
  ['Difesa olandese, stonewall', 'd4 f5 c4 Nf6 g3 e6 Bg2 Be7 Nf3 O-O O-O d5 b3 c6 Ba3 Bxa3 Nxa3 Qe8'],
  ['Attacco indiano di re', 'Nf3 d5 g3 Nf6 Bg2 e6 O-O Be7 d3 O-O Nbd2 c5 e4 Nc6 Re1 b5'],
  ['Apertura inglese, simmetrica', 'c4 c5 Nf3 Nf6 Nc3 Nc6 g3 g6 Bg2 Bg7 O-O O-O d4 cxd4 Nxd4 Nxd4 Qxd4 d6'],
  ['Apertura inglese, quattro cavalli', 'c4 e5 Nc3 Nf6 Nf3 Nc6 g3 d5 cxd5 Nxd5 Bg2 Nb6 O-O Be7 d3 O-O a3 Be6'],
  ['Apertura inglese', 'c4 e5 Nc3 Nf6 g3 c6 Nf3 e4 Nh4 d5 cxd5 cxd5 d3 Nc6 dxe4 dxe4 Bg2 Bc5'],
  ['Apertura inglese, difesa indiana', 'c4 Nf6 Nc3 e6 e4 d5 e5 d4 exf6 dxc3 bxc3 Qxf6 d4 c5 Nf3 Nc6 Be3 cxd4'],
]

const norm = (fen: string) => fen.split(' ').slice(0, 4).join(' ')

let table: Map<string, string | null> | null = null

function build(): Map<string, string | null> {
  const t = new Map<string, string | null>()
  t.set(norm(new Chess().fen()), null)
  for (const [name, line] of LINES) {
    const c = new Chess()
    try {
      const moves = line.split(' ')
      moves.forEach((san, i) => {
        c.move(san)
        const k = norm(c.fen())
        const last = i === moves.length - 1
        // la posizione finale prende il nome della linea; quelle di passaggio restano di libro, senza nome proprio
        if (last) t.set(k, name)
        else if (!t.has(k)) t.set(k, null)
      })
    } catch {
      /* una linea sbagliata nel libro non deve rompere il resto */
    }
  }
  return t
}

export interface OpeningInfo {
  /** la posizione è ancora "di libro" */
  book: boolean
  /** il nome dell'apertura più specifico incontrato finora nella partita */
  name?: string
}

/** Controlla se dopo queste mosse (SAN, dall'inizio) la partita è ancora di libro, e come si chiama l'apertura. */
export function openingInfo(sanMoves: string[]): OpeningInfo {
  table ??= build()
  const c = new Chess()
  let name: string | undefined
  let book = true
  for (const san of sanMoves) {
    try {
      c.move(san)
    } catch {
      return { book: false, name }
    }
    const k = norm(c.fen())
    if (!table.has(k)) book = false
    else {
      const n = table.get(k)
      if (n) name = n
    }
  }
  return { book, name }
}
