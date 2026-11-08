import type { Voice } from '../lines'

/** Le etichette nuove delle mosse: Ottima (!), apertura di libro, occasione mancata. */
export type QualityEvent = 'great' | 'book' | 'miss'

export const GIGI_QUALITY: Pick<Voice, QualityEvent> = {
  great: {
    gentle: [
      'Ottima! Era l’unica mossa che reggeva, e l’hai trovata.',
      'Bravissimo: qui c’era una sola strada e l’hai vista.',
      'Che occhio! Questa era la mossa difficile.',
      'Una sola mossa giusta, e tu l’hai presa. Complimenti!',
    ],
    spicy: [
      'Ottima! Le altre mosse facevano acqua e tu l’hai capito. Sospetto.',
      'L’unica mossa che teneva. Ti sei svegliato col piede giusto.',
      'Esatto, tutto il resto perdeva. Bel colpo, pivello.',
      'Mossa difficile, trovata. Mi stai quasi facendo sentire inutile.',
    ],
    ruthless: [
      'Era l’unica mossa. L’hai trovata. Segno il giorno sul calendario del parco.',
      'Una sola via d’uscita e l’hai presa: la fortuna aiuta gli audaci. Forse anche i distratti.',
      'Ottima. Il resto della tua partita non mi ha preparato a questo.',
      'Tutte le altre mosse perdevano. Questa no. Mi hai spiazzato.',
    ],
  },
  book: {
    gentle: [
      'Questa apertura è un classico, la conoscono tutti. Bene così!',
      'Mossa da manuale: la giocano i campioni da secoli.',
      'Ottimo inizio, si vede che sai da dove partire.',
    ],
    spicy: [
      'Mossa da manuale. Hai letto il libro o ti è venuta per caso?',
      'Un classico dell’apertura. Tranquillo, finché è di libro non puoi sbagliare.',
      'Apertura nota a tutti. Il difficile viene dopo, pivello.',
    ],
    ruthless: [
      'Da manuale. Peccato che dopo il manuale finisca e inizi la tua fantasia.',
      'Mossa di libro: copiare è facile. Vediamo quando devi pensare davvero.',
      'Classico. Finché copi non sbagli: dopo, vedremo.',
    ],
  },
  miss: {
    gentle: [
      'L’avversario aveva sbagliato, c’era qualcosa di meglio da prendere. Guarda bene la prossima volta!',
      'Occasione mancata: c’era un regalo e non l’hai visto. Capita.',
      'Lui ha sbagliato e tu potevi approfittarne. Controlla sempre l’ultima mossa avversaria!',
    ],
    spicy: [
      'Occasione mancata! L’avversario ti ha fatto un regalo e tu l’hai lasciato lì.',
      'Lui ha sbagliato, tu non te ne sei accorto. Roba da piccioni distratti.',
      'Il regalo era sul tavolo. Tu hai guardato altrove.',
    ],
    ruthless: [
      'Ti ha servito la vittoria su un piatto e tu hai chiesto il conto. Occasione mancata.',
      'L’avversario ha sbagliato apposta per te. E tu niente. Complimenti.',
      'Un errore avversario sprecato. Il parco piange.',
    ],
  },
}
