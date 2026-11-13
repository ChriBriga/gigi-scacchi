# Idee per far migliorare davvero il giocatore

Appunti di prodotto. Obiettivo: essere più utile di chess.com (anche del piano a pagamento) per chi vuole salire di livello giocando contro i bot.

Stato: `fatto` = c'è già nell'app, `da fare` = proposta, `da decidere` = serve una scelta.

## Appunti originali di Christian

> Dovremmo rendere il progetto migliore di chess.com: lì non ci sono revisioni illimitate. Andrebbe fatto che ci sia consigliato cosa fare, visto l'andamento e i progressi: l'AI sa che ho fatto partite contro bot di un certo livello e fatto errori, e allora mi consiglia di sfidarne uno di livello più basso, o di fare puzzle. Poi ci starebbe mettere partite senza aiuti, dove non puoi tornare indietro: magari il coach ti fa notare che è un grande errore ma non puoi tornare indietro. Forse aiuta a ricordare e imparare dagli errori se ne subisci le conseguenze, piuttosto che tornare indietro e fare un'altra mossa.
>
> I bot andrebbero sistemati meglio: da sbloccare? divisi in categorie? con livelli di Elo diversi e non stelline?

## Cosa c'è già (e chess.com fa pagare)

| Cosa | chess.com gratis | Qui |
|---|---|---|
| Revisione partita | 1 al giorno | illimitata (`GameReplay`, `GameReview`) — `fatto` |
| Riprova i tuoi errori | a pagamento | "Provaci tu" + Quaderno degli errori con ripasso a 1/3/7/14/30 giorni — `fatto` |
| Puzzle | pochi al giorno | illimitati, per tema — `fatto` |
| Statistiche sui punti deboli (Insights) | a pagamento | "Il tuo punto debole" — `fatto`, ampliabile |
| Piano di allenamento | a pagamento | "Allenamento di oggi" (`training.ts`) — `fatto` |
| Commento del coach a parole | a pagamento | Gigi + riassunto Gemini facoltativo — `fatto` |
| Finali contro il motore | a pagamento | 11 finali — `fatto` |

## Proposte

### 1. Tre modi di giocare — `fatto`

Il modo si sceglie nella scheda Gioca (resta l’ultimo scelto):

- **Allenamento** (quello di oggi): avviso, quiz "Dov'è il guaio?", ritiro della mossa, aiuti.
- **Senza rete**: Gigi dice che è un errore, ma la mossa resta. Niente ritiro, niente Aiuto, Consigli, Minacce e mappa del pericolo. Resta "Perché?".
- **Torneo**: silenzio totale, niente barra di valutazione, niente aiuti. Tutto alla fine nella revisione.

Perché ha senso: ritirare la mossa dà un riscontro immediato (utile per imparare lo schema), ma l'avviso fa il controllo al posto del giocatore. L'abitudine da costruire è "prima di muovere, guardo cosa lascio in presa", e si costruisce solo quando nessuno avvisa. Subire le conseguenze aiuta anche a imparare a difendersi in posizioni brutte. Le due cose si completano: allenamento per capire, senza rete per verificare.

L'errore fatto in "Senza rete" o "Torneo" finisce comunque nel Quaderno.

### 2. Medaglie per bot al posto del semplice "battuto" — `fatto`

- Bronzo: battuto in Allenamento
- Argento: battuto Senza rete
- Oro: battuto in Torneo

Così la scala dei bot misura qualcosa di vero: oggi una vittoria con 6 mosse ritirate vale come una pulita.

### 3. Gigi consiglia la prossima mossa (fuori dalla scacchiera) — `fatto`

Nel riquadro di fine partita, un solo consiglio con il motivo e un tasto che ci porta dritto. Calcolato dallo storico, senza Gemini (`src/coach/nextStep.ts`). Regole, in ordine:

Se hai vinto:
- in Allenamento ritirando 2 o più mosse → rigioca lo stesso bot Senza rete
- Senza rete o Torneo con precisione sotto il 70% → un'altra contro lo stesso bot, per conferma
- altrimenti → sali al bot successivo, nello stesso modo
- contro l'ultimo bot → riprovaci in Torneo per l'oro

Se hai perso o pareggiato:
- 3 sconfitte di fila → scendi di un bot
- stesso tipo di errore 2 volte nella partita, o in 3 partite di fila → lezione su quel tema (se non l'hai fatta) oppure 5 puzzle
- errori del Quaderno in scadenza → ripasso
- Senza rete o Torneo con precisione sotto il 60% → rigioca lo stesso bot in Allenamento
- altrimenti → rivincita

Da valutare più avanti: usare lo stesso consiglio anche nella Home (oggi lì il bot consigliato segue solo il livello stimato).

### 4. Bot in categorie + punteggio del giocatore — `da decidere`

- **Categorie**: 4 gruppi da 4 (es. Parco, Circolo, Torneo, Leggende), l'ultimo di ogni gruppo è il "boss".
- **Sblocco**: sconsigliato il blocco rigido. Meglio tutto aperto, con il gruppo successivo "consigliato" quando hai almeno l'argento sul boss.
- **Elo**: i bot non sono tarati su un Elo vero, quindi un numero tipo "1200" sarebbe inventato. Alternativa onesta: un **punteggio interno** (i bot hanno un valore fisso sulla scala, il giocatore sale e scende come con l'Elo, contano solo le partite Senza rete e Torneo). Dà il numero che dice "sto migliorando?" senza fingere che sia l'Elo di chess.com. Le stelline spariscono.

Nota: in passato la scelta era "8 livelli senza mostrare Elo". Va riconfermata o cambiata.

### 5. "Questa mossa è sicura?" — `da fare` (priorità 3)

Allenamento contro le sviste: posizione + mossa proposta, il giocatore dice "sicura" o "errore" e, se errore, indica cosa si perde. È l'esercizio più mirato per chi ritira spesso la mossa dopo l'avviso. Le posizioni si generano dai propri errori (Quaderno) e dai puzzle.

### 6. Statistiche più ricche — `da fare`

- **Vantaggio sprecato**: partite in cui eri in netto vantaggio e non hai vinto → porta ai finali.
- **Rimonte**: partite recuperate da posizione persa.
- Precisione per fase (apertura, mediogioco, finale) e per colore.
- Andamento nel tempo del punteggio e della precisione.

### 7. Altre idee (non prioritarie)

- **Riprendi da qui**: rigiocare contro il bot dalla posizione prima dell'errore decisivo (già scartata una volta, legata però al punto 1).
- **Sopravvivenza puzzle**: puzzle sempre più difficili, 3 errori e fine (la "Puzzle Rush" a pagamento).
- **Aperture**: 2-3 aperture scelte da allenare (già scartata una volta).
- **Orologio**: partite a tempo contro i bot.

## Ordine consigliato

1. ~~Modi di gioco + medaglie (1 e 2)~~ fatto
2. ~~Consiglio dopo la partita (3)~~ fatto
3. Categorie e punteggio (4), dopo aver deciso
4. "Questa mossa è sicura?" (5)
5. Statistiche (6)
