# Gigi Scacchi

App web (installabile su telefono e PC) per imparare a giocare a scacchi in fretta, con **Gigi**, un piccione coach sarcastico.

- **Bot** di 8 livelli che sbagliano in modo "umano" (Stockfish con errori pesati).
- **Giudizio delle mosse** stile Chess.com (geniale, migliore, imprecisione, errore, svarione) con possibilità di *ritirare la mossa*.
- **Mappa del pericolo**: le case controllate dall'avversario e i pezzi in presa si colorano sulla scacchiera.
- **Piano giornaliero**: una lezione, 5 puzzle e una partita. Test iniziale per stimare il livello.
- **Rivedi i tuoi errori**: a fine partita Gigi sceglie solo gli errori che contano (max 3), ti fa riprovare a trovare la mossa giusta e ti mostra come ti punisce l'avversario.
- **Guardaroba di Gigi**: papillon, occhiali, mantello… si sbloccano giocando.
- **Coach**: frasi in italiano con tre toni (gentile, pepato, spietato). Spiegazioni a parole facoltative con l'API di Gemini (la chiave resta solo sul dispositivo).
- **Gigi con 10 espressioni** (anche dubbioso con i "??", pensieroso, assonnato, triste, compiaciuto), con battute che non si ripetono e che dipendono da cosa succede (cattura della regina, arrocco, mosse avanti e indietro…), dall'ora del giorno e da cosa ricorda delle tue ultime partite. Nella Home puoi anche punzecchiarlo.
- **Profilo**: nome e avatar nella barra laterale (foto Google, Gigi, pezzi o i bot battuti), con l'anello del livello.
- **16 avversari** su una scala a mezze stelle (gli 8 storici più 8 intermedi, concentrati nei livelli di mezzo). Gli id dei bot originali non cambiano mai: sono salvati nei progressi.
- **Bot con uno stile** (attaccante, posizionale, tattico, solido): non è un copione, è una preferenza fra mosse quasi equivalenti sopra la forza del bot (`src/engine/style.ts`), quindi i bot forti restano precisi e quelli deboli mostrano di più il proprio carattere. Sulla scheda del bot c’è lo stile e a inizio partita Gigi dice come affrontarlo. `node --experimental-strip-types scripts/measure-style.mjs` misura quanto cambiano le scelte.
- **Il tuo punto debole**: a fine partita lo storico (precisione e tipo di ogni errore: pezzi in presa, matti mancati, occasioni non colte, re in pericolo, aperture, finali) mostra dove perdi più punti, come vai contro ogni stile di bot e cosa allenare (lezione, puzzle del tema giusto o finali). `src/engine/mistakes.ts`.
- **Rivedi tutta la partita**: scorri le mosse con le frecce, grafico della probabilità di vincere cliccabile, salto all'errore più pesante, mossa giusta con frecce e tasto "Provaci tu". `src/components/GameReplay.tsx`.
- **Commento di fine partita (facoltativo)**: se hai inserito la chiave Gemini, dopo la revisione il coach scrive 2-3 frasi con com'è andata, il tema che ricorre negli errori e un consiglio. Parte in coda e non rallenta nulla: se Gemini è lento o non risponde non compare niente. `summarizeGameWithGemini` in `src/coach/gemini.ts`.
- **Ritiri con giudizio**: prima di ritirare una mossa sbagliata Gigi chiede "dov'è il guaio?" (tocca il pezzo giusto). Una partita senza nessun ritiro è una *partita pulita* e dà bonus XP.
- **Quaderno degli errori**: gli errori ritirati e i peggiori di ogni partita tornano come esercizio dopo 1, 3, 7, 14 e 30 giorni (ripetizione a intervalli) finché non li hai imparati.
- **Quattro coach** con le stesse espressioni ma voce, aspetto e battute diversi: Gigi il piccione, Capitan Gabbiano (pirata), Professor Gufo (pomposo, finto latino) e Nonna Gallina (affettuosa e severa). Gli ultimi tre si sbloccano giocando (vedi `src/coach/coaches.ts`) e si scelgono nelle Impostazioni; i toni gentile/pepato/spietato valgono per tutti. Le battute stanno in `src/coach/voices/`: gli eventi che un coach non ha ripiegano su Gigi.
- **Guardaroba** con anteprima di ogni oggetto, cinque categorie (corona, occhi, collo, schiena, in ala) e barra di avanzamento per quelli ancora da sbloccare.

Le battute di Gigi stanno in `src/coach/voices/` (una voce per coach, un mazzo di frasi per evento e tono); `src/coach/lines.ts` sceglie la frase evitando le ultime usate.

## Sviluppo

```bash
npm install --legacy-peer-deps
npm run dev
```

```bash
npm run build      # build di produzione (PWA)
```

Rigenerare i puzzle (usa Stockfish, ci mette qualche minuto):

```bash
node scripts/gen-puzzles.mjs
```

Controllare che le lezioni siano valide:

```bash
node --experimental-strip-types scripts/validate-lessons.mjs
```

Rigenerare logo e icone PWA (serve `@resvg/resvg-js`, non salvato nel progetto):

```bash
npm i --no-save --legacy-peer-deps @resvg/resvg-js
node scripts/build-icons.mjs
```

## Sincronizzazione con Google (facoltativa)

Con Firebase (piano gratuito) i progressi si sincronizzano da soli tra PC e telefono. Prima di tutto va creato un progetto Firebase:

1. Su <https://console.firebase.google.com> crea un progetto (senza Analytics).
2. **Build → Authentication → Get started → Google**: abilita il provider e scegli la tua email come email di supporto.
3. **Authentication → Settings → Authorized domains**: aggiungi `chribriga.github.io` (`localhost` c'è già).
4. **Build → Firestore Database → Create database** (modalità produzione, regione europea), poi nella scheda **Rules** incolla:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /users/{uid} {
         allow read, write: if request.auth != null && request.auth.uid == uid;
       }
     }
   }
   ```
5. **Project settings → Your apps → Web (</>)**: registra l'app e copia l'oggetto `firebaseConfig` in `src/sync/config.ts`.

La configurazione Firebase non è un segreto: i dati sono protetti dalle regole qui sopra. Cosa viene sincronizzato: progressi, tema, tono, accessori. La chiave Gemini no, resta solo sul dispositivo.

## Pubblicazione

Il workflow `.github/workflows/deploy.yml` pubblica su GitHub Pages a ogni push su `main`
(Settings → Pages → Source: GitHub Actions).

## Licenze

- Motore: [stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0).
- Suoni: sintetizzati con Web Audio in `src/sound.ts` (nessun file esterno).
- Pezzi: set *cburnett* di Colin M.L. Burnett (GPL-2.0+/BSD/CC-BY-SA).
- Il progetto è quindi distribuito sotto GPL-3.0.
