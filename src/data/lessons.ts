import type { Square } from 'chess.js'

export type Step =
  | {
      kind: 'info'
      text: string
      fen: string
      marks?: Square[]
      arrows?: [Square, Square][]
      /** tocca un pezzo per vederne il raggio d'azione */
      range?: boolean
      /** mostra la mappa del pericolo per chi ha la mossa */
      danger?: boolean
    }
  | {
      kind: 'try'
      text: string
      fen: string
      /** mosse UCI accettate (confronto per prefisso: "e7e8" accetta qualsiasi promozione) */
      accept?: string[]
      /** accetta qualsiasi mossa del pezzo che parte da questa casa */
      acceptFrom?: Square
      /** accetta qualsiasi scacco matto */
      mate?: boolean
      ok: string
      wrong: string
      hint?: [Square, Square]
      danger?: boolean
    }
  | {
      kind: 'line'
      text: string
      fen: string
      /** mosse alternate: giocatore, risposta, giocatore, ... (UCI) */
      moves: string[]
      ok: string
    }

export interface Lesson {
  id: string
  title: string
  blurb: string
  steps: Step[]
}

const START = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

export const LESSONS: Lesson[] = [
  {
    id: 'valori',
    title: 'Quanto vale ogni pezzo',
    blurb: 'Il pedone vale 1, la regina 9. Serve per non fare scambi stupidi.',
    steps: [
      {
        kind: 'info',
        fen: '7k/8/8/8/8/8/1P6/K1NBRQ2 w - - 0 1',
        text: 'Ogni pezzo ha un valore: pedone = 1, cavallo = 3, alfiere = 3, torre = 5, regina = 9. Il re non si scambia mai: se lo perdi, hai perso.',
      },
      {
        kind: 'info',
        fen: '7k/8/8/8/8/8/1P6/K1NBRQ2 w - - 0 1',
        text: 'Regola d’oro: non dare un pezzo che vale tanto per uno che vale poco. Torre (5) per pedone (1)? Ma anche no, pivello.',
        marks: ['b2', 'e1'],
      },
    ],
  },
  {
    id: 'raggi',
    title: 'Dove arriva ogni pezzo',
    blurb: 'Il raggio d’azione di ogni pezzo, in modo visivo. Tocca e guarda!',
    steps: [
      { kind: 'info', range: true, fen: 'k7/8/8/8/3K4/8/8/8 w - - 0 1', text: 'Il re: una casa in ogni direzione. Tocca il pezzo e guarda dove arriva. Lento, ma prezioso.' },
      { kind: 'info', range: true, fen: 'k7/8/8/8/3R4/8/8/7K w - - 0 1', text: 'La torre: disegna una croce (+), in linea retta, quanto vuole. Tocca per vedere!' },
      { kind: 'info', range: true, fen: 'k7/8/8/8/3B4/8/8/7K w - - 0 1', text: 'L’alfiere: solo diagonali, quindi resta sempre sullo stesso colore di casa. Tocca!' },
      { kind: 'info', range: true, fen: 'k7/8/8/8/3Q4/8/8/7K w - - 0 1', text: 'La regina: torre + alfiere insieme. È il pezzo più forte (e più facile da perdere per distrazione).' },
      { kind: 'info', range: true, fen: 'k7/8/8/8/3N4/8/8/7K w - - 0 1', text: 'Il cavallo: salta a forma di L (2+1). L’unico che salta sopra gli altri pezzi. Tocca!' },
      { kind: 'info', range: true, fen: 'k7/8/8/8/8/3p1p2/4P3/7K w - - 0 1', text: 'Il pedone: avanza dritto (due caselle la prima volta) ma cattura in DIAGONALE. Tocca il pedone bianco!' },
    ],
  },
  {
    id: 'presa',
    title: 'Pezzi in presa',
    blurb: 'Prendi i pezzi regalati e salva i tuoi. Il 90% delle partite si decide qui.',
    steps: [
      {
        kind: 'try',
        fen: '4k3/8/8/3b4/8/2N5/8/4K3 w - - 0 1',
        accept: ['c3d5'],
        text: 'L’alfiere nero in d5 è attaccato dal tuo cavallo e nessuno lo protegge: è “in presa”. Prendilo!',
        ok: 'Pezzo gratis! Controlla sempre se l’avversario ti ha lasciato qualcosa.',
        wrong: 'Non quella: cerca il pezzo nero che nessuno protegge e che puoi catturare.',
        hint: ['c3', 'd5'],
      },
      {
        kind: 'try',
        fen: '4k3/8/8/2p5/3B4/8/8/4K3 w - - 0 1',
        acceptFrom: 'd4',
        text: 'Ora a parti invertite: il tuo alfiere è attaccato dal pedone nero! Mettilo in salvo (o prendi il pedone).',
        ok: 'Bene! Prima di muovere, chiediti sempre: “cosa mi attacca?”.',
        wrong: 'Il tuo alfiere è ancora sotto attacco! Muovi proprio lui.',
        hint: ['d4', 'c5'],
        danger: true,
      },
    ],
  },
  {
    id: 'occhio',
    title: 'Le 3 domande prima di muovere',
    blurb: 'Il trucco che ti fa smettere di regalare pezzi.',
    steps: [
      {
        kind: 'info',
        danger: true,
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        text: 'Le caselle rosse sono controllate dal Nero: se ci metti un pezzo senza protezione, rischi di perderlo. Questa mappa ti aiuta a “vederlo”.',
      },
      {
        kind: 'info',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3',
        text: 'Prima di ogni mossa chiediti: 1) Cosa vuole fare l’avversario? 2) Cosa attacca adesso? 3) La mia mossa lascia qualcosa senza protezione? Tre domande, tre secondi.',
      },
    ],
  },
  {
    id: 'matto1',
    title: 'Scacco matto in una mossa',
    blurb: 'Il re non ha scampo: scacco e nessuna via di fuga.',
    steps: [
      {
        kind: 'try',
        fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
        mate: true,
        text: 'Il re nero è chiuso dai suoi stessi pedoni. Trova lo scacco matto in una mossa!',
        ok: 'Matto di corridoio! Il re è soffocato dai suoi pedoni.',
        wrong: 'Non è matto. Cerca uno scacco da cui il re non può scappare.',
        hint: ['a1', 'a8'],
      },
      {
        kind: 'try',
        fen: 'k7/8/1K6/8/8/8/8/6Q1 w - - 0 1',
        mate: true,
        text: 'Regina e re insieme: la regina dà scacco, il re copre le case di fuga. Trova il matto!',
        ok: 'Scacco matto! Regina + re è una coppia micidiale.',
        wrong: 'Quasi. Il re nero deve non avere nessuna casa libera dove scappare.',
        hint: ['g1', 'g8'],
      },
    ],
  },
  {
    id: 'principi',
    title: 'I 3 principi dell’apertura',
    blurb: 'Tre idee semplici che valgono più di 100 varianti.',
    steps: [
      { kind: 'info', fen: START, marks: ['d4', 'e4', 'd5', 'e5'], text: '1) Occupa il CENTRO. Pedoni in e4/d4: da lì i tuoi pezzi controllano più caselle.' },
      {
        kind: 'info',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
        arrows: [['g1', 'f3'], ['f1', 'c4']],
        text: '2) SVILUPPA i pezzi: cavalli e alfieri fuori dalla casa base, verso il centro. Non muovere lo stesso pezzo due volte e non uscire subito con la regina.',
      },
      { kind: 'info', fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQ1RK1 b kq - 5 5', marks: ['g1', 'f1'], text: '3) ARROCCA presto: il re al sicuro e la torre in gioco. Poi pensi all’attacco.' },
    ],
  },
  {
    id: 'italiana',
    title: 'La tua prima apertura: l’Italiana',
    blurb: 'Tre mosse da giocare ad occhi chiusi con il Bianco.',
    steps: [
      {
        kind: 'line',
        fen: START,
        moves: ['e2e4', 'e7e5', 'g1f3', 'b8c6', 'f1c4', 'f8c5'],
        text: 'Gioca: pedone in e4 (centro), cavallo in f3 (sviluppo), alfiere in c4 (punta f7). Segui il consiglio!',
        ok: 'Fatto! Hai appena giocato la Partita Italiana. Il prossimo passo: arroccare.',
      },
    ],
  },
  {
    id: 'arrocco',
    title: 'L’arrocco',
    blurb: 'La mossa con cui re e torre si mettono al sicuro insieme.',
    steps: [
      {
        kind: 'try',
        fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 6 5',
        accept: ['e1g1'],
        text: 'Per arroccare muovi il RE di due caselle verso la torre: la torre salta dall’altra parte. Si può solo se tra re e torre non c’è nulla e il re non è sotto scacco. Prova!',
        ok: 'Arrocco! Re al sicuro, torre in gioco: due piccioni con una fava.',
        wrong: 'Trascina il re di due case verso la torre h1 (e1 → g1).',
        hint: ['e1', 'g1'],
      },
    ],
  },
  {
    id: 'barbiere',
    title: 'Come difenderti dal matto del barbiere',
    blurb: 'Il tranello preferito dei principianti. Impara a spegnerlo.',
    steps: [
      {
        kind: 'try',
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 3 3',
        accept: ['g7g6', 'd8e7', 'g8h6', 'd8f6'],
        text: 'Regina e alfiere bianchi puntano f7, dove c’è solo il re a difendere: matto in arrivo! Sei il Nero. Come ti difendi?',
        ok: 'Esatto! Hai spento la minaccia. Se avessi mosso a caso, Qxf7 era matto.',
        wrong: 'Attento! Così il Bianco gioca Qxf7 ed è scacco matto. Difendi f7 oppure attacca la regina.',
        hint: ['g7', 'g6'],
      },
    ],
  },
  {
    id: 'forchetta',
    title: 'La forchetta',
    blurb: 'Un pezzo che attacca due cose insieme: ne prendi una.',
    steps: [
      {
        kind: 'try',
        fen: 'r3k3/8/8/3N4/8/8/8/4K3 w - - 0 1',
        accept: ['d5c7'],
        text: 'Il cavallo può attaccare re e torre in un colpo solo. Trova la forchetta!',
        ok: 'Scacco al re e attacco alla torre: il Nero può salvare solo uno. Forchetta!',
        wrong: 'Cerca la casa da cui il cavallo attacca il re e la torre insieme.',
        hint: ['d5', 'c7'],
      },
      {
        kind: 'try',
        fen: '4k3/8/2n1n3/8/3P4/8/8/4K3 w - - 0 1',
        accept: ['d4d5'],
        text: 'Anche il pedone sa fare la forchetta! Spingilo dove attacca entrambi i cavalli.',
        ok: 'Pedone che forchetta due cavalli: umiliante per il Nero.',
        wrong: 'Il pedone cattura in diagonale: trova la casa che minaccia entrambi i cavalli.',
        hint: ['d4', 'd5'],
      },
    ],
  },
  {
    id: 'inchiodatura',
    title: 'L’inchiodatura',
    blurb: 'Un pezzo che non può muoversi perché dietro c’è il re.',
    steps: [
      {
        kind: 'info',
        fen: '4k3/4r3/8/8/8/8/4N3/4K3 w - - 0 1',
        arrows: [['e7', 'e1']],
        text: 'Il cavallo bianco è “inchiodato”: se si muove, la torre dà scacco al re. Un pezzo inchiodato è mezzo bloccato e facile da attaccare.',
      },
      {
        kind: 'try',
        fen: '4k3/8/2n5/8/8/8/8/4KB2 w - - 0 1',
        accept: ['f1b5'],
        text: 'Ora tocca a te: inchioda il cavallo nero con l’alfiere (dietro il cavallo c’è il re).',
        ok: 'Inchiodato! Il cavallo non può più muoversi senza scoprire il re.',
        wrong: 'Metti l’alfiere sulla diagonale che unisce il cavallo e il re nero.',
        hint: ['f1', 'b5'],
      },
    ],
  },
  {
    id: 'infilata',
    title: 'L’infilata',
    blurb: 'Come l’inchiodatura ma al contrario: il pezzo forte scappa, tu prendi quello dietro.',
    steps: [
      {
        kind: 'try',
        fen: '3k3q/8/8/8/8/8/8/R3K3 w - - 0 1',
        accept: ['a1a8'],
        text: 'Dai scacco al re: dovrà spostarsi, e dietro di lui c’è la regina nera!',
        ok: 'Scacco! Il re scappa e la torre mangia la regina. Infilata!',
        wrong: 'Cerca lo scacco in linea retta con la regina dietro il re.',
        hint: ['a1', 'a8'],
      },
    ],
  },
  {
    id: 'promozione',
    title: 'La promozione',
    blurb: 'Il pedone che arriva in fondo diventa un pezzo.',
    steps: [
      {
        kind: 'try',
        fen: '8/4P1k1/8/8/8/8/8/K7 w - - 0 1',
        accept: ['e7e8'],
        text: 'Il pedone è all’ultima traversa… basta un passo! Quando arriva in fondo si trasforma: quasi sempre scegli la regina.',
        ok: 'Una nuova regina! Da pedone a diva.',
        wrong: 'Spingi il pedone avanti: e7 → e8.',
        hint: ['e7', 'e8'],
      },
    ],
  },
  {
    id: 'stallo',
    title: 'Stallo: il pareggio beffa',
    blurb: 'Quando sei in vantaggio, non fregarti da solo.',
    steps: [
      {
        kind: 'info',
        fen: 'k7/2Q5/1K6/8/8/8/8/8 b - - 0 1',
        text: 'Il Nero non è sotto scacco e non può muovere nessun pezzo: è STALLO, e la partita finisce patta! Quando sei in vantaggio, prima di muovere controlla che l’avversario abbia almeno una mossa.',
      },
    ],
  },
  {
    id: 'duetorri',
    title: 'Matto con due torri',
    blurb: 'Il matto a scala: la tecnica per chiudere le partite vinte.',
    steps: [
      {
        kind: 'try',
        fen: '6k1/R7/8/8/8/8/8/1R4K1 w - - 0 1',
        mate: true,
        text: 'Una torre chiude la settima traversa, l’altra dà scacco all’ultima. Trova il matto!',
        ok: 'Matto a scala! Una torre “taglia” il re, l’altra lo chiude.',
        wrong: 'Dai scacco con la torre libera sull’ottava traversa.',
        hint: ['b1', 'b8'],
      },
    ],
  },
]

export const LESSON_ORDER = LESSONS.map((l) => l.id)

/** La prima lezione non ancora fatta. */
export function nextLesson(done: string[]): Lesson | undefined {
  return LESSONS.find((l) => !done.includes(l.id))
}
