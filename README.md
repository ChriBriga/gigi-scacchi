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

## Pubblicazione

Il workflow `.github/workflows/deploy.yml` pubblica su GitHub Pages a ogni push su `main`
(Settings → Pages → Source: GitHub Actions).

## Licenze

- Motore: [stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0).
- Suoni: sintetizzati con Web Audio in `src/sound.ts` (nessun file esterno).
- Pezzi: set *cburnett* di Colin M.L. Burnett (GPL-2.0+/BSD/CC-BY-SA).
- Il progetto è quindi distribuito sotto GPL-3.0.
