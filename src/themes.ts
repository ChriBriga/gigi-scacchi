export type ThemeId = 'notte' | 'classico' | 'oceano' | 'tramonto'

export interface ThemeInfo {
  id: ThemeId
  name: string
  blurb: string
  /** colori usati solo per l'anteprima nelle impostazioni */
  preview: { bg: string; card: string; accent: string; light: string; dark: string }
  themeColor: string
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'notte',
    name: 'Notte',
    blurb: 'Viola profondo e sfumato',
    preview: { bg: 'linear-gradient(160deg,#241046,#0b0617)', card: '#2a1757', accent: '#ffc93c', light: '#e8dfff', dark: '#7d5fc9' },
    themeColor: '#0e0720',
  },
  {
    id: 'classico',
    name: 'Classico',
    blurb: 'Legno da torneo e verde',
    preview: { bg: 'linear-gradient(160deg,#26201a,#110e0b)', card: '#342b23', accent: '#9bc15a', light: '#f0d9b5', dark: '#b58863' },
    themeColor: '#14100d',
  },
  {
    id: 'oceano',
    name: 'Oceano',
    blurb: 'Blu e turchese, tutto freddo',
    preview: { bg: 'linear-gradient(160deg,#08334a,#03121c)', card: '#0e4260', accent: '#3fe0d0', light: '#dff3fa', dark: '#4f9fc4' },
    themeColor: '#04151f',
  },
  {
    id: 'tramonto',
    name: 'Tramonto',
    blurb: 'Arancio e rosa su bordeaux',
    preview: { bg: 'linear-gradient(160deg,#431228,#190710)', card: '#561a33', accent: '#ff9b47', light: '#ffe9d6', dark: '#d9745c' },
    themeColor: '#1c0812',
  },
]
