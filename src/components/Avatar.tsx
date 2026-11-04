import { useState } from 'react'
import { Pigeon } from '../coach/Pigeon'
import { BotAvatar } from './BotAvatar'
import { levelProgress, useApp } from '../store'
import { useSyncStatus } from '../sync/cloud'

export interface Profile {
  name: string
  photo?: string
}

/** Nome e foto da mostrare: il soprannome scelto, altrimenti il nome dell'account Google. */
export function useProfile(): Profile {
  const { settings } = useApp()
  const sync = useSyncStatus()
  const first = sync.name?.split(' ')[0]
  return { name: settings.nickname.trim() || first || 'Giocatore', photo: sync.photo }
}

export const PIECE_AVATARS = ['wK', 'wQ', 'wR', 'wB', 'wN', 'wP']

/** Il viso di un avatar, senza legami con lo stato: serve anche per la scelta nelle impostazioni. */
export function AvatarFace({ kind, photo, size = 48 }: { kind: string; photo?: string; size?: number }) {
  const [broken, setBroken] = useState(false)
  const box = { width: size, height: size }

  if (kind === 'google' && photo && !broken) {
    return <img className="avatar-face" style={box} src={photo} alt="" referrerPolicy="no-referrer" onError={() => setBroken(true)} />
  }
  if (kind.startsWith('bot:')) {
    return (
      <span className="avatar-face bot" style={box}>
        <BotAvatar id={Number(kind.slice(4)) || 1} size={size} />
      </span>
    )
  }
  if (kind.startsWith('piece:')) {
    return (
      <span className="avatar-face piece" style={box}>
        <img src={`${import.meta.env.BASE_URL}pieces/${kind.slice(6)}.svg`} width={size * 0.78} height={size * 0.78} alt="" />
      </span>
    )
  }
  // Gigi: si ritaglia il viso (testa e corona) dalla mascotte intera
  const s = size * 2.1
  return (
    <span className="avatar-face gigi" style={box}>
      <span className="av-gigi" style={{ left: -0.55 * size, top: -0.1 * size, width: s, height: s }}>
        <Pigeon mood="cool" size={s} />
      </span>
    </span>
  )
}

/** L'avatar scelto dall'utente; con `ring` mostra attorno quanto manca al prossimo titolo di livello. */
export function Avatar({ size = 48, ring = false }: { size?: number; ring?: boolean }) {
  const { settings, progress } = useApp()
  const { photo } = useProfile()
  const face = <AvatarFace kind={settings.avatar} photo={photo} size={size} />
  if (!ring) return face
  return (
    <span className="avatar-ring" style={{ ['--p' as string]: levelProgress(progress.skill), width: size + 10, height: size + 10 }} title="Verso il prossimo livello">
      {face}
    </span>
  )
}
