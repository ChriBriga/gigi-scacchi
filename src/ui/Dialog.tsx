import { type ReactNode, useEffect, useRef, useState } from 'react'
import { X } from '@phosphor-icons/react'

/**
 * Finestra di dialogo unica per tutta l'app: stessa animazione e stesso stile ovunque.
 * Usa <dialog> del browser: Esc la chiude, il fuoco resta dentro e torna dov'era alla chiusura.
 */
export function Dialog({
  title,
  children,
  actions,
  onClose,
  wide,
}: {
  title: string
  children?: ReactNode
  /** i tasti in fondo (il principale per ultimo) */
  actions?: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (!d.open) d.showModal()
    // il fuoco parte dal tasto indicato (quello "sicuro"), non dalla crocetta
    d.querySelector<HTMLElement>('[data-autofocus]')?.focus()
  }, [])
  return (
    <dialog
      ref={ref}
      className={`dlg${wide ? ' wide' : ''}`}
      aria-label={title}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      // un tocco sullo sfondo (fuori dal riquadro) chiude
      onPointerDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <div className="dlg-box">
        <div className="dlg-head">
          <h3>{title}</h3>
          <button className="ghost dlg-x" onClick={onClose} aria-label="Chiudi">
            <X size={20} weight="bold" />
          </button>
        </div>
        {children && <div className="dlg-body">{children}</div>}
        {actions && <div className="dlg-actions">{actions}</div>}
      </div>
    </dialog>
  )
}

interface Ask {
  title: string
  text?: string
  /** testo del tasto che conferma */
  ok?: string
  cancel?: string
  /** la conferma fa perdere qualcosa: il tasto diventa rosso */
  danger?: boolean
  resolve: (yes: boolean) => void
}

let show: ((a: Ask) => void) | null = null

/** Chiede una conferma con la finestra dell'app (al posto di `confirm()` del browser). */
export function confirmDialog(opts: Omit<Ask, 'resolve'>): Promise<boolean> {
  return new Promise((resolve) => {
    if (show) show({ ...opts, resolve })
    else resolve(window.confirm(opts.text ? `${opts.title}\n${opts.text}` : opts.title))
  })
}

/** Va montato una volta sola (in App): mostra le conferme chieste con `confirmDialog`. */
export function DialogHost() {
  const [ask, setAsk] = useState<Ask | null>(null)
  useEffect(() => {
    show = setAsk
    return () => {
      show = null
    }
  }, [])
  if (!ask) return null
  const answer = (yes: boolean) => {
    setAsk(null)
    ask.resolve(yes)
  }
  return (
    <Dialog
      title={ask.title}
      onClose={() => answer(false)}
      actions={
        <>
          {/* Invio conferma solo le scelte senza rischi: se si perde qualcosa il fuoco parte da "annulla" */}
          <button className="btn" onClick={() => answer(false)} data-autofocus={ask.danger ? '' : undefined}>
            {ask.cancel ?? 'Annulla'}
          </button>
          <button className={`btn ${ask.danger ? 'danger' : 'primary'}`} onClick={() => answer(true)} data-autofocus={ask.danger ? undefined : ''}>
            {ask.ok ?? 'Va bene'}
          </button>
        </>
      }
    >
      {ask.text && <p>{ask.text}</p>}
    </Dialog>
  )
}
