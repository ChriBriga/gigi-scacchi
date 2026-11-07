import {
  Coins,
  MapTrifold,
  Target,
  Eye,
  Crown,
  RocketLaunch,
  Pizza,
  CastleTurret,
  Scissors,
  ForkKnife,
  PushPin,
  Lightning,
  Medal,
  Handshake,
  Stairs,
  Gift,
  Diamond,
  Sparkle,
  ShieldCheck,
  Skull,
  FlagCheckered,
  Smiley,
  Pepper,
  SmileyAngry,
  Columns,
  Footprints,
  Church,
  TreeStructure,
  Path,
  type Icon,
} from '@phosphor-icons/react'

export const LESSON_ICON: Record<string, Icon> = {
  valori: Coins,
  raggi: MapTrifold,
  presa: Target,
  occhio: Eye,
  matto1: Crown,
  principi: RocketLaunch,
  italiana: Pizza,
  arrocco: CastleTurret,
  barbiere: Scissors,
  forchetta: ForkKnife,
  inchiodatura: PushPin,
  infilata: Lightning,
  promozione: Medal,
  stallo: Handshake,
  duetorri: Stairs,
  colonna: Columns,
  passato: Footprints,
  alfieri: Church,
  pedoni: TreeStructure,
  sicurezza: ShieldCheck,
  piano: Path,
}

export const THEME_ICON: Record<string, Icon> = {
  mate1: Crown,
  mate2: Stairs,
  free: Gift,
  fork: ForkKnife,
  tactic: Diamond,
  backrank: CastleTurret,
  matepat: Skull,
  pin: PushPin,
  skewer: Lightning,
  discover: Sparkle,
  defend: ShieldCheck,
  endgame: FlagCheckered,
}

export const TONE_ICON = { gentle: Smiley, spicy: Pepper, ruthless: SmileyAngry }

export function LessonIcon({ id, size = 26 }: { id: string; size?: number }) {
  const I = LESSON_ICON[id] ?? Crown
  return <I size={size} weight="duotone" />
}

export function ThemeIcon({ id, size = 22 }: { id: string; size?: number }) {
  const I = THEME_ICON[id] ?? Diamond
  return <I size={size} weight="duotone" />
}
