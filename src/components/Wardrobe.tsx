import { useEffect, useState } from 'react'
import { Check, CoatHanger, Lock } from '@phosphor-icons/react'
import { DEFAULT_CROWN, SLOTS, SLOT_LABEL, earnableFor, isUnlocked, itemsFor, outfitOf, validOutfit, type Outfit, type Slot } from '../coach/outfits'
import { COACHES, activeCoach, coachInfo, coachUnlocked, type CoachId } from '../coach/coaches'
import { Pigeon } from '../coach/Pigeon'
import { AvatarFace } from './Avatar'
import { update, useApp } from '../store'

/** Quale parte del coach mostrare nell'anteprima di ogni oggetto (viewBox dell'SVG): le teste degli altri coach sono più grandi. */
function viewFor(slot: Slot, coach: CoachId): string {
  const big = coach !== 'gigi'
  switch (slot) {
    case 'crown':
      return big ? '30 -26 100 100' : '35 -8 90 90'
    case 'face':
      return big ? '38 22 84 84' : '44 26 72 72'
    case 'neck':
      return '34 58 92 92'
    case 'back':
      return '0 0 160 160'
    default:
      return '-8 78 84 84'
  }
}

/** Guardaroba: ogni coach ha il suo (salvato a parte). Gli oggetti si sbloccano giocando; alcuni sono comuni, altri esclusivi. */
export function Wardrobe() {
  const { settings, progress } = useApp()
  const active = activeCoach(settings, progress)
  const [view, setView] = useState<CoachId>(active)
  // se cambi coach dalla scelta qui sopra, il guardaroba ti segue
  useEffect(() => setView(active), [active])
  const [slot, setSlot] = useState<Slot>('crown')

  const info = coachInfo(view)
  const worn: Outfit = validOutfit(view, outfitOf(settings, view))
  const earnable = earnableFor(view)
  const open = earnable.filter((o) => isUnlocked(o, progress)).length
  const items = itemsFor(view, slot)
  const defaultCrown = DEFAULT_CROWN[view]

  const save = (fn: (cur: Outfit) => void) =>
    update((st) => {
      const cur = { ...outfitOf(st.settings, view) }
      fn(cur)
      if (view === 'gigi') st.settings.outfit = cur
      else st.settings.outfits = { ...(st.settings.outfits ?? {}), [view]: cur }
    })

  const wear = (s: Slot, id: string) =>
    save((cur) => {
      // il copricapo c'è sempre (cambia solo stile); gli altri oggetti si possono togliere riprovandoli
      if (cur[s] === id && s !== 'crown') delete cur[s]
      else cur[s] = id
    })
  const takeOff = (s: Slot) => save((cur) => void delete cur[s])

  return (
    <section className="card wardrobe">
      <h3>
        <CoatHanger size={20} weight="duotone" style={{ verticalAlign: -4, marginRight: 6 }} />
        Guardaroba di {info.name}{' '}
        <small className="muted">
          · {open}/{earnable.length} sbloccati
        </small>
      </h3>

      <div className="wd-coaches" role="tablist" aria-label="Scegli il coach da vestire">
        {COACHES.map((c) => {
          const ok = coachUnlocked(c, progress)
          return (
            <button
              key={c.id}
              role="tab"
              aria-selected={view === c.id}
              className={`wd-coach${view === c.id ? ' on' : ''}${ok ? '' : ' locked'}`}
              disabled={!ok}
              onClick={() => setView(c.id)}
              title={ok ? c.name : c.how}
            >
              <AvatarFace kind={c.id === 'gigi' ? 'gigi' : `coach:${c.id}`} size={34} />
              <span>{c.name.replace('Capitan ', '').replace('Professor ', '').replace('Nonna ', '')}</span>
              {!ok && <Lock size={12} weight="fill" />}
            </button>
          )
        })}
      </div>

      <div className="wardrobe-body">
        <div className="wardrobe-preview">
          <Pigeon mood="happy" size={190} outfit={worn} coach={view} />
        </div>
        <div className="wardrobe-items">
          <div className="slot-tabs" role="tablist">
            {SLOTS.map((s) => {
              const all = itemsFor(view, s)
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
              const on = worn[slot] === o.id || (slot === 'crown' && !worn.crown && o.id === defaultCrown)
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
                    <Pigeon mood="neutral" size={84} outfit={{ [slot]: o.id }} view={viewFor(slot, view)} coach={view} still />
                  </span>
                  <strong>{o.name}</strong>
                  {ok ? (
                    <small>{on ? 'Indossato' : o.coach ? 'Tocca per indossare' : 'Per tutti · tocca'}</small>
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
              {view === 'gigi' ? `Togli “${SLOT_LABEL[slot]}”` : `Rimetti il look di serie (${SLOT_LABEL[slot]})`}
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
