# Gigi Scacchi

App web (installabile su telefono e PC) per imparare a giocare a scacchi in fretta, con **Gigi**, un piccione coach sarcastico.

- **Bot** di 8 livelli che sbagliano in modo "umano" (Stockfish con errori pesati).
- **Giudizio delle mosse** stile Chess.com (geniale, migliore, imprecisione, errore, svarione) con possibilità di *ritirare la mossa*.
- **Mappa del pericolo**: le case controllate dall'avversario e i pezzi in presa si colorano sulla scacchiera.
- **Piano giornaliero**: una lezione, 5 puzzle e una partita. Test iniziale per stimare il livello.
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

## Pubblicazione

Il workflow `.github/workflows/deploy.yml` pubblica su GitHub Pages a ogni push su `main`
(Settings → Pages → Source: GitHub Actions).

## Licenze

- Motore: [stockfish.js](https://github.com/nmrugg/stockfish.js) (GPL-3.0).
- Pezzi: set *cburnett* di Colin M.L. Burnett (GPL-2.0+/BSD/CC-BY-SA).
- Il progetto è quindi distribuito sotto GPL-3.0.
