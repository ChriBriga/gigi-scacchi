import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './styles.css'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { initSync } from './sync/cloud'
import { initPerf } from './perf'
import { ensureVoice } from './coach/lines'
import { currentCoach } from './store'

// il livello degli effetti (Leggero/Normale/Spettacolare) va applicato prima del primo disegno
initPerf()

// con registerType 'autoUpdate' la pagina si ricarica da sola quando c'è una versione nuova
registerSW({ immediate: true })

// se avevi già collegato Google, la sincronizzazione riparte da sola
initSync()

// la voce del coach in uso si carica prima del primo disegno (è un file piccolo, anche offline dalla cache)
void ensureVoice(currentCoach()).finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
