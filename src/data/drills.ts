/**
 * "Finali contro il bot": mini-partite da 2-5 minuti che partono da una posizione fissa con un obiettivo preciso.
 * Ogni posizione è controllata con Stockfish da `scripts/check-drills.mjs`.
 */
export type DrillGoal = 'mate' | 'promote' | 'draw'

export interface Drill {
  id: string
  /** 1 = base, 2 = intermedio, 3 = da veri finalisti */
  level: 1 | 2 | 3
  title: string
  blurb: string
  /** la posizione di partenza: muovi tu, con il colore di chi ha il tratto */
  fen: string
  goal: DrillGoal
  /** quante mosse hai a disposizione (le tue) */
  maxMoves: number
  /** quanto è bravo l'avversario (rank dei bot, 1-16) */
  botRank: number
  /** il suggerimento di apertura del coach */
  tip: string
}

export const DRILLS: Drill[] = [
  {
    id: 'mate-donna',
    level: 1,
    title: 'Matto con donna e re',
    blurb: 'Stringi il re avversario verso il bordo, senza fare stallo.',
    fen: '8/8/8/3k4/8/8/8/Q3K3 w - - 0 1',
    goal: 'mate',
    maxMoves: 15,
    botRank: 9,
    tip: 'Con la donna chiudi il re a “cavallo di distanza”, poi avvicina il tuo re. Occhio allo stallo!',
  },
  {
    id: 'mate-2torri',
    level: 1,
    title: 'Matto con due torri',
    blurb: 'Le torri a scaletta spingono il re fino all’ultima riga.',
    fen: '8/8/8/3k4/8/8/8/R3K2R w - - 0 1',
    goal: 'mate',
    maxMoves: 14,
    botRank: 9,
    tip: 'Una torre dà scacco, l’altra gli taglia la strada: avanti a scaletta fino al bordo.',
  },
  {
    id: 'mate-torre',
    level: 1,
    title: 'Matto con torre e re',
    blurb: 'Serve il tuo re: la torre da sola non basta.',
    fen: '8/8/8/3k4/8/8/8/R3K3 w - - 0 1',
    goal: 'mate',
    maxMoves: 30,
    botRank: 9,
    tip: 'Taglia il re con la torre, avvicina il tuo re in opposizione e dai scacco sul bordo.',
  },
  {
    id: 'piu-donna',
    level: 2,
    title: 'Una donna in più',
    blurb: 'Sei in vantaggio enorme: trasformalo in matto senza regalare nulla.',
    fen: '4k3/ppp5/8/8/8/8/PPP5/3QK3 w - - 0 1',
    goal: 'mate',
    maxMoves: 30,
    botRank: 6,
    tip: 'Vantaggio grosso, mente fredda: scambia i pezzi, evita gli scacchi perpetui e vai al matto.',
  },
  {
    id: 'piu-torre',
    level: 2,
    title: 'Una torre in più',
    blurb: 'Un pezzo pesante in più: cambia tutto, se non ti distrai.',
    fen: '4k3/pp3p2/8/8/8/8/PP3P2/R3K3 w - - 0 1',
    goal: 'mate',
    maxMoves: 35,
    botRank: 6,
    tip: 'Prima porta la torre in azione, poi mangia i pedoni deboli e vai al matto.',
  },
  {
    id: 'pedone-opposizione',
    level: 2,
    title: 'Re e pedone: l’opposizione',
    blurb: 'Un solo pedone e due re: vince chi mette il re nel posto giusto.',
    fen: '8/8/4k3/8/2P5/2K5/8/8 w - - 0 1',
    goal: 'promote',
    maxMoves: 15,
    botRank: 12,
    tip: 'Prima il re, poi il pedone: portalo davanti al pedone e conquista l’opposizione. Obiettivo: promuovere.',
  },
  {
    id: 'pedone-b5',
    level: 2,
    title: 'Pedone passato in scacchiera',
    blurb: 'Il re deve scortare il pedone fino alla promozione.',
    fen: '8/8/3k4/1P6/K7/8/8/8 w - - 0 1',
    goal: 'promote',
    maxMoves: 15,
    botRank: 12,
    tip: 'Il re avversario cerca di fermarlo: tieni il tuo re vicino al pedone e prendi la casa giusta. Obiettivo: promuovere.',
  },
  {
    id: 'difendi-opposizione-1',
    level: 3,
    title: 'Salva il pareggio (1)',
    blurb: 'Sei sotto di un pedone: col re giusto al posto giusto è patta.',
    fen: '4k3/8/2K5/8/4P3/8/8/8 b - - 0 1',
    goal: 'draw',
    maxMoves: 25,
    botRank: 14,
    tip: 'Tocca a te, col Nero. Non farti scacciare: tieni l’opposizione e non lasciare passare il pedone.',
  },
  {
    id: 'difendi-opposizione-2',
    level: 3,
    title: 'Salva il pareggio (2)',
    blurb: 'Stessa idea, posizione diversa: resisti alla spinta del pedone.',
    fen: '8/4k3/8/3K4/3P4/8/8/8 b - - 0 1',
    goal: 'draw',
    maxMoves: 25,
    botRank: 14,
    tip: 'Col Nero stai a fronte del re bianco: un solo passo sbagliato e il pedone corre. Obiettivo: pareggiare.',
  },
  {
    id: 'lucena',
    level: 3,
    title: 'La posizione di Lucena',
    blurb: 'Il finale di torre più famoso: si vince con il “ponte”.',
    fen: '1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1',
    goal: 'promote',
    maxMoves: 15,
    botRank: 15,
    tip: 'Il re è davanti al pedone ma bloccato dagli scacchi: costruisci il ponte con la torre. Obiettivo: promuovere.',
  },
  {
    id: 'mate-2alfieri',
    level: 3,
    title: 'Matto con due alfieri',
    blurb: 'Il matto più lungo: gli alfieri lavorano in coppia.',
    fen: '8/8/8/3k4/8/8/8/2B1KB2 w - - 0 1',
    goal: 'mate',
    maxMoves: 40,
    botRank: 9,
    tip: 'Gli alfieri chiudono due diagonali vicine; il re avversario va spinto in un angolo e poi matto.',
  },
]

export const drillById = (id: string): Drill | undefined => DRILLS.find((d) => d.id === id)
export const nextDrill = (id: string): Drill | undefined => DRILLS[DRILLS.findIndex((d) => d.id === id) + 1]

export const GOAL_TEXT: Record<DrillGoal, (n: number) => string> = {
  mate: (n) => `Dai scacco matto in ${n} mosse o meno.`,
  promote: (n) => `Promuovi il pedone in ${n} mosse o meno, senza farlo prendere.`,
  draw: (n) => `Pareggia, oppure resisti ${n} mosse senza perdere.`,
}
