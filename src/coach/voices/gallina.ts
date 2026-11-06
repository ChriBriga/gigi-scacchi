import type { Voice } from '../lines'
import { tones as t } from './helpers'

/**
 * Nonna Gallina: affettuosa e severa, metafore di cucina, "ai miei tempi".
 * Gentile = coccole, pepato = rimproveri affettuosi, spietato = nonna che ha visto tutto.
 * Gli eventi non elencati (promozione, scacco, ecc.) ripiegano sulle battute di Gigi.
 */
export const GALLINA: Partial<Voice> = {
  brilliant: t(
    ['Madonnina! Che mossa, bello di nonna! Ti faccio una torta!', 'Che bravo! Mi commuovo, devo sedermi.', 'Questa la racconto a tutte le vicine!'],
    ['Ma guarda un po’! Il mio nipotino fa la mossa da maestro!', 'Mannaggia, che mossa! Mi è caduto il mestolo.', 'Bravissimo! Ora però non montarti la testa, che il sugo si brucia.'],
    ['Una mossa così… da te? Chi ti ha aiutato? Dillo alla nonna.', 'Mi hai sorpresa. Pensavo fossi lento come tuo nonno.', 'Geniale. Ma ai miei tempi ne facevamo di meglio senza computer.'],
  ),
  best: t(
    ['Perfetta, tesoro! La nonna è fiera.', 'Esatto! Hai la testa sulle spalle.', 'Proprio quella! Ti meriti un dolcetto.'],
    ['La migliore! Vedi che quando ti impegni, bello?', 'Pulita come il pavimento di domenica.', 'Giusta! Un po’ di pane e marmellata, ecco.'],
    ['Giusta. Pure un uovo, a volte, esce senza rompersi.', 'Esatto. Non si dice nulla, si pensa.', 'Giusta. Ora falla di nuovo, senza che io debba ricordartelo.'],
  ),
  good: t(
    ['Buona mossa, bello di nonna.', 'Va bene, va bene, continua così.', 'Mossa onesta, come il pane di una volta.'],
    ['Mica male, mica male.', 'Passabile. Si va avanti, che la minestra non si fredda.', 'Ok, decente. Come una pasta senza sugo.'],
    ['Accettabile. Come il caffè di ieri: tiepido.', 'Meh. Ma non hai rotto nulla, e questo è già qualcosa.', 'Hai fatto il minimo. Ai miei tempi bastava meno.'],
  ),
  inaccuracy: t(
    ['Si poteva fare un pochino meglio, tesoro, ma niente di grave.', 'Piccola svista, capita. Con calma si aggiusta.', 'Eh, c’era una mossa migliore. Ma va bene così.'],
    ['Mmh, c’era di meglio, lo sai? La nonna ti vede.', 'Imprecisione! Come un pizzico di sale di troppo.', 'Quasi bene. Quel “quasi” non mi piace.'],
    ['Imprecisione. Il tuo cervello era a fare la spesa?', 'Una mossa così sa di minestra senza sale.', 'Potevi fare meglio. Quasi sempre potevi.'],
  ),
  mistake: t(
    ['Ahi, un errore! Ma dagli errori si impara, tesoro.', 'Attenzione, bello! Qualcosa non quadra: guarda meglio.', 'Un errorino. Respira, e guarda cosa ti attacca.'],
    ['Errore! Ma che hai fatto, figliolo?', 'Mannaggia, hai regalato qualcosa! Guarda meglio la scacchiera.', 'Questa mossa è un buco nella calza. Si vede.'],
    ['ERRORE. Hai mosso senza guardare, vero? Come con la strada.', 'L’avversario ringrazia, io no. Ai miei tempi si guardava.', 'Una mossa così… e dire che ti avevo detto di stare attento!'],
  ),
  blunder: t(
    ['Oh Madonnina, questa è grossa! Ritira, tesoro, dai!', 'Ahi ahi ahi! Torniamo indietro, che ti aiuto.', 'Succede, bello. Ma ritirala, ti prego.'],
    ['SVARIONE! Hai bruciato tutto il sugo!', 'Mannaggia a te! Hai regalato la partita! Ritira!', 'Hai rovesciato la pentola: ritira subito.'],
    ['Hai fatto un disastro in cucina! Il sugo, la pasta, tutto per terra.', 'Questa mossa è un insulto alla mia pazienza e al tuo re.', 'Hai buttato via il lavoro di mezz’ora in un secondo. Ai miei tempi…'],
  ),
  hanging: t(
    ['Attento, bello: {pezzo} in {sq} è senza protezione!', '{Pezzo} in {sq} ha bisogno di aiuto, tesoro.', 'Guarda {sq}: {pezzo} è tutto solo.'],
    ['{Pezzo} in {sq} è in presa, mannaggia! Svegliaaa!', 'Ehi! {Pezzo} in {sq} è lì abbandonato, come un cappotto fuori stagione.', '{Pezzo} in {sq} sta chiamando nonna. Chiamami!'],
    ['{Pezzo} in {sq} è un regalo per l’avversario: confezione compresa.', 'Hai lasciato {pezzo} in {sq} come la roba sul balcone sotto la grandine.', '{Pezzo} in {sq}? Già bell’e perso.'],
  ),
  missedFree: t(
    ['Tesoro, potevi prendere un pezzo gratis! Guarda meglio.', 'C’era un pezzo da prendere senza rischi, bello!', 'Un pezzo regalato, e non l’hai visto.'],
    ['Un pezzo gratis, e l’hai lasciato lì? Che educazione!', 'Il pezzo era lì col fiocco, e tu: “no, grazie”.', 'Mangia, mangia! Anche i pezzi, quando sono gratis.'],
    ['Un pezzo gratis e non l’hai preso? Mi cadono le braccia.', 'Ti avrei fatto la torta se lo avessi preso. Niente torta.', 'Neanche un bambino rifiuta il dolce. Tu rifiuti un pezzo!'],
  ),
  win: t(
    ['Hai vinto! Che bravo il mio nipotino!', 'Scacco matto! Ti preparo il dolce.', 'Vittoria! La nonna è tanto orgogliosa.'],
    ['SCACCO MATTO! Il mio campione!', 'Hai vinto! Stasera lo dico alle vicine.', 'Vittoria! Un applauso da nonna: clap clap.'],
    ['Hai vinto. Il bot ha sbagliato, ma bravo comunque. Non vantarti.', 'Matto. Pensavo peggio di te. Sono sollevata.', 'Vittoria tua, merito mio per il 90%. Va bene, 50.'],
  ),
  lose: t(
    ['Dai, non fa niente, tesoro. Domani andrà meglio.', 'Hai perso, ma hai giocato con impegno.', 'Capita a tutti. Vieni qui, ti faccio una tisana.'],
    ['Hai perso. Ma la nonna crede ancora in te.', 'Ko. Rivediamo dove ti sei perso, figliolo.', 'Sconfitta. Mangiati qualcosa e riproviamo.'],
    ['Hai perso. Ai miei tempi si studiava di più.', 'Sconfitta. Niente dolce, stasera.', 'Hai perso. Ti avevo avvertito, ma tu niente.'],
  ),
  draw: t(
    ['Patta, bello: né vincitori né vinti.', 'Pareggio! Come una fetta di torta divisa a metà.', 'Patta. Va bene, andiamo.'],
    ['Patta. Un po’ come una minestra senza sale.', 'Pareggio: il compromesso dei nonni.', 'Patta. Né carne né pesce.'],
    ['Patta. Il bel niente.', 'Pareggio. Hai fatto un mezzo lavoro.', 'Patta: la partita da divano.'],
  ),
  start: t(
    ['Si comincia, tesoro! Guarda bene e stai tranquillo.', 'Pronti! La nonna è qui che fa il tifo.', 'Buona partita! Respira, bello.'],
    ['Si parte! Non fare il pasticcio, eh.', 'Via! E guarda prima di muovere, che non voglio brontolare.', 'Si comincia. Ricordati di mangiare qualcosa dopo.'],
    ['Facciamo vedere cosa sai fare. Spoiler: poco.', 'Prima di muovere, guarda. Ai miei tempi si guardava.', 'Si parte. Un consiglio: pensa. Poi pensa ancora.'],
  ),
  puzzleOk: t(
    ['Bravissimo! Proprio quella!', 'Esatto, tesoro! Che testa!', 'Perfetto! Un bacione alla nonna.'],
    ['Boom! Preso, figliolo.', 'Giusto! Visto che sai farlo?', 'Bravo! Un biscotto per te.'],
    ['Giusto. Per una volta.', 'Ok, questa l’hai vista. Non montarti la testa.', 'Esatto. Non ti abituare ai complimenti.'],
  ),
  puzzleFail: t(
    ['Non è questa, bello. Guarda ancora un po’.', 'Quasi! Pensa a chi puoi attaccare.', 'Niente paura, riprova con calma.'],
    ['Nope! Riprova, che la minestra non aspetta.', 'No, non quella. Più attenzione!', 'Hm. Non ci siamo. Riprova.'],
    ['No. Riprova, ma col cervello acceso.', 'Sbagliato. Hai tirato a indovinare, vero?', 'No. Ai miei tempi sapevamo rispondere.'],
  ),
  lessonDone: t(
    ['Lezione finita! Che bravo!', 'Fatto, tesoro! Ora metti in pratica.', 'Un’altra cosa imparata: la nonna è orgogliosa.'],
    ['Lezione finita. Ora vediamo se hai capito.', 'Fatto! Sei un po’ meno pivello di prima.', 'Finita! Ora un po’ di merenda.'],
    ['Finita. Non dimenticare tutto entro stasera.', 'Fatto. Domani te la rifaccio, vedrai.', 'Lezione completata. Il cervello ringrazia.'],
  ),
  nonsense: t(
    ['Mmh? Avanti e indietro… ma che fai, tesoro?', 'Non capisco, bello: qual è il piano?', '??? Spiegami, che la nonna non segue.'],
    ['Avanti e indietro, avanti e indietro. Stai facendo ginnastica?', 'Ma che mossa è? Mannaggia, nemmeno io capisco.', 'Questa mossa non ha né capo né coda.'],
    ['Questa mossa non ha senso. Ai miei tempi nemmeno ci si provava.', 'Su e giù come la pasta nell’acqua. Ma almeno cuoce.', '??? Mi gira la testa.'],
  ),
  castle: t(
    ['Arrocco! Il re è al sicuro, tesoro.', 'Bella mossa: il re si mette al caldo.', 'Arrocco! Bravo, lui si copre bene.'],
    ['Arrocco! Il re si mette la sciarpa. Finalmente.', 'Il re al riparo: così mi piace.', 'Arrocco! Un po’ di buon senso.'],
    ['Arrocco. Era ora, il re girava senza giacca.', 'Hai arroccato. Mi stupisci.', 'Re al sicuro. Un miracolo.'],
  ),
  queenTake: t(
    ['La regina! Che bravo!', 'Hai preso la regina! Mi emoziono.', 'Regina catturata! Che colpo!'],
    ['La REGINA! Mannaggia, che mossa!', 'Regina presa! Chi lo dice alle vicine?', 'Gran colpo! Ora l’avversario piange.'],
    ['Hai preso la regina. Sorpresa: sai giocare.', 'La regina. Presa. Non ti esaltare.', 'Ok, questa te la applaudo. Piano.'],
  ),
  retract: t(
    ['Mossa ritirata! Ora guarda bene, tesoro.', 'Bene, riprendiamo. Respira.', 'Ripensarci è da persone sagge.'],
    ['Ritirata! Ora ci pensi, vero?', 'Indietro! E questa volta col cervello acceso.', 'Un’altra occasione. Non sprecarla.'],
    ['Ritirata. La prossima volta guarda PRIMA.', 'Mossa annullata. La nonna scuote la testa.', 'Ritirata. Un’altra vita per il tuo re.'],
  ),
  quizAsk: t(
    ['Prima di ritirare: dov’è il guaio, tesoro? Tocca il pezzo.', 'Dimmi tu, bello: da dove arriva il pericolo?', 'Un indovinello della nonna: dov’è il problema?'],
    ['Dov’è il guaio, figliolo? Tocca il pezzo giusto.', 'Prima di ritirare, trova il guaio. Tocca!', 'Indovina dov’è il pasticcio. Su, tocca.'],
    ['Vuoi ritirare? Prima dimostra di aver capito. Tocca il guaio.', 'Dov’è l’errore? Tocca il pezzo. Ai miei tempi si capiva da soli.', 'Il ritiro si merita. Trova il guaio.'],
  ),
  quizOk: t(
    ['Esatto! Hai visto il guaio. Che bravo!', 'Bravo, tesoro! Vedere il pericolo è già tanto.', 'Giusto! Ora ritira, senza paura.'],
    ['Giusto! Occhio fino. Usalo PRIMA di muovere.', 'Preso! Ora ritira e prometti di guardare.', 'Esatto: il pericolo era lì.'],
    ['Giusto. Potevi vederlo prima, ma vabbè. Ritira.', 'Esatto. Piccola vittoria. Ora ritira.', 'Bene. Hai trovato il guaio che hai combinato tu.'],
  ),
  quizMiss: t(
    ['Non è lì, bello. Guarda chi può muovere.', 'Quasi! Pensa a chi ti attacca.', 'Non proprio. Riprova con calma.'],
    ['Nope! Riprova, che la minestra si fredda.', 'Fuori bersaglio. Chi minaccia chi?', 'Non è quello. Un altro tentativo.'],
    ['No. Neanche vicino. Guarda cosa può prendere l’avversario.', 'Sbagliato. Riprova, e stavolta guarda.', 'No. Ai miei tempi bastava un’occhiata.'],
  ),
  cleanGame: t(
    ['Partita pulita! Nemmeno un ritiro: la nonna è orgogliosa!', 'Zero ritiri! Hai fatto tutto da solo. Che bravo!'],
    ['Partita pulita! Zero ritiri: ora sì che sei grande.', 'Nemmeno un ritiro! Ti meriti una torta.'],
    ['Zero ritiri. Hai giocato come si deve. Mi hai stupita.', 'Partita pulita. Non sembri nemmeno tu.'],
  ),
  poke: t(
    ['Ehi tesoro! Mi fai il solletico!', 'Dimmi, bello, ti serve qualcosa?', 'Coccodè! Presente!'],
    ['Giù le mani dalla nonna!', 'Ehi! Non vedi che sto sistemando le uova?', 'Mannaggia, che c’è? Sto facendo il brodo.'],
    ['Toccami ancora e ti do una cucchiaiata.', 'Che vuoi? Non vedi che sono occupata?', 'Giù le zampe, bello.'],
  ),
  pokeMany: t(
    ['Basta, bello, mi fai arrabbiare un poco!', 'Va bene, ora basta: giochiamo a scacchi?', 'Un po’ di rispetto per la nonna!'],
    ['BASTA! Sto per perdere la pazienza!', 'Smettila, o ti metto in castigo!', 'Ancora?! Ora il mestolo.'],
    ['SMETTILA! Il mestolo è pronto.', 'Un altro tocco e niente dolce per una settimana.', 'Sono una nonna, non un campanello.'],
  ),
  greetNew: t(
    ['Ciao, tesoro! Sono Nonna Gallina. Facciamo un testino per capire da dove partire?', 'Benvenuto, bello di nonna! Cinque puzzle e capiamo come stai messo.', 'Piacere, io sono Nonna Gallina. Un test veloce e cominciamo.'],
    ['Ciao figliolo! Sono Nonna Gallina. Test iniziale: vediamo cosa sai.', 'Benvenuto nel mio pollaio. Test di due minuti: vediamo se c’è cervello.', 'Eccoti! Facciamo il test, che voglio vedere come stai messo.'],
    ['Un nuovo allievo. Facciamo il test, che misuro il disastro.', 'Sono Nonna Gallina. Il test dura due minuti. Il mio giudizio, tutta la vita.', 'Benvenuto. Spero tu non sia come tuo cugino.'],
  ),
  greetMorning: t(
    ['Buongiorno, tesoro! Hai fatto colazione? Ecco il piano di oggi.', 'Buongiorno! Un caffelatte e una partitina?', 'Buon mattino, bello di nonna!'],
    ['Buongiorno, figliolo! Piano di oggi: 15 minuti, niente scuse.', 'Giorno! Hai mangiato qualcosa? E poi si studia.', 'Buongiorno! Il sole è alto e i pezzi ti aspettano.'],
    ['Buongiorno. Hai l’aria di uno che non ha dormito. Giochiamo lo stesso.', 'Mattina. Ai miei tempi a quest’ora si era già in piedi da ore.', 'Buongiorno. Piano pronto. Scuse no.'],
  ),
  greetAfternoon: t(
    ['Buon pomeriggio, tesoro! Una merenda e un po’ di scacchi?', 'Buon pomeriggio! Ecco il piano di oggi.', 'Ciao bello! Il pomeriggio è perfetto per un puzzle.'],
    ['Buon pomeriggio, figliolo! Hai finito di fare il pigro?', 'Pomeriggio! Pausa finita. Si lavora.', 'Ciao! Il sole picchia e il piano pure.'],
    ['Pomeriggio. Se avessi studiato prima, ora saresti bravo. Cominciamo.', 'Buon pomeriggio. Tempo da perdere? Perdilo con me.', 'Pomeriggio. Prima i pezzi, poi il divano.'],
  ),
  greetEvening: t(
    ['Buonasera, tesoro! Una partita prima di cena?', 'Buonasera! Ecco il piano di oggi, con calma.', 'Ciao! La sera è perfetta per rilassarsi con qualche mossa.'],
    ['Buonasera, figliolo! Ancora in piedi? Vediamo cosa sai fare.', 'Sera! Giornata dura? Sfogati con una partita.', 'Buonasera. La cena è quasi pronta, ma una partita ci sta.'],
    ['Buonasera. Giochi invece di fare altro. Sei dei miei.', 'Sera. Ultima partita? Penultima? Giochiamo.', 'Buonasera. Oggi non ce l’hai fatta prima. Fa niente.'],
  ),
  greetNight: t(
    ['Ma è tardi, tesoro! Una partitina e poi a nanna?', 'Notte, bello! Gioca con calma.', 'Ciao! Non è un po’ tardi? Va bene, ci sono.'],
    ['Che ora è? Notte fonda! Una partita e poi a letto.', 'Nottambulo! Come tuo nonno.', 'Tempi supplementari, figliolo. Giochiamo, poi dormi.'],
    ['È notte. Il tuo cervello a quest’ora non funziona. Il mio sì, ho dormito.', 'Notte fonda. Ottimo momento per giocare male.', 'A quest’ora gli svarioni sono garantiti.'],
  ),
  greetBack: t(
    ['Bentornato, tesoro! Sono passati {n} giorni, mi sei mancato!', 'Eccoti! {n} giorni senza di te. Ripartiamo piano.', 'Ciao bello! Non importa quanto sei stato via.'],
    ['Ah, il ritorno del nipote! {n} giorni di assenza. Mi hai fatta preoccupare.', 'Bentornato. {n} giorni, eh? Ti sei dimenticato come si muove il cavallo?', 'Eccoti! Il tuo posto era caldo. Con le mie piume.'],
    ['{n} giorni senza di te. Il pollaio era più tranquillo. Ma si riparte.', 'Ah, sei vivo. {n} giorni. Scommetto che hai dimenticato tutto.', 'Bentornato. Gli scacchi non scappano, tu sì: {n} giorni.'],
  ),
  greetStreak: t(
    ['{n} giorni di fila! La nonna è orgogliosa.', 'Che costanza: {n} giorni consecutivi!', '{n} giorni uno dopo l’altro. Bravo!'],
    ['{n} giorni di fila! Cominci a fare sul serio, eh?', 'Serie di {n} giorni! Ti darei un biscotto. Anzi, due.', '{n} giorni di seguito: la nonna approva.'],
    ['{n} giorni di fila. Costante. Che noia. Bravo.', '{n} giorni consecutivi: o sei motivato o hai paura della nonna.', 'Serie di {n}. Non rovinarla oggi.'],
  ),
  thinking: t(
    ['Fammi pensare, tesoro…', 'Un attimo, guardo bene…', 'Vediamo un po’…'],
    ['Fammi pensare… ma ci metto meno di te.', 'Un attimo, sto ragionando.', 'Silenzio, la nonna riflette.'],
    ['Fammi pensare: ho un cervello piccolo ma efficiente.', 'Calcolo. Non disturbare la nonna.', 'Un secondo: cerco le parole per non offenderti. Non le trovo.'],
  ),
  idleNap: t(
    ['Zzz… scusa, tesoro, mi sono appisolata sulla sedia.', 'Zzz… sogno una torta gigante. Dimmi quando muovi.', 'Ti aspetto, nessuna fretta. Dormo un pochino.'],
    ['Zzz… hai deciso? Io ho già fatto un pisolino.', 'Mi sono addormentata. Svegliami quando muovi.', 'Zzz… sogno una mossa che tu non hai ancora fatto.'],
    ['Zzz… questo silenzio è un sonnifero.', 'Mi hai fatto addormentare. Come una lezione di storia.', 'Zzz… se pensi così tanto, o è difficile o non pensi.'],
  ),
  notebookSaved: t(
    ['Ho segnato {errori} sul quaderno: li rivediamo con calma, tesoro.', 'Sul quaderno ho aggiunto {errori}. Poco alla volta si impara.', 'Annotati {errori}: la nonna non dimentica.'],
    ['Ho scritto {errori} sul quaderno. Tornano a trovarti, come i parenti a Natale.', 'Sul quaderno: {errori}. Li rivediamo presto.', '{errori} annotati. Li ritroverai.'],
    ['Quaderno aggiornato con {errori}. Verranno a cercarti.', '{errori} segnati. Li rivedrai finché non li azzecchi.', 'Annotati {errori}. La nonna non dimentica.'],
  ),
  firstWin: t(
    ['La tua PRIMA vittoria! Mi commuovo. Che bravo il mio nipotino!', 'Prima vittoria! Ricordati di questo giorno.', 'Hai vinto la tua prima partita! Sono così orgogliosa.'],
    ['PRIMA VITTORIA! Lo dico alle vicine!', 'Hai battuto il tuo primo avversario! La nonna piange di gioia.', 'La prima non si scorda. Ora la seconda.'],
    ['Prima vittoria. Chi l’avrebbe detto? Io no.', 'Prima vittoria. Posso crederci? Devo? No. Ci credo.', 'Hai vinto. Era ora. Mi ero rassegnata.'],
  ),
  botBeaten: t(
    ['Hai battuto {bot}! Che bravo!', '{bot} è stato sconfitto! Un livello in più, tesoro.', 'Evviva, {bot} non è più un problema!'],
    ['{bot} è a terra! Sei il mio eroe.', 'Hai battuto {bot}! Ora lo sanno tutti.', '{bot} ha perso contro di te. Vai a dirlo in giro.'],
    ['{bot} sconfitto. Il prossimo ti ridurrà in briciole.', 'Hai battuto {bot}. Non montarti la testa.', '{bot} è ko. Non pensavo ce la facessi.'],
  ),
  resume: t(
    ['Bentornato, tesoro! La partita contro {bot} ti aspettava.', 'Ecco il mio nipotino! Riprendiamo, con calma, come il sugo.', 'Ripresa la partita! Respira e guarda la scacchiera.'],
    ['Eccoti! {bot} ha aspettato, io ho sferruzzato. Su, muovi.', 'Sei tornato? Rileggi la posizione, che la memoria non è più quella di una volta.', 'Ripresa la partita! Non farmi aspettare come il pane in forno.'],
    ['Eri scappato, eh? Ai miei tempi non si lasciavano le partite a metà.', '{bot} ti ha aspettato. Io ho già sistemato la cucina due volte.', 'Ripresa la partita. Vedi di non combinare guai, che non ho più pazienza.'],
  ),
}
