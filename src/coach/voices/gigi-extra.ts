import type { Voice } from '../lines'
import type { CoreEvent } from './gigi-core'
import type { QualityEvent } from './gigi-quality'

/**
 * Gigi il piccione, battute dei momenti particolari: mosse senza senso, catture, arrocco,
 * ritiri, pisolini, prime volte, punzecchiature nella Home e saluti che dipendono da ora e memoria.
 * Segnaposto: {bot} = avversario, {n} = numero (giorni di serie o di assenza, ritiri).
 */
export const GIGI_EXTRA: Omit<Voice, CoreEvent | QualityEvent> = {
  nonsense: {
    gentle: [
      'Mmh? Hai spostato il pezzo avanti e indietro: sicuro del piano?',
      'Aspetta, che cosa stiamo facendo qui? Non ho capito, ma sono curioso.',
      '??? Forse qui conviene avere un’idea, anche piccola.',
      'Uhm. Questa mossa non mi dice molto. Cosa volevi fare?',
      'Ehm... avanti e indietro? Va bene riposare, ma a metà partita?',
      'Non vedo il piano, ma magari c’è. Me lo spieghi?',
    ],
    spicy: [
      'Ehm. ??? Questa mossa ha un senso? Chiedo per un amico.',
      'Avanti e indietro, avanti e indietro. Stai facendo il ballo del piccione?',
      'Cosa sta succedendo? Non ho capito il piano, e io capisco i piani.',
      'Mossa misteriosa. Anche per te, immagino.',
      'Ho letto la mossa tre volte. Ancora non ha senso.',
      'Hmm? Il pezzo ha fatto un giro ed è tornato a casa. Gita scolastica?',
    ],
    ruthless: [
      'Questa mossa non ha senso. Né ora, né mai, né in nessuna dimensione.',
      'Avanti e indietro. Brillante. Ora mi gira la testa.',
      '??? Neanche Osvaldo il gatto farebbe una cosa così. E lui ne fa di strane.',
      'Se lo scopo era perdere tempo, ottimo. Se era giocare a scacchi, no.',
      'Che cos’è, una mossa o un tic nervoso?',
      'Il pezzo ti ringrazia per la passeggiata. Il bot pure.',
    ],
  },
  queenTake: {
    gentle: [
      'La regina! Che colpo bellissimo!',
      'Hai preso la regina! Che emozione!',
      'Regina catturata! Il bot è un po’ nervoso adesso.',
      'Evviva! Un pezzo grosso in meno per lui!',
      'Che cattura! Sono fiero.',
    ],
    spicy: [
      'Hai preso la regina! Sei il mio eroe. Anzi no, ma quasi.',
      'La REGINA! Ho quasi lasciato cadere la corona.',
      'Regina catturata. Qualcuno sta piangendo nel suo garage.',
      'Preso il pezzo più grosso: bella mossa, ora non perderlo.',
      'Gran colpo! Ora l’avversario è senza regina e senza dignità.',
    ],
    ruthless: [
      'Hai preso la regina. Sorpresa: sai giocare. Più o meno.',
      'La regina. Presa. Non ti emozionare, ora tocca a me fare il tifo.',
      'Regina catturata! Ora vediamo se riesci a non perdere la tua per distrazione.',
      'Ok, questa te la applaudo. Con una sola ala.',
      'Che colpo. Ora il bot sembra un re che ha perso la corona.',
    ],
  },
  castle: {
    gentle: [
      'Arrocco! Re al sicuro, torre in gioco. Bravo!',
      'Bella mossa: il re si nasconde e la torre entra in partita.',
      'Arrocco! Il re ti ringrazia.',
      'Ottimo, ora il re può dormire tranquillo.',
      'Re al sicuro! Brava mossa prudente.',
    ],
    spicy: [
      'Arrocco. Finalmente un po’ di buon senso.',
      'Il re scappa nell’angolo, ma con classe. Mi piace.',
      'Arrocco! Re sul divano, torre al lavoro. Come in famiglia.',
      'Re al sicuro. Ora puoi concentrarti sul resto. Tipo non perdere pezzi.',
      'Arrocco. Così sì: il re non fa più il turista in mezzo alla scacchiera.',
    ],
    ruthless: [
      'Arrocco. Era ora. Il re era ormai un bersaglio ambulante.',
      'Ah, hai arroccato. E io che stavo scommettendo su mai.',
      'Re al sicuro. Un miracolo. Quasi commovente.',
      'Arrocco. Anche un cavallo ci sarebbe arrivato prima.',
      'Il re nell’angolo, finalmente. Come me quando passa il gatto.',
    ],
  },
  promote: {
    gentle: [
      'Promozione! Il pedone è diventato grande!',
      'Una nuova regina! Che bella storia.',
      'Dal pedone alla regina: il sogno di ogni pedone.',
      'Evviva, il pedone ce l’ha fatta!',
      'Promozione! Il piccolo cresce.',
    ],
    spicy: [
      'Da pedone a diva. Che carriera!',
      'Pedone promosso! Sembra mio cugino quando ha trovato un panino intero.',
      'Nuova regina! Ora si gioca davvero.',
      'Promozione! Brindiamo con una briciola.',
      'Il pedone ce l’ha fatta. Ora tutti gli altri pedoni sono gelosi.',
    ],
    ruthless: [
      'Promozione. Ora hai un pezzo più forte. Non montarti la testa.',
      'Un pedone è diventato regina. Il suo curriculum è migliore del tuo.',
      'Promossa! Almeno uno di noi sta facendo carriera.',
      'Nuova regina. Cerca di non perderla subito, per favore.',
      'Ah, la promozione. Il pedone ha lavorato più di te. Bravo lui.',
    ],
  },
  check: {
    gentle: [
      'Scacco! Il re deve muoversi.',
      'Scacco al re! Attento a non esagerare.',
      'Scacco! Che bella minaccia.',
      'Dai scacco con gentilezza, mi raccomando.',
    ],
    spicy: [
      'Scacco! Ora sì che sta sudando.',
      'Scacco al re! Il bot è già in modalità panico.',
      'Scacco. Mi piace quando sei cattivo.',
      'Scacco! Fai tremare le fondamenta.',
    ],
    ruthless: [
      'Scacco. Un po’ di movimento, finalmente.',
      'Scacco! Il bot trema. O forse sono io che ho freddo.',
      'Scacco, e il re corre. Come me quando passa il gatto.',
      'Scacco! Ora vediamo se hai un piano o solo un tic.',
    ],
  },
  retract: {
    gentle: [
      'Mossa ritirata! Ora guarda bene cosa ti attacca.',
      'Ottimo, riprendiamo da qui. Respira e riguarda.',
      'Ritirare è da persone sagge. Ora, che si fa?',
      'Bravo, hai deciso di ripensarci. Ora con calma.',
      'Si riparte! Che pezzo vuoi muovere stavolta?',
      'Tranquillo, siamo qui. Cerca la mossa migliore.',
    ],
    spicy: [
      'Ritirata! Ora vediamo se stavolta ci pensi.',
      'Ok, mossa ritirata. Guarda meglio la scacchiera, stavolta.',
      'Bene, un’altra occasione. Non sprecarla.',
      'Rewind! Ora con il cervello acceso, magari.',
      'Indietro tutta. Che mossa fai ora? Pensa, pensa.',
      'Ritirata strategica, come dicono i generali.',
    ],
    ruthless: [
      'Ritirata. Un’altra vita per il tuo re. Non sprecarla.',
      'Ritiro la mossa e il mio rispetto, ma solo temporaneamente.',
      'Ritirata. La prossima volta guarda PRIMA di muovere. È un’idea rivoluzionaria.',
      'Mossa annullata. Il bot sbadiglia, io pure.',
      'Indietro. Riprova. Spero che il cervello sia tornato dalle ferie.',
      'Ritirata. Come l’esercito di Napoleone, ma con meno gloria.',
    ],
  },
  idleNap: {
    gentle: [
      'Zzz… Scusa, mi sono appisolato. Prenditi pure il tuo tempo!',
      'Zzz… Sogno una briciola gigante. Quando hai deciso, dimmelo.',
      'Ti aspetto, nessuna fretta. Io faccio un pisolino.',
    ],
    spicy: [
      'Zzz… Hai deciso? Io ho già fatto due sogni.',
      'Mi sono addormentato. Svegliami quando muovi.',
      'Zzz… Sto sognando una mossa che tu non hai ancora fatto.',
    ],
    ruthless: [
      'Zzz… Questo silenzio è il rumore del tuo pensiero. O della tua distrazione.',
      'Mi hai fatto addormentare. Come una lezione di storia.',
      'Zzz… Se pensi così tanto, forse la mossa è difficile. O forse no.',
    ],
  },
  thinking: {
    gentle: ['Fammi pensare…', 'Vediamo un po’…', 'Un attimo, guardo meglio…', 'Hmm, fammi controllare con calma…'],
    spicy: ['Fammi pensare… ma ci metto meno di te.', 'Un attimo, sto guardando…', 'Calcolo, calcolo. Non disturbare il piccione.', 'Hmm hmm hmm. Sto riflettendo, silenzio.'],
    ruthless: [
      'Fammi pensare… ho un cervello piccolo ma efficiente.',
      'Un secondo, sto cercando le parole giuste per non offenderti.',
      'Controllo. Metti le mani avanti, anzi, le ali.',
      'Sto calcolando. Non è bello da vedere.',
    ],
  },
  firstWin: {
    gentle: [
      'La tua PRIMA vittoria! Mi si è stretta la gola. Che bello!',
      'Prima vittoria! Ricordati di questo giorno: è l’inizio di tutto!',
      'Hai vinto la tua prima partita! Sono così fiero che mi tremano le zampe.',
    ],
    spicy: [
      'PRIMA VITTORIA! La scrivo sul muro del parco, con le briciole.',
      'Hai battuto il tuo primo bot! Il piccione piange. Di gioia, eh.',
      'La prima non si scorda mai. Ora vediamo la seconda.',
    ],
    ruthless: [
      'Prima vittoria. Chi l’avrebbe mai detto. Io no, ma ecco.',
      'Prima vittoria... posso crederci? Sì. Devo? No. Ma ci credo.',
      'Hai vinto. Era ora. Mi ero ormai rassegnato a una carriera da perdente.',
    ],
  },
  botBeaten: {
    gentle: [
      'Hai battuto {bot}! Che soddisfazione!',
      '{bot} è stato sconfitto! Bravo, un livello in più.',
      'Evviva, {bot} non è più un problema!',
    ],
    spicy: [
      '{bot} è a terra! Sei il mio eroe. Un po’ meno pivello ora.',
      'Hai battuto {bot}! Ora tutti i pezzi sanno chi sei.',
      '{bot} ha perso contro di te. Vai a vantarti con il gatto Osvaldo.',
    ],
    ruthless: [
      '{bot} sconfitto. Ora il prossimo ti ridurrà in briciole, ma intanto bravo.',
      'Hai battuto {bot}. Non montarti la testa: il prossimo è più forte.',
      '{bot} è ko. Non pensavo ce l’avresti fatta. Ma ecco.',
    ],
  },
  quizAsk: {
    gentle: [
      'Prima di ritirare: dov’è il guaio? Tocca il pezzo che c’entra!',
      'Fermiamoci un attimo: dove sta il problema? Tocca la scacchiera.',
      'Sai dire dov’è il pericolo? Tocca il pezzo coinvolto.',
      'Un indovinello veloce: da dove arriva la minaccia?',
    ],
    spicy: [
      'Prima di ritirare: dov’è il guaio? Indovina, e che sia una cosa seria.',
      'Dove hai combinato il disastro? Tocca il pezzo giusto.',
      'Gioco a “trova il guaio”. Tocca il pezzo e dimostra di aver capito.',
      'Se sai dov’è il problema, tocca il pezzo. Se non lo sai, tocca lo stesso.',
    ],
    ruthless: [
      'Vuoi ritirare? Prima dimostra di sapere cosa hai combinato. Tocca il guaio.',
      'Dov’è l’errore? Tocca il pezzo. Non sceglierlo a caso come al solito.',
      'Il ritiro costa: prima trova il guaio. Tocca il pezzo giusto.',
      'Indica il problema. Se lo trovi ti lascio ritirare. Se no, ti guardo.',
    ],
  },
  quizOk: {
    gentle: [
      'Esatto! Hai visto il guaio. Ora puoi ritirare con la coscienza a posto.',
      'Bravo! Quello è proprio il punto. Vedere il pericolo è già metà del lavoro.',
      'Giusto! Vedi che ci arrivi? Ora ritira e riprova.',
    ],
    spicy: [
      'Giusto! L’occhio funziona. Ora usalo PRIMA di muovere.',
      'Esatto. Vedi? Sapevi già dov’era il problema. Il guaio è non guardare prima.',
      'Preso! Ora ritira e prometti di guardare meglio.',
    ],
    ruthless: [
      'Giusto. Il che significa che potevi accorgertene prima. Ritira.',
      'Esatto. Una vittoria piccola, ma tua. Ora ritira e comportati bene.',
      'Bene. Hai trovato l’errore che hai fatto tu. Un classico.',
    ],
  },
  quizMiss: {
    gentle: [
      'Non è lì. Riguarda con calma: cosa può prendere l’avversario?',
      'Quasi! Pensa a quale pezzo può muovere l’avversario adesso.',
      'Non proprio. Guarda chi attacca chi.',
    ],
    spicy: [
      'Nope. Guarda meglio cosa può fare l’avversario.',
      'Non è quello! Riprova, ti concedo un altro tentativo.',
      'Fuori bersaglio. Pensa: chi minaccia cosa?',
    ],
    ruthless: [
      'No. Neanche vicino. Guarda cosa può prendere l’avversario.',
      'Sbagliato. L’avversario ride. Riprova.',
      'No. Se fosse un esame saresti rimandato. Un’altra possibilità.',
    ],
  },
  quizReveal: {
    gentle: [
      'Te lo mostro io: ecco il guaio. La prossima volta lo vedi da solo!',
      'Ecco dov’era il problema. Succede, ora lo sai.',
    ],
    spicy: [
      'Era qui, il guaio. L’ho segnato per te: la prossima volta cerca meglio.',
      'Eccolo. Te lo regalo, ma la prossima volta lo trovi tu.',
    ],
    ruthless: [
      'Eccolo, il guaio. Era lì tutto il tempo. Ora ritira e vergognati un pochino.',
      'Te lo dico io, visto che non ci arrivi: il guaio è qui.',
    ],
  },
  cleanGame: {
    gentle: [
      'Partita pulita! Nemmeno una mossa ritirata. Sono fierissimo di te!',
      'Zero ritiri! Hai giocato tutto da solo. Questa vale un premio.',
    ],
    spicy: [
      'Partita pulita! Zero ritiri: ora sì che ragioniamo da giocatore.',
      'Nemmeno un ritiro! Il tasto “ritira” si è sentito inutile. Bravo.',
    ],
    ruthless: [
      'Zero ritiri. Hai giocato come i grandi, senza paracadute. Mi hai stupito.',
      'Partita pulita. Non sembri nemmeno tu. Continua così.',
    ],
  },
  notebookSaved: {
    gentle: [
      'Ho segnato {errori} sul quaderno: li rivediamo con calma nei prossimi giorni.',
      'Sul quaderno ho aggiunto {errori} da riprendere. Poco alla volta si impara!',
    ],
    spicy: [
      'Ho scritto {errori} sul quaderno. Tornano a trovarti nei prossimi giorni, tipo parenti.',
      'Sul quaderno: {errori}. Li rivediamo presto, e stavolta li azzecchi.',
    ],
    ruthless: [
      'Quaderno aggiornato con {errori}. Verranno a cercarti, uno alla volta.',
      '{errori} segnati. Li rivedrai finché non li azzecchi. Anche un cavallo imparerebbe prima.',
    ],
  },
  poke: {
    gentle: [
      'Ehi! Mi hai fatto il solletico!',
      'Ciao! Ti serve qualcosa, o volevi solo un saluto?',
      'Coo coo! Presente!',
      'Che c’è? Sono qui, sono qui.',
      'Mi hai toccato la corona! Va bene, perdono.',
      'Fai pure, ma piano: sono fragile.',
    ],
    spicy: [
      'Ahi! Quello è il mio becco, non un bottone.',
      'Oh, cosa vuoi? Non vedi che sto lucidando la corona?',
      'Coo. E con questo ho esaurito la mia conversazione.',
      'Se cerchi briciole, non ne ho. Se cerchi consigli, chiedi.',
      'Mi stai toccando. Lo noto. Lo registro.',
      'Attento, ho sempre un’ala pronta.',
    ],
    ruthless: [
      'Giù le zampe. Ali. Come si dice. Giù i diti.',
      'Se continui ti picchietto in testa. Con classe.',
      'Toccare il piccione è un reato minore. Ma reato.',
      'Che c’è? Sto riposando gli occhi. E la pazienza.',
      'Sì sì, sono io. Gigi. Quello che ti insegna a non perdere pezzi.',
      'Cosa speri di ottenere? Una briciola? Ti prendo per la gola.',
    ],
  },
  pokeMany: {
    gentle: [
      'Ehi, basta con il solletico! Ora mi arrabbio un po’.',
      'Ok, ora basta, eh. Ho una dignità da piccione.',
      'Va bene, mi hai stuzzicato abbastanza! Giochiamo a scacchi, invece?',
    ],
    spicy: [
      'BASTA! Sto per perdere le piume.',
      'Ok, ora sono arrabbiato. Un poco. Ma solo un poco. Poco poco.',
      'Smettila! Altrimenti ti sfido a dama.',
    ],
    ruthless: [
      'TI HO DETTO DI NON TOCCARMI. Sto per fare un disastro.',
      'Un altro tocco e vado a vivere su una statua. Ti lascio solo.',
      'Sono un coach, non un pulsante. Ora vai a studiare, che ti serve.',
    ],
  },
  greetNew: {
    gentle: [
      'Ciao! Io sono Gigi, il tuo allenatore. Facciamo un test veloce per capire da dove partire?',
      'Benvenuto! Sono Gigi e ti insegno gli scacchi senza fatica. Cominciamo con un test veloce?',
      'Piacere, Gigi! Faremo un piccolo test e poi iniziamo insieme, piano piano.',
    ],
    spicy: [
      'Ciao pivello! Sono Gigi. Facciamo un test veloce così vedo quanto c’è da lavorare.',
      'Ciao! Sono Gigi, piccione con corona e opinioni. Test iniziale: vediamo cosa sai.',
      'Benvenuto nel mio parco. Cinque puzzle, due minuti: vediamo se hai un cervello.',
    ],
    ruthless: [
      'Ah, un nuovo allievo. Facciamo un test veloce così misuro il disastro.',
      'Sono Gigi. Ti faccio un test, e poi decido se sei un caso disperato o solo un caso difficile.',
      'Benvenuto. Il test dura due minuti. Il mio giudizio, tutta la vita.',
    ],
  },
  greetMorning: {
    gentle: [
      'Buongiorno! Ecco il piano di oggi, circa 15 minuti.',
      'Buongiorno! Hai dormito bene? Io ho già beccato tre briciole. Partiamo?',
      'Buon giorno! Una partitina per iniziare bene?',
      'Che bella giornata per imparare qualcosa di nuovo! Buongiorno!',
    ],
    spicy: [
      'Buongiorno, pivello. Piano di oggi: 15 minuti, zero scuse.',
      'Buongiorno! Ti sei svegliato presto, o tardi? Comunque ci siamo.',
      'Giorno! Caffè? No, scacchi. Prima gli scacchi.',
      'Buongiorno! Il sole è alto, i pezzi sono pronti, il piccione è sveglio. Tu?',
    ],
    ruthless: [
      'Buongiorno. Se sei qui di mattina o sei motivato o stai evitando qualcosa. Giochiamo.',
      'Mattina! Ti vedo con gli occhi socchiusi. Tranquillo, anche i tuoi pezzi dormono.',
      'Buongiorno. Oggi si fa meno schifo di ieri. Promesso.',
      'Giorno. Piano di oggi pronto. Scuse non pervenute.',
    ],
  },
  greetAfternoon: {
    gentle: [
      'Buon pomeriggio! Ecco il piano di oggi, ci vorrà poco.',
      'Buon pomeriggio! Una pausa con gli scacchi?',
      'Ciao! Il pomeriggio è perfetto per un puzzle. Che dici?',
    ],
    spicy: [
      'Buon pomeriggio, pivello. Piano di oggi: niente scuse, solo scacchi.',
      'Pomeriggio! Hai finito di procrastinare? Bene, partiamo.',
      'Ciao! Pausa pranzo finita? Ora si impara.',
      'Buon pomeriggio! Il parco è pieno di gente e di briciole. E di te.',
    ],
    ruthless: [
      'Pomeriggio. Se avessi studiato prima ora saresti già bravo. Cominciamo.',
      'Buon pomeriggio. Hai tempo da perdere? Bene, perdilo con me.',
      'Pomeriggio. Prima i pezzi, poi il divano.',
      'Ciao. Siamo a metà giornata, a metà piano e a metà talento. Partiamo.',
    ],
  },
  greetEvening: {
    gentle: [
      'Buonasera! Una partitina prima di cena?',
      'Buonasera! Ecco il piano di oggi, con calma.',
      'Ciao! La sera è perfetta per rilassarsi con qualche mossa.',
    ],
    spicy: [
      'Buonasera, pivello. Ancora in piedi? Vediamo cosa sai fare.',
      'Buonasera! Giornata dura? Sfogati con una partita.',
      'Sera! Il piccione è stanco ma ti aspetta lo stesso.',
      'Buonasera. Ho letto che gli scacchi fanno bene al sonno. Ho inventato la notizia. Ma gioca.',
    ],
    ruthless: [
      'Buonasera. Stai giocando a scacchi invece di fare altro. Sei dei miei.',
      'Sera. Ultima partita? La penultima? La tua carriera? Chi lo sa. Giochiamo.',
      'Buonasera. Oggi non sei riuscito a farlo prima. Fa niente, io ho tempo.',
      'Sera. Ti vedo stanco. Ottimo momento per fare svarioni. Su, dai.',
    ],
  },
  greetNight: {
    gentle: [
      'Ehi, è tardi! Una partitina veloce e poi a nanna?',
      'Notte! Gioca con calma, io ho già gli occhi pesanti.',
      'Ciao! Non è un po’ tardi? Ma va bene, ci sono.',
    ],
    spicy: [
      'Ma che ora è? Notte fonda, pivello. Una partita e poi a letto.',
      'Siamo ai tempi supplementari della giornata. Giochiamo, ma poi dormi.',
      'Nottambulo! Ti riconosco, siamo della stessa razza. Piccioni notturni.',
    ],
    ruthless: [
      'È notte. Il tuo cervello a quest’ora fa schifo. Il mio no, io ho la corona.',
      'Notte fonda. Ottimo momento per giocare male. Cominciamo!',
      'A quest’ora gli svarioni sono quasi garantiti. Fammi vedere.',
    ],
  },
  greetBack: {
    gentle: [
      'Bentornato! Sono passati {n} giorni, mi sei mancato.',
      'Eccoti! Ti aspettavo, {n} giorni sono tanti. Ripartiamo piano?',
      'Ciao! Non importa quanto sei stato via, ricominciamo insieme.',
    ],
    spicy: [
      'Ah, il ritorno del pivello! {n} giorni di assenza. Nel frattempo ho contato le briciole.',
      'Bentornato. {n} giorni, eh? Ti sei dimenticato come si muove il cavallo?',
      'Eccoti! Ho tenuto il tuo posto caldo. Con le mie piume.',
    ],
    ruthless: [
      '{n} giorni senza di te. Il parco è stato più tranquillo. Ma ora ripartiamo.',
      'Ah, sei vivo. {n} giorni. Scommetto che hai dimenticato tutto.',
      'Bentornato. Gli scacchi non scappano, ma tu sì: {n} giorni di latitanza.',
    ],
  },
  greetStreak: {
    gentle: [
      '{n} giorni di fila! Sono davvero fiero di te.',
      'Che costanza: {n} giorni consecutivi! Complimenti!',
      '{n} giorni uno dopo l’altro. Che bella abitudine!',
    ],
    spicy: [
      '{n} giorni di fila: il piccione è fiero di te.',
      '{n} giorni di seguito! Cominci a fare sul serio, eh?',
      'Serie di {n} giorni! Ti darei una briciola, ma me la mangio io.',
    ],
    ruthless: [
      '{n} giorni di fila. Costante. Che noia. Che bravo.',
      '{n} giorni consecutivi: o sei motivato o ti piace il mio fascino. Accetto entrambe.',
      'Serie di {n}. Non rovinarla oggi, per favore.',
    ],
  },
  greetWonLast: {
    gentle: [
      'L’ultima volta hai battuto {bot}! Oggi ci proviamo di nuovo?',
      'Ultima partita: vittoria contro {bot}. Complimenti! Oggi sali di livello?',
    ],
    spicy: [
      'Ultima partita: vittoria contro {bot}. Non fare il gradasso oggi.',
      'Hai battuto {bot} l’ultima volta, ricordi? Io sì. Lo racconto a tutti.',
    ],
    ruthless: [
      'Hai vinto contro {bot}. Era facile. Vediamo oggi.',
      'Ricordo la tua vittoria contro {bot}. Un caso isolato o una tendenza?',
    ],
  },
  greetLostLast: {
    gentle: [
      'L’ultima volta {bot} ti ha battuto. Oggi ci prendiamo la rivincita?',
      'Hai perso contro {bot} e non fa niente. Oggi si ricomincia!',
    ],
    spicy: [
      '{bot} ti ha battuto l’ultima volta. Io non dimentico. Rivincita?',
      'Ricordi {bot}? Ti ha dato una lezione. Ora la lezione la dai tu.',
    ],
    ruthless: [
      '{bot} ti ha fatto a pezzi. Io ero lì. Ho visto tutto. Rivincita?',
      'L’ultima volta {bot} ti ha battuto. Oggi cerca di non ripetere gli stessi errori. O ripetili: mi diverto.',
    ],
  },
  greetRetracts: {
    gentle: [
      'Nell’ultima partita hai ritirato {n} mosse. Oggi proviamo a pensarci un po’ prima?',
      'Ricordi? {n} mosse ritirate l’ultima volta. Oggi guardiamo bene prima di muovere!',
    ],
    spicy: [
      '{n} ritiri nell’ultima partita. Il tasto “ritira” si è consumato.',
      'Hai ritirato {n} mosse l’ultima volta. Oggi guardiamo prima di cliccare?',
    ],
    ruthless: [
      '{n} mosse ritirate. Ho perso il conto. Ah no, ecco: {n}. Hai la mano nervosa.',
      'L’ultima volta hai ritirato {n} volte. Il bot ti ha concesso più chance di una slot machine.',
    ],
  },
  resume: {
    gentle: [
      'Bentornato! La partita contro {bot} ti aspettava: riprendiamo da dove eravamo.',
      'Eccoci di nuovo! {bot} non si è mosso, io nemmeno. Riparti con calma.',
      'Ripresa la partita! Dai un’occhiata alla scacchiera prima di muovere.',
    ],
    spicy: [
      'Sei tornato! {bot} ha aspettato. Io ho fatto un pisolino sul re.',
      'Partita ripresa. Rileggiti la posizione: non fidarti della tua memoria da piccione.',
      'Eccoti! {bot} sorride. Non so perché, ma sorride.',
    ],
    ruthless: [
      'Sei scappato dalla partita e sei tornato. Il coraggio è questione di dettagli.',
      '{bot} ti ha aspettato. Gli avevi lasciato anche un po’ di vantaggio, o l’hai dimenticato?',
      'Partita ripresa. Spero tu abbia pensato alla mossa nel frattempo.',
    ],
  },
}
