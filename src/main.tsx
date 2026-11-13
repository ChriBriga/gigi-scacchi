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
import { toast } from './ui/Toast'
import { initNet } from './net'

// il livello degli effetti (Leggero/Normale/Spettacolare) va applicato prima del primo disegno
initPerf()

initNet()

// con registerType 'prompt' la pagina NON si ricarica da sola: compare un avviso e si aggiorna quando vuoi
const updateApp = registerSW({
  immediate: true,
  onNeedRefresh() {
    showUpdateToast()
  },
  onOfflineReady() {
    toast('Pronta anche senza rete.', 'ok', 4000)
  },
})
function showUpdateToast() {
  toast('Nuova versione pronta', 'info', 0, { label: 'Aggiorna', onClick: () => void updateApp(true) })
}

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
