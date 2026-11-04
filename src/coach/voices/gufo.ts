import type { Voice } from '../lines'
import { tones as t } from './helpers'

/**
 * Professor Gufo: pomposo, accademico, con finto latino e bocciature solenni.
 * Gentile = mentore paziente, pepato = ironia da cattedra, spietato = commissione d’esame.
 * Gli eventi non elencati (promozione, scacco, ecc.) ripiegano sulle battute di Gigi.
 */
export const GUFO: Partial<Voice> = {
  brilliant: t(
    ['Magnifico! Una mossa degna di un’accademia: summa cum laude!', 'Egregio allievo, che eleganza! Mi si appanna il monocolo.', 'Ex cathedra lo dichiaro: mossa eccellente!'],
    ['Eureka! Questa la inserisco nel mio trattato, tra le cose impossibili.', 'Incredibile! Ho dovuto riscrivere la lavagna.', 'Perbacco, allievo: ora la mia ipotesi su di te va rivista.'],
    ['Una mossa brillante. Un errore statistico, senz’altro. Ma brillante.', 'Hmm. Mi tocca ammetterlo: quod erat demonstrandum, per una volta.', 'Geniale. Ora non macchiare tutto con la prossima.'],
  ),
  best: t(
    ['Esatto! Una scelta ineccepibile, caro allievo.', 'Perfetta, ergo corretta.', 'Ottimo ragionamento: si vede lo studio.'],
    ['Corretta. Il professore annuisce, a suo modo.', 'Bene. Vedo che qualcosa dei miei insegnamenti ti è rimasto.', 'Pulita. Come una lavagna appena cancellata.'],
    ['Corretta. Anche la peggiore teoria, per caso, a volte è esatta.', 'Esatta. Non è una sorpresa: è statistica.', 'Va bene. Non attendere applausi.'],
  ),
  good: t(
    ['Mossa solida, caro allievo.', 'Accettabile, con riserva positiva.', 'Ragionevole. Procediamo.'],
    ['Sufficiente. Sei promosso, ma di poco.', 'Né brillante né errata: in medio stat virtus.', 'Passabile. Il registro registra un “discreto”.'],
    ['Mediocre. Come una conferenza il venerdì pomeriggio.', 'Una mossa. Esiste. Cogito, ergo esiste.', 'Voto: sei meno. Perché mi hai fatto addormentare.'],
  ),
  inaccuracy: t(
    ['Un’imprecisione, caro: errare humanum est.', 'Si poteva fare meglio, ma niente di grave.', 'Piccola svista: rivediamo con calma.'],
    ['Imprecisione! Il professore corruga le sopracciglia.', 'Mmh. C’era una mossa migliore. Ahimè.', 'Quasi. Il “quasi” è il peggior nemico dello studente.'],
    ['Imprecisione. Un compito in classe da quattro, non di più.', 'Hai sbagliato per distrazione, immagino. O per vocazione.', 'Vedo che il ripasso non è stato fatto.'],
  ),
  mistake: t(
    ['Ahimè, un errore. Ma l’errore è il miglior maestro.', 'Attenzione: questa mossa comporta conseguenze.', 'Errore, caro allievo. Ripensiamoci insieme.'],
    ['Errore! Mea culpa, avrei dovuto spiegartelo meglio.', 'Ahimè! La tesi crolla alla prima obiezione.', 'Questa mossa ha una falla logica grande come un volume.'],
    ['ERRORE. Hai mosso senza ragionare, ergo senza ragione.', 'La tua mossa ha dimostrato il contrario di quanto volevi. Complimenti.', 'Un errore da manuale. Del manuale “come non fare”.'],
  ),
  blunder: t(
    ['Ahimè, una svista grossolana. Ritira, ti prego.', 'Oh cielo! Qui la teoria è crollata. Riproviamo?', 'Un errore grave, caro allievo. Ma si rimedia: ritira!'],
    ['SVARIONE! Questa la inserisco nell’antologia degli orrori.', 'Hai appena dimostrato che 2+2=5. Ritira!', 'Un errore così non si vedeva dai tempi di Pitagora… quando ha perso il righello.'],
    ['Una mossa che offende la logica e l’estetica. Respinta.', 'Tesi respinta. Rimandato a settembre. Anzi, a mai.', 'Questa mossa è un crimine contro la ragione.'],
  ),
  hanging: t(
    ['Si noti, allievo: {pezzo} in {sq} è attaccato e non protetto.', 'Attenzione a {sq}: {pezzo} è privo di difesa.', '{Pezzo} in {sq}: esposto. Proteggilo o spostalo.'],
    ['{Pezzo} in {sq} è in presa! Come direbbe Aristotele: ahia.', 'Ehi! {Pezzo} in {sq} è lì solo come un filosofo a una festa.', '{Pezzo} in {sq}: in extremis. Fai qualcosa.'],
    ['{Pezzo} in {sq} è un dono per l’avversario: pro bono pacis.', 'Hai abbandonato {pezzo} in {sq} come un tomo nella polvere.', '{Pezzo} in {sq}: de profundis.'],
  ),
  missedFree: t(
    ['Noto che potevi catturare un pezzo gratis, caro.', 'Un pezzo era a tua disposizione: guarda meglio.', 'Si poteva prendere materiale senza rischi, allievo.'],
    ['Un pezzo gratis, ignorato. Pura filosofia dello spreco.', 'Il pezzo era lì. L’hai guardato e hai detto: “no grazie”.', 'Rifiutare un pezzo gratis è eroismo o distrazione. Ho il sospetto.'],
    ['Un pezzo gratuito, e tu lo lasci lì. Che vergogna accademica.', 'Cosa ti serve per prendere un pezzo gratis, una lettera di raccomandazione?', 'Hai rifiutato un regalo. Persino i miei studenti peggiori accettano.'],
  ),
  win: t(
    ['Vittoria! Veni, vidi, vici, caro allievo. Sono fiero.', 'Scacco matto! Una dimostrazione impeccabile.', 'Complimenti: hai superato l’esame con onore!'],
    ['SCACCO MATTO! Q.E.D., allievo.', 'Hai vinto! Lo scriverò sulla lavagna del corridoio.', 'Vittoria! Ora la tesi di laurea.'],
    ['Hai vinto. Il bot ha commesso errori, ma l’esito è inoppugnabile.', 'Matto. Mi ero sbagliato su di te. Succede una volta ogni dieci anni.', 'Vittoria. Registro, a malincuore, un “bravo”.'],
  ),
  lose: t(
    ['Sconfitta, caro. Ma ogni esame bocciato insegna.', 'Hai perso. Rivediamo la lezione insieme?', 'Capita. Errare humanum est, perseverare… lo evitiamo.'],
    ['Hai perso. Rimandato a settembre!', 'Ko. Ripassiamo, allievo.', 'Sconfitta. Il professore sospira, a lungo.'],
    ['Sconfitta. Bocciato con lode negativa.', 'Persa. Se fosse un esame, ti consiglierei un’altra facoltà.', 'Hai perso. Sic transit gloria… di quella che non hai.'],
  ),
  draw: t(
    ['Patta, caro: un equilibrio dignitoso.', 'Pareggio. In medio stat virtus.', 'Patta. Nessuno trionfa, nessuno ha torto.'],
    ['Patta. Né lode né infamia: una dissertazione tiepida.', 'Pareggio: il compromesso degli accademici.', 'Patta. Ho visto conferenze più eccitanti.'],
    ['Patta. Un voto di sufficienza assoluta, ossia niente.', 'Pareggio: l’arte di non vincere né perdere.', 'Patta. Il bel nulla, ex nihilo.'],
  ),
  start: t(
    ['Cominciamo, allievo! Con calma e rigore.', 'Si inizi: in medias res. Io osservo.', 'Prego, la scacchiera è tua. Rifletti.'],
    ['Si parte! Non fare il piccione… mi scusi, il pivello.', 'Via! E rifletti prima di muovere, obsecro.', 'Ecco, il campo è aperto. Non deludere la facoltà.'],
    ['Cominciamo. Prevedo dodici mosse prima del primo disastro.', 'Via. Ricorda: il pensiero precede il pezzo. Ogni tanto.', 'Si inizi. Spoiler: la tua tesi non reggerà.'],
  ),
  puzzleOk: t(
    ['Esatto! Una soluzione elegante.', 'Giusto, caro allievo. Bravo.', 'Perfetto! Il ragionamento è corretto.'],
    ['Corretto. Il professore concede un “molto bene”.', 'Preso! Lo annoto sul registro.', 'Giusto. Hai ragionato, per una volta.'],
    ['Esatto. Per caso, ma esatto.', 'Corretto. Non farci l’abitudine.', 'Va bene. Si noti che era facile.'],
  ),
  puzzleFail: t(
    ['Non è questa, caro. Rifletti ancora un poco.', 'Quasi! Considera bersagli e catture.', 'Niente paura: riprova con metodo.'],
    ['No, caro. Il metodo, prego!', 'Errata. Rileggi il problema.', 'Hm, no. Concentrati.'],
    ['No. Hai tirato a indovinare, immagino.', 'Errata. Rimandato a ripetizione.', 'No. Questo è il tipo di risposta che giustifica gli esami orali.'],
  ),
  lessonDone: t(
    ['Lezione conclusa. Bravo, allievo!', 'Fatto! Ora la pratica seguirà la teoria.', 'Ottimo! Un’altra pagina del tuo sapere.'],
    ['Lezione finita. Domani l’interrogazione!', 'Fatto. Ora dimostra di aver capito.', 'Concluso. Ricordati di ripassare.'],
    ['Finita. Sarà dimenticata entro stasera, prevedo.', 'Fatto. Domani, interrogazione a sorpresa.', 'Lezione completata. Il cervello ringrazia, forse.'],
  ),
  nonsense: t(
    ['Hmm? Avanti e indietro: qual è la tua tesi?', 'Non seguo il ragionamento, caro. Illustrami.', '??? La logica mi sfugge.'],
    ['Avanti e indietro. Una dissertazione sul vuoto?', 'Non ho compreso la strategia. E io comprendo tutto.', 'Questa mossa è un enigma. Senza soluzione.'],
    ['Questa mossa non ha senso. Nemmeno in latino.', 'Su e giù, su e giù: fai ginnastica?', '??? È un esperimento sulla mia pazienza.'],
  ),
  castle: t(
    ['Arrocco: eccellente misura di sicurezza.', 'Bene! Il re è al riparo, la torre in campo.', 'Arrocco, come da manuale. Bravo!'],
    ['Arrocco. Finalmente un po’ di buon senso.', 'Il re si ritira nel suo studio. Prudente.', 'Arrocco: la prima regola, rispettata.'],
    ['Arrocco. Era ora, il re era in pericolo imminente.', 'Hai arroccato. Scommettevo sul contrario.', 'Re al sicuro. Un miracolo accademico.'],
  ),
  queenTake: t(
    ['La regina! Un colpo magistrale!', 'Hai catturato la regina: eccellente!', 'Regina presa. Il nemico vacilla.'],
    ['La REGINA! Il professore perde il monocolo.', 'Presa la regina: bravo, ora non perdere la tua.', 'Gran colpo! Ora l’avversario è senza regina e senza argomenti.'],
    ['Hai preso la regina. Sorpresa: sai giocare. A tratti.', 'La regina. Presa. Non esaltarti.', 'Applaudo. Con una piuma sola.'],
  ),
  retract: t(
    ['Mossa ritirata. Rifletti con calma.', 'Ben fatto: ripensare è saggezza.', 'Riprendiamo da qui, allievo.'],
    ['Ritirata. Stavolta ragiona prima, grazie.', 'Indietro tutta. E usa il cervello.', 'Rewind. Non sprecare la seconda occasione.'],
    ['Ritirata. Il pensiero precede il pezzo, ricordi?', 'Mossa annullata. Il professore sbadiglia.', 'Ritirata: un esame di riparazione.'],
  ),
  quizAsk: t(
    ['Prima di ritirare: dov’è il guaio? Tocca il pezzo.', 'Qual è la falla, caro? Tocca il pezzo coinvolto.', 'Un quesito: da dove nasce il pericolo?'],
    ['Dov’è il guaio? Tocca il pezzo giusto.', 'Quesito d’esame: dov’è l’errore? Tocca.', 'Prima di ritirare, individua la falla.'],
    ['Vuoi ritirare? Dimostra prima di aver compreso. Tocca il guaio.', 'Dov’è l’errore che hai commesso? Tocca.', 'Il ritiro si merita: individua il pezzo.'],
  ),
  quizOk: t(
    ['Esatto! Hai individuato la falla.', 'Bravo! Vedere il pericolo è già metà del metodo.', 'Giusto! Ora ritira pure.'],
    ['Giusto. Applica lo stesso occhio PRIMA di muovere.', 'Corretto! Ora ritira e giura di guardare meglio.', 'Esatto: il pericolo era lì.'],
    ['Giusto. Potevi vederlo prima, ma sorvoliamo. Ritira.', 'Esatto. Una piccola vittoria. Ora ritira.', 'Bene. Hai trovato l’errore che hai commesso tu.'],
  ),
  quizMiss: t(
    ['Non è lì. Rifletti su chi può muovere.', 'Quasi! Guarda i pezzi che attaccano.', 'Non proprio. Un altro sguardo.'],
    ['No. Più attenzione, prego.', 'Fuori bersaglio. Chi minaccia chi?', 'Non è quello. Riprova.'],
    ['No. Neanche vicino. Guarda cosa può catturare l’avversario.', 'Errata. Un’altra possibilità, per pietà.', 'No. Il Professor Gufo si copre gli occhi con l’ala.'],
  ),
  cleanGame: t(
    ['Partita pulita! Nessun ritiro: eccellente disciplina.', 'Zero ritiri! Un metodo impeccabile.'],
    ['Partita pulita! Summa cum laude.', 'Nemmeno un ritiro! Il professore è colpito.'],
    ['Zero ritiri. Hai giocato senza rete. Mi hai stupito.', 'Partita pulita. Non sembri nemmeno tu.'],
  ),
  poke: t(
    ['Ehm, prego? Posso aiutarti?', 'Buongiorno, allievo. Desideri qualcosa?', 'Mi hai toccato il tocco. Accetto le scuse.'],
    ['Scusa, sto riflettendo su cose importanti.', 'Non si tocca il professore. È una regola non scritta.', 'Prego? Il cappello va rispettato.'],
    ['Giù le zampe dal docente.', 'Mi stai toccando. Annoto sul registro.', 'Un altro tocco e ti mando dal preside.'],
  ),
  pokeMany: t(
    ['Basta così, caro. Ora mi irrito.', 'Un po’ di contegno, per favore!', 'Si torni agli scacchi: ora et labora.'],
    ['BASTA! Un’altra volta e ti sospendo!', 'Ho la pazienza di un santo. Ma anche i santi hanno un limite.', 'Smettila, o ti interrogo sulle nove teorie.'],
    ['SMETTILA! Sospensione immediata!', 'Un altro tocco e la bocciatura è certa.', 'Sono un professore, non un campanello.'],
  ),
  greetNew: t(
    ['Benvenuto, egregio allievo! Sono il Professor Gufo. Cominciamo con un piccolo test per valutare il tuo livello.', 'Prego, accomodati. Un test d’ingresso e poi comincia il corso.', 'Piacere: Professor Gufo. Un breve esame per iniziare?'],
    ['Benvenuto, matricola! Test d’ingresso: vediamo cosa c’è in quella testa.', 'Ecco la nuova recluta. Test di due minuti: misuriamo il disastro.', 'Egregio, cinque quesiti. Poi decido se ti promuovo.'],
    ['Una nuova matricola. Il test dura due minuti. Il mio giudizio, tutto il semestre.', 'Test d’ingresso: spero tu sia più bravo di quanto mi aspetto.', 'Benvenuto. Vediamo quanto è lunga la strada da qui alla sufficienza.'],
  ),
  greetMorning: t(
    ['Buongiorno, allievo! Il programma di oggi: circa 15 minuti.', 'Buon mattino! Mens sana, scacchi sani. Cominciamo?', 'Buongiorno! La lezione è pronta.'],
    ['Buongiorno, allievo! Programma di oggi: 15 minuti, nessuna giustificazione.', 'Mattino! Spero tu abbia fatto colazione, il cervello ne ha bisogno.', 'Buongiorno. La lavagna è pulita. Il tuo cervello?'],
    ['Buongiorno. Hai l’aria di non aver dormito. Confermi?', 'Mattina. Giochiamo, se il cervello è sveglio.', 'Buongiorno. Il programma è pronto. Le scuse no.'],
  ),
  greetAfternoon: t(
    ['Buon pomeriggio! Una lezioncina?', 'Buon pomeriggio, allievo. Il programma di oggi è pronto.', 'Ottimo pomeriggio per un esercizio!'],
    ['Buon pomeriggio, allievo. Hai finito di procrastinare?', 'Pomeriggio! Pausa pranzo terminata. Al lavoro.', 'Buon pomeriggio. Il sole sta calando, i tuoi errori no.'],
    ['Pomeriggio. Se avessi studiato prima, saresti già laureato. Cominciamo.', 'Buon pomeriggio. Tempo da perdere? Perdilo con me.', 'Pomeriggio. Prima i pezzi, poi il divano.'],
  ),
  greetEvening: t(
    ['Buonasera, allievo! Una partitina serale?', 'Buonasera! Il programma di oggi, con calma.', 'Buonasera. La sera è propizia alla riflessione.'],
    ['Buonasera. Ancora in piedi? Vediamo cosa sai fare.', 'Buonasera! Giornata pesante? Sfogati con una partita.', 'Sera. Il gufo è un animale notturno. E tu?'],
    ['Buonasera. Giochi invece di dormire: mi piace.', 'Sera. Ultima partita? Penultima? Chi lo sa. Giochiamo.', 'Buonasera. Vedo stanchezza. Ottimo momento per gli svarioni.'],
  ),
  greetNight: t(
    ['Ma è tardi! Una partitina e poi a riposo?', 'Notte, allievo. Gioca con calma.', 'Buonanotte, o quasi: una partita e poi a letto.'],
    ['Che ora è? Notte fonda. Io sono notturno, e tu?', 'Nottambulo! Siamo della stessa specie.', 'Tempi supplementari. Giochiamo, poi dormi.'],
    ['È notte. Il tuo cervello a quest’ora è inutile. Il mio no.', 'Notte fonda. Ottimo momento per giocare male.', 'A quest’ora gli svarioni sono quasi garantiti.'],
  ),
  greetBack: t(
    ['Bentornato, caro! Sono passati {n} giorni, mi sei mancato.', 'Eccoti! {n} giorni di assenza. Si riparte con calma.', 'Benvenuto di nuovo. Il corso riprende.'],
    ['Ah, il ritorno dello studente! {n} giorni di assenza giustificata?', 'Bentornato. {n} giorni, eh? Ti ricordi come si muove il cavallo?', 'Eccoti! Il posto era caldo. Con le mie piume.'],
    ['{n} giorni di assenza ingiustificata. Il corso era più tranquillo. Ma riprendiamo.', 'Ah, sei vivo. {n} giorni. Scommetto che hai dimenticato tutto.', 'Bentornato. Gli scacchi non fuggono, tu sì: {n} giorni.'],
  ),
  greetStreak: t(
    ['{n} giorni di fila! Che rigore, che costanza!', 'Complimenti: {n} giorni consecutivi.', '{n} giorni uno dopo l’altro. Esemplare.'],
    ['{n} giorni di fila! Cominci a fare sul serio.', 'Serie di {n} giorni! Hai il mio rispetto, provvisorio.', '{n} giorni di seguito: promettente.'],
    ['{n} giorni di fila. Costante. Noioso. Bravo.', '{n} giorni consecutivi: o motivato o spaventato.', 'Serie di {n}. Non rovinarla oggi.'],
  ),
  thinking: t(
    ['Permettimi di riflettere…', 'Un attimo, consulto i miei appunti…', 'Vediamo con metodo…'],
    ['Silenzio, il professore riflette.', 'Consulto i miei appunti, ma ci metto meno di te.', 'Hmm. Ergo… ergo… un attimo.'],
    ['Permettimi di riflettere: ho un cervello grande, a differenza di altri.', 'Calcolo. Non disturbare il docente.', 'Un secondo: cerco le parole per non offenderti. Non le trovo.'],
  ),
  idleNap: t(
    ['Zzz… perdonami, ho socchiuso gli occhi.', 'Zzz… sogno una biblioteca infinita. Avvisami quando muovi.', 'Prenditi pure il tuo tempo, io riposo.'],
    ['Zzz… hai deciso? Io ho già letto un capitolo in sogno.', 'Mi sono assopito. Svegliami quando muovi.', 'Zzz… sogno una mossa che tu non hai ancora fatto.'],
    ['Zzz… il tuo silenzio è un sedativo.', 'Mi hai fatto addormentare. Come una prolusione.', 'Zzz… se pensi così a lungo, o è difficile o non pensi.'],
  ),
  notebookSaved: t(
    ['Annotati {errori} sul quaderno degli appunti: li riprendiamo presto.', 'Sul quaderno ho aggiunto {errori}. Un po’ alla volta.', 'Ho verbalizzato {errori} per il ripasso.'],
    ['Ho scritto {errori} sul registro. Tornano a trovarti, come le interrogazioni.', 'Sul quaderno: {errori}. Li rivedremo presto.', '{errori} annotati. Li ritroverai.'],
    ['Registro aggiornato: {errori}. Verranno a cercarti.', '{errori} segnati. Li rivedrai finché non li comprendi.', 'Annotati {errori}. Il professore non dimentica.'],
  ),
  firstWin: t(
    ['La tua PRIMA vittoria! Mi si appanna il monocolo. Magnifico!', 'Prima vittoria! Un giorno da ricordare.', 'Hai vinto la tua prima partita! Sono fiero.'],
    ['PRIMA VITTORIA! La annoto a lettere d’oro.', 'Hai battuto il tuo primo avversario! Il professore si commuove.', 'La prima non si scorda. Ora la seconda.'],
    ['Prima vittoria. Chi l’avrebbe detto. Io no.', 'Prima vittoria… posso crederci? Devo? No. Ma ci credo.', 'Hai vinto. Era ora. Disperavo.'],
  ),
  botBeaten: t(
    ['Hai battuto {bot}! Eccellente!', '{bot} è stato sconfitto! Bravo, un livello in più.', 'Complimenti, {bot} non è più un ostacolo.'],
    ['{bot} è a terra! Il professore applaude. Con una piuma.', 'Hai battuto {bot}! Ora tutta la facoltà lo sa.', '{bot} ha perso. Contro di te. Inaudito.'],
    ['{bot} sconfitto. Il prossimo ti ridurrà in briciole.', 'Hai battuto {bot}. Non esaltarti: il prossimo è più forte.', '{bot} è ko. Non lo credevo possibile.'],
  ),
}
