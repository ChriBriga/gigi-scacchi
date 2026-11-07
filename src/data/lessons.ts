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
  /** 'medio' = lezioni oltre le basi (sezione a parte nell'elenco) */
  level?: 'medio'
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
  // ---- livello medio ----
  {
    id: 'colonna',
    level: 'medio',
    title: 'La colonna aperta',
    blurb: 'Dove non ci sono pedoni, la torre corre. Mettila lì.',
    steps: [
      {
        kind: 'info',
        fen: 'r4rk1/pp3ppp/8/8/8/8/PP3PPP/R4RK1 w - - 0 1',
        marks: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8'],
        text: 'Una colonna senza pedoni si chiama “aperta”. Qui la colonna e è libera da cima a fondo: è un’autostrada per le torri.',
      },
      {
        kind: 'try',
        fen: 'r4rk1/pp3ppp/8/8/8/8/PP3PPP/R4RK1 w - - 0 1',
        accept: ['f1e1', 'a1e1'],
        text: 'Le torri stanno bene sulle colonne aperte: da lì premono sulla posizione avversaria e possono entrare. Metti una torre in e1!',
        ok: 'Ecco: ora la torre controlla tutta la colonna e minaccia di entrare in e7 o e8. Regola: torri sulle colonne aperte.',
        wrong: 'Cerca la colonna senza pedoni (la e) e porta lì una delle tue torri.',
        hint: ['f1', 'e1'],
      },
    ],
  },
  {
    id: 'passato',
    level: 'medio',
    title: 'Il pedone passato',
    blurb: 'Nessun pedone avversario può fermarlo: un pedone che fa paura.',
    steps: [
      {
        kind: 'info',
        fen: '8/pp5k/8/3P4/8/8/PP4K1/8 w - - 0 1',
        marks: ['d5', 'd6', 'd7', 'd8'],
        text: 'Il pedone in d5 è “passato”: sulla sua colonna e su quelle vicine (c, d, e) non ci sono pedoni neri che possano catturarlo o bloccarlo. Deve solo correre.',
      },
      {
        kind: 'info',
        fen: '8/pp5k/8/3P4/8/8/PP4K1/8 w - - 0 1',
        arrows: [['d5', 'd8']],
        text: 'Un pedone passato obbliga il Nero a tenere il re (o un pezzo) di guardia per sempre. Più vai verso l’ottava, più vale. Nei finali spesso decide la partita.',
      },
      {
        kind: 'try',
        fen: '8/pp5k/8/3P4/8/8/PP4K1/8 w - - 0 1',
        accept: ['d5d6'],
        text: 'Il re nero è lontano, fuori dalla corsa. Spingi il pedone passato!',
        ok: 'Avanti! Ogni casa che guadagna lo rende più pericoloso: il re nero non fa in tempo.',
        wrong: 'Il pedone passato deve avanzare: d5 → d6.',
        hint: ['d5', 'd6'],
      },
    ],
  },
  {
    id: 'alfieri',
    level: 'medio',
    title: 'La coppia degli alfieri',
    blurb: 'Due alfieri coprono tutte le case, chiare e scure. Un piccolo tesoro.',
    steps: [
      {
        kind: 'info',
        range: true,
        fen: '7k/8/8/8/8/8/8/2B1KB2 w - - 0 1',
        text: 'Un alfiere vede solo le case del suo colore. Due alfieri, uno chiaro e uno scuro, vedono tutto. Tocca i due alfieri e guarda!',
      },
      {
        kind: 'info',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 0 1',
        text: 'Regola pratica: se hai la coppia degli alfieri su una posizione aperta, non scambiarne uno con un cavallo senza buon motivo. Il vantaggio è piccolo ma vero, e pesa nei finali.',
      },
      {
        kind: 'try',
        fen: '4k3/8/8/8/r7/8/4B3/2B1K3 w - - 0 1',
        accept: ['e2b5'],
        text: 'Con due alfieri hai sempre una diagonale libera. Qui uno dei due dà scacco e attacca la torre insieme. Trovalo!',
        ok: 'Scacco al re e torre sotto tiro: forchetta d’alfiere! Il Nero salva il re e tu prendi la torre.',
        wrong: 'Cerca una casa da cui l’alfiere attacca il re e la torre nera (a4) insieme.',
        hint: ['e2', 'b5'],
      },
    ],
  },
  {
    id: 'pedoni',
    level: 'medio',
    title: 'Pedoni doppiati e isolati',
    blurb: 'La struttura dei pedoni: i punti deboli che durano tutta la partita.',
    steps: [
      {
        kind: 'info',
        fen: '4k3/pp3ppp/8/8/8/2P5/2P2PPP/4K3 w - - 0 1',
        marks: ['c2', 'c3'],
        text: 'Pedoni DOPPIATI: due pedoni sulla stessa colonna, come in c2 e c3. Si intralciano a vicenda e si proteggono male. Meglio evitarli.',
      },
      {
        kind: 'info',
        fen: '4k3/pp3ppp/8/3p4/8/8/PP3PPP/3RK3 w - - 0 1',
        marks: ['d5'],
        arrows: [['d1', 'd5']],
        text: 'Pedone ISOLATO: il d5 non ha pedoni amici sulle colonne vicine (c ed e), quindi nessun pedone può proteggerlo. Deve difenderlo un pezzo, ed è un bersaglio.',
      },
      {
        kind: 'try',
        fen: '4k3/pp3ppp/8/3p4/8/8/PP3PPP/3RK3 w - - 0 1',
        accept: ['d1d5'],
        text: 'Il pedone nero d5 è isolato e nessuno lo difende. Attaccato dalla torre… prendilo!',
        ok: 'Pedone gratis! I pedoni isolati e doppiati sono bersagli: quando li vedi, attaccali. E nelle tue partite, evitali.',
        wrong: 'Cerca il pedone isolato nero e catturalo con la torre.',
        hint: ['d1', 'd5'],
      },
    ],
  },
  {
    id: 'sicurezza',
    level: 'medio',
    title: 'Il re al sicuro: dagli aria',
    blurb: 'Il matto di corridoio si evita con una mossa di pedone.',
    steps: [
      {
        kind: 'info',
        fen: 'r1bq1rk1/ppp2ppp/2n2n2/3p4/3P4/2N2N2/PPP2PPP/R1BQ1RK1 w - - 0 1',
        marks: ['f2', 'g2', 'h2'],
        text: 'Dopo l’arrocco il re sta dietro tre pedoni (f, g, h): scudo perfetto. Prova a non muoverli senza motivo, ogni pedone spinto è un buco nelle difese.',
      },
      {
        kind: 'try',
        fen: '4r1k1/5ppp/8/8/8/8/5PPP/6K1 w - - 0 1',
        accept: ['h2h3', 'g2g3', 'f2f3', 'h2h4', 'g2g4', 'f2f4'],
        text: 'Il Nero minaccia Te1 e il re bianco, chiuso dai suoi pedoni, sarebbe matto! Fai una mossa di pedone che gli dia una casa di fuga (si chiama “dare aria”).',
        ok: 'Aria! Ora il re ha una casa dove scappare e il matto di corridoio non c’è più. Una mossa di pedone, un problema in meno.',
        wrong: 'Serve una mossa di PEDONE (f, g o h) che liberi una casa davanti al re.',
        hint: ['h2', 'h3'],
      },
    ],
  },
  {
    id: 'piano',
    level: 'medio',
    title: 'Come fare un piano',
    blurb: 'Quando non c’è nessuna tattica, che mossa giochi? Ecco la risposta.',
    steps: [
      {
        kind: 'info',
        fen: START,
        text: 'Quando non c’è niente da catturare e nessuna minaccia, non muovere a caso. Un piano semplice in 3 passi: 1) trova il tuo pezzo peggiore; 2) portalo in una casa migliore; 3) poi attacca il punto debole avversario.',
      },
      {
        kind: 'try',
        fen: '4k3/pp3ppp/8/8/8/N7/PP3PPP/4K3 w - - 0 1',
        accept: ['a3c4', 'a3b5'],
        text: 'Il tuo pezzo peggiore è il cavallo in a3, sul bordo: da lì controlla poche case. Portalo al centro o in avanti!',
        ok: 'Meglio! Un cavallo centrale vede il doppio delle case. Prima di ogni mossa tranquilla: “chi è il mio pezzo peggiore?”',
        wrong: 'Sposta il cavallo (a3) in una casa più attiva, verso il centro: c4 o b5.',
        hint: ['a3', 'c4'],
      },
    ],
  },
]

export const LESSON_ORDER = LESSONS.map((l) => l.id)

/** La prima lezione non ancora fatta. */
export function nextLesson(done: string[]): Lesson | undefined {
  return LESSONS.find((l) => !done.includes(l.id))
}
