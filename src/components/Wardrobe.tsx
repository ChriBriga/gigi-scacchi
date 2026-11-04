import { Check, CoatHanger, Lock } from '@phosphor-icons/react'
import { OUTFIT, SLOT_LABEL, type Outfit, type Slot } from '../coach/outfits'
import { Pigeon } from '../coach/Pigeon'
import { update, useApp } from '../store'

const SLOTS: Slot[] = ['crown', 'neck', 'face', 'back']

/** Guardaroba di Gigi: gli accessori si sbloccano giocando, qui si scelgono. */
export function Wardrobe() {
  const { settings, progress } = useApp()
  const worn: Outfit = settings.outfit ?? {}
  const earnable = OUTFIT.filter((o) => o.slot !== 'crown')
  const open = earnable.filter((o) => o.unlocked(progress)).length

  const toggle = (slot: Slot, id: string) =>
    update((s) => {
      const cur = { ...(s.settings.outfit ?? {}) }
      if (cur[slot] === id) delete cur[slot]
      else cur[slot] = id
      s.settings.outfit = cur
    })

  return (
    <section className="card wardrobe">
      <h3>
        <CoatHanger size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
        Guardaroba di Gigi{' '}
        <small className="muted">
          · {open}/{earnable.length} sbloccati
        </small>
      </h3>
      <div className="wardrobe-body">
        <div className="wardrobe-preview">
          <Pigeon mood="happy" size={170} outfit={worn} />
        </div>
        <div className="wardrobe-items">
          {SLOTS.map((slot) => (
            <div key={slot}>
              <div className="slot-label">{SLOT_LABEL[slot]}</div>
              <div className="item-row">
                {OUTFIT.filter((o) => o.slot === slot).map((o) => {
                  const ok = o.unlocked(progress)
                  const on = worn[slot] === o.id
                  return (
                    <button
                      key={o.id}
                      className={`item${on ? ' on' : ''}${ok ? '' : ' locked'}`}
                      disabled={!ok}
                      onClick={() => toggle(slot, o.id)}
                      title={ok ? o.name : o.how}
                    >
                      <span className="item-ico">{ok ? on ? <Check size={16} weight="bold" /> : null : <Lock size={14} weight="fill" />}</span>
                      <strong>{o.name}</strong>
                      <small>{ok ? (on ? 'Indossata' : slot === 'crown' ? 'Tocca per cambiare stile' : 'Tocca per indossare') : o.how}</small>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
