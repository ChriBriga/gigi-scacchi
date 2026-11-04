import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './styles.css'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'
import { initSync } from './sync/cloud'

// con registerType 'autoUpdate' la pagina si ricarica da sola quando c'è una versione nuova
registerSW({ immediate: true })

// se avevi già collegato Google, la sincronizzazione riparte da sola
initSync()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
