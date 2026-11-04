import { useState } from 'react'
import { Check, CoatHanger, Lock } from '@phosphor-icons/react'
import { OUTFIT, SLOTS, SLOT_LABEL, isUnlocked, type Outfit, type Slot } from '../coach/outfits'
import { Pigeon } from '../coach/Pigeon'
import { update, useApp } from '../store'

/** Quale parte di Gigi mostrare nell'anteprima di ogni oggetto (viewBox dell'SVG). */
const VIEW: Record<Slot, string> = {
  crown: '35 -8 90 90',
  face: '44 26 72 72',
  neck: '34 58 92 92',
  back: '0 0 160 160',
  extra: '-8 78 84 84',
}

/** Guardaroba di Gigi: ogni oggetto ha la sua anteprima, si sblocca giocando e qui si indossa. */
export function Wardrobe() {
  const { settings, progress } = useApp()
  const [slot, setSlot] = useState<Slot>('crown')
  const worn: Outfit = settings.outfit ?? {}
  const earnable = OUTFIT.filter((o) => o.need > 1 || o.how !== 'Sempre disponibile')
  const open = earnable.filter((o) => isUnlocked(o, progress)).length
  const items = OUTFIT.filter((o) => o.slot === slot)

  const wear = (s: Slot, id: string) =>
    update((st) => {
      const cur = { ...(st.settings.outfit ?? {}) }
      // la corona c'è sempre (cambia solo stile); gli altri oggetti si possono togliere riprovandoli
      if (cur[s] === id && s !== 'crown') delete cur[s]
      else cur[s] = id
      st.settings.outfit = cur
    })
  const takeOff = (s: Slot) =>
    update((st) => {
      const cur = { ...(st.settings.outfit ?? {}) }
      delete cur[s]
      st.settings.outfit = cur
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
          <Pigeon mood="happy" size={190} outfit={worn} />
        </div>
        <div className="wardrobe-items">
          <div className="slot-tabs" role="tablist">
            {SLOTS.map((s) => {
              const all = OUTFIT.filter((o) => o.slot === s)
              const got = all.filter((o) => isUnlocked(o, progress)).length
              return (
                <button key={s} role="tab" aria-selected={slot === s} className={slot === s ? 'on' : ''} onClick={() => setSlot(s)}>
                  {SLOT_LABEL[s]}
                  <small>
                    {got}/{all.length}
                  </small>
                </button>
              )
            })}
          </div>
          <div className="item-grid">
            {items.map((o) => {
              const ok = isUnlocked(o, progress)
              const on = worn[slot] === o.id || (slot === 'crown' && !worn.crown && o.id === 'oro')
              const have = Math.min(o.need, o.have(progress))
              return (
                <button
                  key={o.id}
                  className={`item-card${on ? ' on' : ''}${ok ? '' : ' locked'}`}
                  disabled={!ok}
                  onClick={() => wear(slot, o.id)}
                  title={ok ? o.name : o.how}
                >
                  <span className="item-thumb">
                    <Pigeon mood="neutral" size={84} outfit={{ [slot]: o.id }} view={VIEW[slot]} />
                  </span>
                  <strong>{o.name}</strong>
                  {ok ? (
                    <small>{on ? 'Indossato' : 'Tocca per indossare'}</small>
                  ) : (
                    <>
                      <small>{o.how}</small>
                      {o.need > 1 && (
                        <span className="item-progress">
                          <span className="bar">
                            <i style={{ width: `${Math.max(4, (have / o.need) * 100)}%` }} />
                          </span>
                          <small>
                            {have}/{o.need}
                          </small>
                        </span>
                      )}
                    </>
                  )}
                  {on && (
                    <span className="item-tick">
                      <Check size={14} weight="bold" />
                    </span>
                  )}
                  {!ok && (
                    <span className="item-lock">
                      <Lock size={14} weight="fill" />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {slot !== 'crown' && worn[slot] && (
            <button className="ghost" style={{ alignSelf: 'flex-start' }} onClick={() => takeOff(slot)}>
              Togli “{SLOT_LABEL[slot]}”
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
