import { Dialog } from './Dialog'

const GROUPS: { title: string; rows: [string[], string][] }[] = [
  {
    title: 'Scacchiera',
    rows: [
      [['Trascina'], 'oppure click sul pezzo e click sulla casa'],
      [['Tasto destro'], 'trascinando disegni una freccia, con un click un cerchio'],
      [['Click'], 'cancella frecce e cerchi'],
      [['Esc'], 'annulla la scelta della promozione'],
    ],
  },
  {
    title: 'In partita',
    rows: [
      [['←', '→'], 'rivedi le mosse già giocate'],
      [['Inizio', 'Fine'], 'prima posizione / torna alla partita'],
      [['T'], 'cosa minaccia l’avversario?'],
      [['C'], 'consigli: cosa faccio adesso?'],
    ],
  },
  {
    title: 'Rivedi la partita',
    rows: [
      [['←', '→'], 'mossa precedente / successiva'],
      [['Inizio', 'Fine'], 'prima / ultima mossa'],
    ],
  },
  {
    title: 'Ovunque',
    rows: [
      [['Esc'], 'chiude finestre e menu'],
      [['?'], 'apre questo elenco'],
    ],
  },
]

/** Elenco delle scorciatoie da tastiera (si apre con "?" o dal tasto nella barra laterale). */
export function Shortcuts({ onClose }: { onClose: () => void }) {
  return (
    <Dialog title="Scorciatoie" onClose={onClose} wide>
      <div className="keys-grid">
        {GROUPS.map((g) => (
          <section key={g.title}>
            <h4>{g.title}</h4>
            <dl>
              {g.rows.map(([keys, what]) => (
                <div key={what}>
                  <dt>
                    {keys.map((k) => (
                      <kbd key={k}>{k}</kbd>
                    ))}
                  </dt>
                  <dd>{what}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </Dialog>
  )
}
