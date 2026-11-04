import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/fredoka'
import '@fontsource-variable/nunito'
import './styles.css'
import { App } from './App'
import { registerSW } from 'virtual:pwa-register'

// con registerType 'autoUpdate' la pagina si ricarica da sola quando c'è una versione nuova
registerSW({ immediate: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
