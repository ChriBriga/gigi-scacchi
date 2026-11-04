export type Tone = 'gentle' | 'spicy' | 'ruthless'

export type CoachEvent =
  | 'brilliant'
  | 'best'
  | 'good'
  | 'inaccuracy'
  | 'mistake'
  | 'blunder'
  | 'hanging'
  | 'missedFree'
  | 'win'
  | 'lose'
  | 'draw'
  | 'start'
  | 'puzzleOk'
  | 'puzzleFail'
  | 'lessonDone'

export type Mood = 'happy' | 'neutral' | 'angry' | 'shocked' | 'cool'

export const EVENT_MOOD: Record<CoachEvent, Mood> = {
  brilliant: 'shocked',
  best: 'cool',
  good: 'happy',
  inaccuracy: 'neutral',
  mistake: 'angry',
  blunder: 'angry',
  hanging: 'shocked',
  missedFree: 'neutral',
  win: 'happy',
  lose: 'neutral',
  draw: 'neutral',
  start: 'cool',
  puzzleOk: 'happy',
  puzzleFail: 'neutral',
  lessonDone: 'happy',
}

/** Segnaposto: {pezzo} = "il cavallo", {sq} = "f3". */
const LINES: Record<CoachEvent, Record<Tone, string[]>> = {
  brilliant: {
    gentle: ['Wow! Questa è una mossa da maestro!', 'Mossa geniale! Bravissimo!', 'Che colpo! Non me l’aspettavo!'],
    spicy: ['Aspetta... l’hai fatto apposta?! Geniale!', 'Questa la raccontiamo ai nipoti. Che mossa!', 'Ok, ora ti rispetto. Un po’.'],
    ruthless: ['Non sei fortunato, sei... no aspetta, sei proprio bravo qui. Brillante.', 'Mi hai fregato il lavoro: questa era da maestro.', 'Dimmi che l’hai calcolata. Dimmelo.'],
  },
  best: {
    gentle: ['Perfetta! Proprio la mossa giusta.', 'Esatto, è la migliore!', 'Ottima scelta!'],
    spicy: ['La migliore! Ci sai fare, pivello.', 'Esatto. Vedi che quando ti impegni?', 'Pulita. Mi piace.'],
    ruthless: ['La migliore. Pure un orologio rotto ha ragione due volte al giorno.', 'Giusta. Non montarti la testa.', 'Ok, questa te la concedo.'],
  },
  good: {
    gentle: ['Buona mossa!', 'Va bene, si può fare.', 'Solida, continua così!'],
    spicy: ['Non male, non male.', 'Ok, decente.', 'Passabile. Si va avanti.'],
    ruthless: ['Accettabile. Non entusiasmante.', 'Meh. Ma non hai rotto nulla.', 'Hai fatto il minimo sindacale.'],
  },
  inaccuracy: {
    gentle: ['Eh, c’era qualcosa di meglio. Niente di grave!', 'Piccola imprecisione, si recupera.', 'Si poteva fare meglio, ma tranquillo.'],
    spicy: ['Mmh... c’era di meglio, lo sai?', 'Imprecisione. Il piccione ti guarda storto.', 'Così così. Sveglia!'],
    ruthless: ['Imprecisione. Il tuo cervello era in pausa caffè?', 'Se questa fosse una pizza, sarebbe senza mozzarella.', 'Potevi fare meglio. Quasi sempre potevi.'],
  },
  mistake: {
    gentle: ['Ahi, questo è un errore. Ma si impara!', 'Errore! Guarda bene cosa ti attacca.', 'Hmm, attenzione: questa mossa ti costa cara.'],
    spicy: ['Errore! Guarda meglio la scacchiera, eh!', 'Ahia. Qui hai regalato qualcosa.', 'Ma dai! Controlla sempre cosa può fare l’avversario.'],
    ruthless: ['ERRORE. Hai mosso senza guardare, vero?', 'Complimenti, hai appena aiutato l’avversario. Gentile.', 'Il tuo avversario ringrazia, io meno.'],
  },
  blunder: {
    gentle: ['Oh no, questa è grossa. Riprova, guarda bene!', 'Svarione, capita! Ma ora fai attenzione.', 'Ahia! Hai lasciato qualcosa di grosso.'],
    spicy: ['SVARIONE! Ma che hai fatto?!', 'Hai appena regalato la partita. Bravo, davvero.', 'Questa è da piccione puro. Torna indietro!'],
    ruthless: ['Hai la vista di una talpa con le cataratte.', 'Hai fatto il piccione: hai buttato tutto per aria e sei pure orgoglioso.', 'Questa mossa è un crimine contro gli scacchi.'],
  },
  hanging: {
    gentle: ['Attento: {pezzo} in {sq} è attaccato e non protetto!', 'Occhio a {pezzo} in {sq}: lo possono prendere.'],
    spicy: ['{Pezzo} in {sq} è in presa! Svegliaaa!', 'Ehi! {Pezzo} in {sq} è lì da solo, tipo festa dei single.'],
    ruthless: ['{Pezzo} in {sq} è un regalo di Natale per l’avversario.', 'Hai lasciato {pezzo} in {sq} appeso. Hai presente "attenzione"?'],
  },
  missedFree: {
    gentle: ['Sai che potevi prendere un pezzo gratis?', 'C’era un pezzo da prendere senza rischi, guarda!'],
    spicy: ['C’era un pezzo gratis e l’hai ignorato. Beh, cortesia.', 'Un pezzo gratis, lì. E tu: "no grazie".'],
    ruthless: ['Pezzo gratis. Sul piatto. E non l’hai preso. Capolavoro.', 'Cosa ti serve per prendere un pezzo gratis, un invito scritto?'],
  },
  win: {
    gentle: ['Hai vinto! Che soddisfazione, bravissimo!', 'Scacco matto! Ottima partita!'],
    spicy: ['SCACCO MATTO! Il pivello cresce!', 'Vittoria! Ti concedo un applauso, di ali.'],
    ruthless: ['Hai vinto. Non dirlo troppo in giro, il bot ha fatto errori.', 'Matto. Ok, forse ti sottovalutavo. Forse.'],
  },
  lose: {
    gentle: ['Peccato! Succede a tutti. Rigiochiamo?', 'Sconfitta, ma hai imparato. Ci riproviamo?'],
    spicy: ['Hai perso. Ma il piccione crede ancora in te.', 'Ko. Rivediamo dove ti sei perso?'],
    ruthless: ['Sconfitta. Hai mosso i pezzi come un gatto cammina sulla tastiera.', 'Persa. Meglio così, almeno impari dalla sofferenza.'],
  },
  draw: {
    gentle: ['Patta! Non male.', 'Pareggio, si può fare.'],
    spicy: ['Patta. Né vincitori né vinti, né applausi.', 'Pareggio: il compromesso degli scacchi.'],
    ruthless: ['Patta. Il bel niente.', 'Pareggio. Sei riuscito a non vincere né perdere. Un talento.'],
  },
  start: {
    gentle: ['Pronti! Gioca con calma e controlla le minacce.', 'Cominciamo! Io sono qui se serve aiuto.'],
    spicy: ['Si parte! Non fare il piccione.', 'Via! E guarda bene prima di muovere.'],
    ruthless: ['Facciamo vedere cosa sai fare. Spoiler: poco.', 'Prima di muovere, guarda la scacchiera. Sul serio.'],
  },
  puzzleOk: {
    gentle: ['Giusto! Bravissimo!', 'Esatto, è proprio quella!', 'Perfetto!'],
    spicy: ['Boom! Preso.', 'Bella! Visto che sai farlo?', 'Giusto. Il piccione approva.'],
    ruthless: ['Giusto. Per una volta.', 'Ok, questa l’hai vista. Continua.', 'Esatto. Non ti abituare ai complimenti.'],
  },
  puzzleFail: {
    gentle: ['Non è questa, riprova! Guarda cosa attacchi.', 'Quasi! Pensa a chi puoi attaccare o catturare.'],
    spicy: ['Nope. Riprova, e stavolta guarda!', 'No, non quella. Più attenzione!'],
    ruthless: ['No. Riprova, ma con il cervello acceso.', 'Sbagliato. Hai tirato a indovinare, vero?'],
  },
  lessonDone: {
    gentle: ['Lezione finita! Ottimo lavoro!', 'Fatto! Ora metti in pratica.'],
    spicy: ['Lezione finita. Ora vediamo se hai capito davvero.', 'Fatto! Sei un po’ meno pivello di prima.'],
    ruthless: ['Finita. Ora non dimenticare tutto entro stasera.', 'Fatto. Vediamo se ti resta in testa.'],
  },
}

export function pieceWithArticle(type: string): string {
  switch (type) {
    case 'p': return 'il pedone'
    case 'n': return 'il cavallo'
    case 'b': return "l'alfiere"
    case 'r': return 'la torre'
    case 'q': return 'la regina'
    default: return 'il re'
  }
}

export function sayLine(event: CoachEvent, tone: Tone, vars: { piece?: string; sq?: string } = {}): string {
  const pool = LINES[event][tone]
  const line = pool[Math.floor(Math.random() * pool.length)]
  const the = vars.piece ? pieceWithArticle(vars.piece) : 'il pezzo'
  return line
    .replaceAll('{Pezzo}', the.charAt(0).toUpperCase() + the.slice(1))
    .replaceAll('{pezzo}', the)
    .replaceAll('{sq}', vars.sq ?? '')
}
