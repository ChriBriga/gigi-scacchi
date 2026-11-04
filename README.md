# Gigi Scacchi

App web (installabile su telefono e PC) per imparare a giocare a scacchi in fretta, con **Gigi**, un piccione coach sarcastico.

- **Bot** di 8 livelli che sbagliano in modo "umano" (Stockfish con errori pesati).
- **Giudizio delle mosse** stile Chess.com (geniale, migliore, imprecisione, errore, svarione) con possibilità di *ritirare la mossa*.
- **Mappa del pericolo**: le case controllate dall'avversario e i pezzi in presa si colorano sulla scacchiera.
- **Piano giornaliero**: una lezione, 5 puzzle e una partita. Test iniziale per stimare il livello.
- **Rivedi i tuoi errori**: a fine partita Gigi sceglie solo gli errori che contano (max 3), ti fa riprovare a trovare la mossa giusta e ti mostra come ti punisce l'avversario.
- **Guardaroba di Gigi**: papillon, occhiali, mantello… si sbloccano giocando.
- **Coach**: frasi in italiano con tre toni (gentile, pepato, spietato). Spiegazioni a parole facoltative con l'API di Gemini (la chiave resta solo sul dispositivo).

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
