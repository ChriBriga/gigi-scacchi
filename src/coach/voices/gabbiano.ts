import type { Voice } from '../lines'
import { tones as t } from './helpers'

/**
 * Capitan Gabbiano: pirata, gergo marinaresco, scacchiera = mare in tempesta.
 * Gentile = capitano bonario, pepato = burlone, spietato = tiranno da tavola da camminare.
 * Gli eventi non elencati (promozione, scacco, ecc.) ripiegano sulle battute di Gigi.
 */
export const GABBIANO: Partial<Voice> = {
  brilliant: t(
    ['Mille balene! Una mossa da ammiraglio, mozzo!', 'Per tutti i mari! Questa bordata affonda ogni dubbio. Splendido!', 'Che manovra, ragazzo! Il tuo capitano si commuove.'],
    ['Per le mie piume salate! L’hai fatto apposta? Che colpo!', 'Sirene in delirio! Questa la racconto in ogni porto.', 'Perbacco, mozzo: hai trovato il tesoro senza mappa!'],
    ['Una mossa così, da te? Qualcuno ha rubato la mappa a un genio.', 'Sono sconvolto. Mi tocca applaudire con tutte e due le ali.', 'Geniale. Ora non montarti la testa o ti faccio camminare sulla tavola.'],
  ),
  best: t(
    ['Rotta perfetta, mozzo! Vento in poppa!', 'Esatto! Hai preso la corrente giusta.', 'Bella manovra: dritta come una bussola.'],
    ['La mossa migliore! Il mozzo cresce, il capitano gongola.', 'Pulita come il ponte il lunedì. Mi piace!', 'Giusta! Ci sai fare col timone.'],
    ['La migliore. Pure una boa ogni tanto indovina la direzione.', 'Giusta. Non pretendere una medaglia, eh.', 'Ok, rotta corretta. Non è un miracolo, è routine.'],
  ),
  good: t(
    ['Buona mossa, si naviga tranquilli.', 'Solida come il fasciame di una buona nave.', 'Tutto a posto, mozzo: avanti così.'],
    ['Non male. Acqua calma, per ora.', 'Passabile. La nave non affonda, è già qualcosa.', 'Va bene: ancora un po’ di sale e diventa buona.'],
    ['Accettabile. Come il biscotto di bordo: duro e senza gusto.', 'Una mossa. Ha galleggiato. Non è un trionfo.', 'Meh. Il mare era calmo e ti è andata bene.'],
  ),
  inaccuracy: t(
    ['C’era una rotta migliore, ma niente tempesta.', 'Piccola deviazione, mozzo: si recupera col timone.', 'Quasi! Un filo fuori rotta.'],
    ['Hm! Un po’ fuori rotta. Il capitano ti guarda storto.', 'Imprecisione! Hai preso la scorciatoia dello scoglio.', 'Così così. Ti serve una bussola nuova.'],
    ['Fuori rotta. La bussola era in pausa pranzo?', 'Navighi a occhio come un pesce rosso ubriaco.', 'Potevi fare meglio. Anche un pesce lesso poteva.'],
  ),
  mistake: t(
    ['Ahi, uno scoglio! Meglio virare in fretta.', 'Errore, mozzo: la nave fa acqua. Ripariamo?', 'Attento! Questa mossa ci porta dritti sulle rocce.'],
    ['Errore! La stiva si allaga, mozzo!', 'Mille balene, hai regalato la rotta ai nemici.', 'Tempesta in arrivo, e l’hai chiamata tu.'],
    ['ERRORE! Hai pilotato la nave contro lo scoglio. Complimenti.', 'Hai aperto il portellone ai nemici. Sei un genio del naufragio.', 'Questa mossa è un buco nello scafo. Anzi, due.'],
  ),
  blunder: t(
    ['Tutti alle pompe! Questa è grossa, mozzo. Ritira, dai!', 'Oh no, la nave va a picco! Torna indietro!', 'Capita ai migliori marinai. Ma questa… ritirala!'],
    ['SVARIONE! La nave è affondata e tu fischiettavi!', 'Mille fulmini! Hai bucato lo scafo, e sull’acqua non si cammina!', 'Hai regalato il forziere al nemico. Col fiocco!'],
    ['Hai affondato la tua stessa nave. Con la ciurma dentro. Bravissimo.', 'Un naufragio così non si vede dai tempi di Atlantide.', 'Questa mossa è un crimine contro tutti i sette mari.'],
  ),
  hanging: t(
    ['Occhio, mozzo: {pezzo} in {sq} è scoperto alla bordata!', '{Pezzo} in {sq} ha bisogno di protezione: arrivano i pirati.', 'Guarda {sq}: {pezzo} è esposto al cannone nemico.'],
    ['{Pezzo} in {sq} è in balìa dei predoni! Svegliaaa!', 'Ehi! {Pezzo} in {sq} è appeso come un pesce all’amo.', '{Pezzo} in {sq} sta salutando i nemici. Con entusiasmo.'],
    ['{Pezzo} in {sq}? Un forziere aperto in mezzo al porto.', 'Hai lasciato {pezzo} in {sq} come un’ancora senza catena.', '{Pezzo} in {sq} è già nella stiva del nemico.'],
  ),
  missedFree: t(
    ['C’era un tesoro da prendere, mozzo! Guarda meglio.', 'Un pezzo ti aspettava, tutto solo: oro a portata di mano!', 'Forse ti è sfuggito: bottino gratis!'],
    ['Un forziere aperto e l’hai ignorato? Che cortesia, ammiraglio.', 'Il tesoro era lì col fiocco. E tu: “magari domani”.', 'Pezzo gratis lasciato lì. Il nemico ti ringrazia.'],
    ['Un bottino gratuito e lo lasci lì? Che pirata sei?', 'Hai rifiutato un forziere. Sei il peggior pirata dei sette mari.', 'Neanche un gabbiano con le patatine ha mai fatto un errore così.'],
  ),
  win: t(
    ['Vittoria, mozzo! Issate la bandiera!', 'Scacco matto! Che bella battaglia: sono fierissimo.', 'Ce l’hai fatta! Rum per tutti. (Per me. Il tuo è succo.)'],
    ['SCACCO MATTO! Il mozzo diventa pirata!', 'Vinto! Tutti a bordo per i festeggiamenti.', 'Hai conquistato la nave nemica! Ti concedo un applauso: clap clap.'],
    ['Hai vinto. Il bot ha fatto degli errori, ma una vittoria è una vittoria.', 'Matto. Non me l’aspettavo. Ho perso una scommessa col pappagallo.', 'Vittoria. Prendila e non vantarti: il mare è lungo.'],
  ),
  lose: t(
    ['Sconfitta, mozzo. Ma ogni naufragio insegna una rotta.', 'Persa! Si riparte: la nave si ripara.', 'Non buttarti giù: anche gli ammiragli perdono battaglie.'],
    ['Hai perso. La nave è a picco, ma il capitano crede in te.', 'Ko! Alla prossima, e portiamo dei remi in più.', 'Persa. Almeno non c’erano squali. Credo.'],
    ['Naufragio completo. Sei affondato con eleganza zero.', 'Persa. Ti darei la tavola, ma sei già a mollo.', 'Sconfitta. Hai mosso i pezzi come un granchio ubriaco.'],
  ),
  draw: t(
    ['Patta, mozzo: mare calmo, nessun vincitore.', 'Pareggio: due navi che si salutano.', 'Pari! Ci si vede alla prossima battaglia.'],
    ['Patta. Né tesoro né naufragio. Che noia, mozzo.', 'Pareggio: il compromesso dei mari.', 'Pari. Il vento è cessato per tutti.'],
    ['Patta. Il bel niente, in alto mare.', 'Pari: due flotte che non hanno saputo affondare nemmeno una barchetta.', 'Pareggio. Applauso di cortesia dal ponte.'],
  ),
  start: t(
    ['Si salpa, mozzo! Vento in poppa e occhi aperti.', 'Issate le vele! Io sono qui sul ponte.', 'Pronti! Rotta sul centro, e niente scogli.'],
    ['All’arrembaggio! E guarda dove metti le zampe.', 'Si parte! Non fare naufragio prima di pranzo.', 'Si salpa. Tieni d’occhio i pezzi, mozzo.'],
    ['Si parte. Ti do dodici mosse prima del primo naufragio.', 'All’arrembaggio! Io tifo per i pesci, sappilo.', 'Salpiamo. Spoiler: ti serve una scialuppa.'],
  ),
  puzzleOk: t(
    ['Giusto, mozzo! Bel colpo di timone.', 'Esatto! Hai trovato il tesoro.', 'Perfetto! Questa mossa vale un forziere.'],
    ['Bordata a segno! Visto che ci sai fare?', 'Preso! Il capitano gongola.', 'Giusto! Mi vien voglia di cantare una ballata.'],
    ['Giusto. Per questa volta il mare ti è favorevole.', 'Ok, questa l’hai vista. Non montarti la testa.', 'Esatto. Ti darei un biscotto. Ma è mio.'],
  ),
  puzzleFail: t(
    ['Non è questa, mozzo. Guarda ancora la mappa!', 'Quasi! Cerca un bersaglio da colpire.', 'Niente paura, riprova: la rotta c’è.'],
    ['Nope! Bordata a vuoto, riprova.', 'Hm, scoglio! Rifletti e riprova.', 'No, non quella. Fuori rotta di brutto.'],
    ['No. Hai tirato a indovinare come una medusa.', 'Sbagliato. Un pesce palla avrebbe fatto meglio.', 'No. Se continui facciamo notte, e io ho fame.'],
  ),
  lessonDone: t(
    ['Lezione finita! Un altro nodo imparato.', 'Fatto, mozzo! Ora in mare aperto.', 'Ottimo lavoro: ora hai una bussola in più.'],
    ['Lezione chiusa. Metti in pratica o ti faccio lucidare il ponte.', 'Fatto! Sei un po’ meno mozzo di prima.', 'Finita! Ora vediamo se hai preso appunti o solo sale.'],
    ['Finita. Dimentica tutto e ti faccio lavare la stiva.', 'Fatto. Domani me la ripeti, o la tavola.', 'Lezione completata. Il cervello ringrazia, la ciurma pure.'],
  ),
  nonsense: t(
    ['Mmh? Avanti e indietro… è una manovra o un dubbio?', 'Dove stiamo andando, mozzo? Non vedo la rotta.', '??? Il capitano non segue.'],
    ['Avanti e indietro come le onde: ma il piano?', 'Cosa sta succedendo? Anche il pappagallo ha perso il filo.', 'Questa mossa non ha rotta, né vento.'],
    ['Questa mossa non ha senso. Nemmeno nel Triangolo delle Bermuda.', 'Fai su e giù come un’ancora. Ti sei perso?', '??? Persino gli squali sono confusi.'],
  ),
  castle: t(
    ['Arrocco! Re al riparo nel porto, bravo!', 'Bella mossa: il re entra in rada, la torre in gioco.', 'Re al sicuro: il porto è la sua casa.'],
    ['Arrocco! Re nel porto, torre in battaglia. Finalmente un po’ di buon senso.', 'Il re molla gli ormeggi in sicurezza. Mi piace!', 'Arrocco! Pure il re vuole il caminetto.'],
    ['Arrocco. Era ora, il re era in mare aperto come un’esca.', 'Ah, hai arroccato. E io scommettevo su mai.', 'Re al sicuro. Un miracolo.'],
  ),
  queenTake: t(
    ['La regina! Che bordata gloriosa!', 'Hai preso la regina! Che emozione, mozzo!', 'Regina catturata! Il nemico è nei guai.'],
    ['La REGINA! Mille balene, hai affondato la nave ammiraglia!', 'Regina presa! Il nemico piange nella stiva.', 'Gran colpo! Ora è senza regina e senza dignità.'],
    ['Hai preso la regina. Sorpresa: sai giocare. Più o meno.', 'La regina. Presa. Ora cerca di non perdere la tua per distrazione.', 'Ok, questa te la applaudo. Con un’ala sola.'],
  ),
  retract: t(
    ['Mossa ritirata! Ora guarda bene la rotta.', 'Si vira! Con calma, mozzo.', 'Ripensare è da marinai saggi. Che si fa ora?'],
    ['Ritirata! Ora vediamo se stavolta guardi la mappa.', 'Indietro tutta! Con il cervello acceso, magari.', 'Rewind di bordo. Non sprecarlo.'],
    ['Ritirata. Un altro giro di pompa per la tua nave.', 'Indietro. Provaci di nuovo, e usa la bussola stavolta.', 'Mossa annullata. Il bot sbadiglia, io pure.'],
  ),
  quizAsk: t(
    ['Prima di virare: dov’è lo scoglio? Tocca il pezzo coinvolto!', 'Dimmi, mozzo: da dove arriva la minaccia? Tocca la scacchiera.', 'Un indovinello di bordo: dov’è il guaio?'],
    ['Dov’è il guaio, marinaio? Tocca il pezzo giusto.', 'Prima di ritirare, trova lo scoglio. Tocca il pezzo.', 'Indovina da dove arriva la bordata. Su, tocca!'],
    ['Vuoi ritirare? Prima mostra di sapere dove hai sbagliato. Tocca il guaio.', 'Dov’è lo scoglio che hai preso in pieno? Tocca.', 'Il ritiro costa: trova il pezzo del guaio.'],
  ),
  quizOk: t(
    ['Esatto! Hai visto lo scoglio. Ora vira pure.', 'Bravo, mozzo! Vedere il pericolo è già metà della rotta.', 'Giusto! Vedi che ci arrivi?'],
    ['Giusto! Occhio da gabbiano. Ora usalo PRIMA di muovere.', 'Preso! Ora ritira e prometti di guardare meglio.', 'Esatto: il pericolo era lì.'],
    ['Giusto. Potevi vederlo prima, ma va bene. Ritira.', 'Esatto. Una vittoria piccola. Ora ritira e comportati bene.', 'Bene. Hai trovato lo scoglio che hai colpito tu.'],
  ),
  quizMiss: t(
    ['Non è lì. Guarda chi può muovere, mozzo.', 'Quasi! Pensa a quale pezzo ti attacca.', 'Non proprio. Rifletti sulle bordate nemiche.'],
    ['Nope! Bordata a vuoto. Riprova.', 'Fuori bersaglio. Chi minaccia cosa?', 'Non è quello. Altro tentativo.'],
    ['No. Neanche vicino. Guarda cosa può prendere il nemico.', 'Sbagliato. Il nemico ride. Riprova.', 'No. Se fosse un esame saresti rimandato. Un’altra possibilità.'],
  ),
  cleanGame: t(
    ['Partita pulita! Nemmeno una virata all’indietro. Orgoglio di capitano!', 'Zero ritiri! Hai navigato da solo. Che bello!'],
    ['Partita pulita! Zero ritiri: sei un vero lupo di mare.', 'Nemmeno un ritiro! Ti nomino ufficiale di bordo.'],
    ['Zero ritiri. Hai navigato senza zattera. Mi hai stupito.', 'Partita pulita. Non sembri nemmeno tu. Continua così.'],
  ),
  poke: t(
    ['Ehi, mozzo! Mi hai fatto il solletico alle piume!', 'Ahoy! Ti serve qualcosa?', 'Sono qui sul ponte! Che c’è?'],
    ['Giù le zampe dal capitano!', 'Ehi! Questo cappello vale più della tua nave.', 'Mille balene, che c’è? Non vedi che scruto l’orizzonte?'],
    ['Toccami ancora e ti faccio camminare sulla tavola.', 'Se cerchi tesori, non sono io. Se cerchi guai, sì.', 'Cosa vuoi? Un bacio? Un rum? Un naufragio?'],
  ),
  pokeMany: t(
    ['Ehi, basta con il solletico! Ora mi arrabbio un po’.', 'Ok, ora basta, mozzo. Torniamo agli scacchi?', 'Calma! Ho una dignità da capitano.'],
    ['BASTA! Sto per perdere il cappello!', 'Smettila o ti sfido ai dadi… e perdi.', 'Un altro tocco e ti lascio sull’isola deserta.'],
    ['MI HAI STANCATO. Alla tavola! Subito!', 'Sono un capitano, non una campana. Smettila.', 'Un altro tocco e ti mollo ai pesci.'],
  ),
  greetNew: t(
    ['Ahoy! Sono Capitan Gabbiano, il tuo nuovo capitano. Facciamo un piccolo test per scoprire la tua rotta?', 'Benvenuto a bordo, mozzo! Cinque puzzle e capiamo da che porto si parte.', 'Piacere, Capitan Gabbiano! Un test veloce e salpiamo insieme.'],
    ['Ahoy, pivello! Sono Capitan Gabbiano. Test iniziale: vediamo se sei un lupo di mare o un pesce lesso.', 'Benvenuto a bordo! Due minuti di test e decido se ti prendo come mozzo.', 'Mille balene, un nuovo mozzo! Facciamo il test così misuro il disastro.'],
    ['Un nuovo mozzo. Facciamo il test così misuro quanto affonderai.', 'Sono Capitan Gabbiano. Il test dura due minuti. Il mio giudizio, tutta la traversata.', 'Benvenuto a bordo. Se non sai nuotare, comincia a imparare.'],
  ),
  greetMorning: t(
    ['Buongiorno, mozzo! Ecco la rotta di oggi, circa 15 minuti.', 'Buon mattino! Il mare è calmo, il piano è pronto. Si salpa?', 'Buongiorno! Una partitina per inaugurare la giornata?'],
    ['Buongiorno, mozzo! Rotta di oggi: 15 minuti, niente scuse.', 'Sveglia sul ponte! Il caffè è finito, gli scacchi no.', 'Buongiorno! Il sole è alto, i cannoni pronti. E tu?'],
    ['Buongiorno. Se sei sveglio presto vuol dire che hai qualcosa da farti perdonare. Giochiamo.', 'Mattina! Hai gli occhi da molluschi. Sveglia!', 'Buongiorno. Rotta pronta. Scuse non pervenute.'],
  ),
  greetAfternoon: t(
    ['Buon pomeriggio, mozzo! Un’oretta di mare e scacchi?', 'Buon pomeriggio! Il piano di oggi ti aspetta.', 'Ahoy! Il pomeriggio è perfetto per un puzzle.'],
    ['Buon pomeriggio, mozzo! Hai finito di fare il turista? Si lavora.', 'Pomeriggio! Pausa pranzo finita? All’arrembaggio.', 'Ahoy! Il sole picchia e il piano pure.'],
    ['Pomeriggio. Se studiavi prima ora eri un ammiraglio. Cominciamo.', 'Buon pomeriggio. Hai tempo da perdere? Perdilo con me.', 'Pomeriggio. Prima i pezzi, poi la branda.'],
  ),
  greetEvening: t(
    ['Buonasera, mozzo! Una partita al tramonto?', 'Buonasera! Il piano di oggi, con calma.', 'Ahoy! La sera è perfetta per navigare piano.'],
    ['Buonasera, mozzo! Giornata dura? Sfogati con una partita.', 'Sera! Il capitano è stanco ma ti aspetta.', 'Tramonto, rum, scacchi: i miei tre vizi.'],
    ['Buonasera. Stai giocando invece di dormire. Sei dei miei.', 'Sera. Ultima partita? Penultima? Il naufragio? Giochiamo.', 'Buonasera. Oggi non sei riuscito a farlo prima. Fa niente.'],
  ),
  greetNight: t(
    ['Ehi, è tardi! Una partitina e poi in branda?', 'Notte, mozzo! Gioca con calma, io ho gli occhi pesanti.', 'Ahoy! Non è un po’ tardi? Ma va bene.'],
    ['Che ora è? Notte fonda! Una partita e poi a dormire.', 'Nottambulo! Siamo della stessa ciurma.', 'Tempi supplementari, mozzo. Giochiamo, ma poi dormi.'],
    ['È notte. Il tuo cervello a quest’ora fa acqua. Il mio no.', 'Notte fonda. Ottimo momento per un naufragio. Cominciamo!', 'A quest’ora gli svarioni sono garantiti. Fammi vedere.'],
  ),
  greetBack: t(
    ['Bentornato a bordo! Sono passati {n} giorni, mi sei mancato.', 'Eccoti, mozzo! {n} giorni di assenza: ripartiamo piano?', 'Ahoy! Non importa quanto sei stato via, si riparte.'],
    ['Ah, il ritorno del mozzo! {n} giorni di assenza. Ti davo per disperso.', 'Bentornato. {n} giorni, eh? Ti sei dimenticato come si muove il cavallo?', 'Eccoti! Ho tenuto la tua branda calda con le mie piume.'],
    ['{n} giorni senza di te. Il ponte era più tranquillo. Ma ora si riparte.', 'Ah, sei vivo. {n} giorni. Scommetto che hai dimenticato tutto.', 'Bentornato. Gli scacchi non scappano, tu sì: {n} giorni di diserzione.'],
  ),
  greetStreak: t(
    ['{n} giorni di fila! Sono fiero di te, mozzo.', 'Che costanza: {n} giorni di navigazione di fila!', '{n} giorni uno dopo l’altro. Rotta perfetta!'],
    ['{n} giorni di fila! Cominci a fare sul serio, eh?', 'Serie di {n} giorni! Meriti un biscotto di bordo.', '{n} giorni di seguito: il capitano approva.'],
    ['{n} giorni di fila. Costante. Che noia. Che bravo.', '{n} giorni consecutivi: o sei motivato o hai paura del capitano.', 'Serie di {n}. Non rovinarla oggi.'],
  ),
  thinking: t(
    ['Fammi scrutare l’orizzonte…', 'Un attimo, consulto la bussola…', 'Vediamo un po’…'],
    ['Consulto la mappa… ma ci metto meno di te.', 'Silenzio, il capitano riflette.', 'Hmm, ho un’idea… forse.'],
    ['Fammi pensare: ho un cervello piccolo ma da gabbiano.', 'Calcolo la rotta, non disturbare.', 'Un secondo, cerco le parole per non offenderti. Spoiler: non le trovo.'],
  ),
  idleNap: t(
    ['Zzz… Scusa, mozzo, mi sono appisolato sul ponte.', 'Zzz… Sogno un oceano di patatine. Dimmi quando muovi.', 'Ti aspetto, nessuna fretta. Dormo un po’.'],
    ['Zzz… hai deciso? Io ho già navigato due sogni.', 'Mi sono addormentato. Svegliami quando muovi.', 'Zzz… sogno una mossa che tu non hai ancora fatto.'],
    ['Zzz… Questo silenzio è un naufragio di pensieri.', 'Mi hai fatto addormentare. Come una lezione di nodi.', 'Zzz… Se pensi così tanto o è difficile o non pensi.'],
  ),
  notebookSaved: t(
    ['Ho segnato {errori} sul giornale di bordo: li rivediamo con calma.', 'Sul giornale di bordo ho aggiunto {errori}. Un nodo alla volta!', 'Nel quaderno di bordo: {errori}.'],
    ['Ho scritto {errori} sul giornale di bordo. Torneranno, come le maree.', 'Sul giornale di bordo: {errori}. Li rivediamo presto.', '{errori} segnati. Li ritroverai al prossimo porto.'],
    ['Giornale di bordo aggiornato con {errori}. Verranno a cercarti.', '{errori} sul giornale. Li rivedrai finché non li azzecchi.', 'Segnati {errori}. Il mare non dimentica.'],
  ),
  firstWin: t(
    ['La tua PRIMA vittoria! Mi si è stretta la gola. Rum per tutti!', 'Prima vittoria, mozzo! Ricorda questo giorno!', 'Hai vinto la tua prima battaglia! Issate le bandiere!'],
    ['PRIMA VITTORIA! La scrivo sulla vela!', 'Hai battuto il tuo primo avversario! Il capitano piange. Di gioia.', 'La prima non si scorda mai. Ora la seconda.'],
    ['Prima vittoria. Chi l’avrebbe detto? Io no.', 'Prima vittoria. Posso crederci? Sì. Devo? No.', 'Hai vinto. Era ora. Mi ero rassegnato a una ciurma di perdenti.'],
  ),
  botBeaten: t(
    ['Hai battuto {bot}! Che bordata gloriosa!', '{bot} è affondato! Bravo, un livello in più.', 'Evviva, {bot} non è più un problema!'],
    ['{bot} è a picco! Sei il mio eroe, anzi quasi.', 'Hai battuto {bot}! Ora tutti i mari sanno chi sei.', '{bot} ha perso contro di te. Vai a vantartene al porto.'],
    ['{bot} affondato. Ora il prossimo ti ridurrà in zattera.', 'Hai battuto {bot}. Non montarti la testa: il prossimo è più forte.', '{bot} è ko. Non pensavo ce la facessi.'],
  ),
}
