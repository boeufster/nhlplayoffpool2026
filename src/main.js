import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useParticipantsStore } from './stores/participants'
import { useEntriesStore } from './stores/entries'
import { useScoresStore } from './stores/scores'
import { apiService } from './services/apiService'
import { applyTheme, getStoredTheme } from './themes'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Apply saved theme
applyTheme(getStoredTheme())

// Add global styles using CSS variables
const style = document.createElement('style')
style.textContent = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: var(--bg-body); color: var(--text-primary); font-family: var(--font-family); }
  #app { background: var(--bg-app); }
  table { background: var(--bg-card); color: var(--text-primary); border-collapse: collapse; width: 100%; }
  th { background: var(--bg-card) !important; color: var(--text-secondary) !important; border-bottom: 2px solid var(--border-color) !important; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
  td { border-bottom: 1px solid var(--border-light) !important; font-size: 0.9rem; }
  tr:hover { background: var(--bg-row-hover) !important; }
  input, textarea, select { background: var(--bg-input); color: var(--text-primary); border: 1px solid var(--border-color); font-family: var(--font-family); }
  input:focus, textarea:focus, select:focus { outline: none; border-color: var(--text-heading) !important; }
  button { transition: all 0.2s; }
  .error { color: var(--error-color) !important; }
  .success { color: var(--success-color) !important; }
`
document.head.appendChild(style)

// Fetch pool data from API and hydrate stores
;(async () => {
  try {
    const data = await apiService.fetchPoolData()
    const participantsStore = useParticipantsStore()
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    participantsStore.hydrateFromData(data.participants)
    entriesStore.hydrateFromData(data.entries)
    scoresStore.hydrateFromData(data.scoringEvents)
  } catch (error) {
    console.error('Failed to load pool data from API:', error)
  }

  app.mount('#app')
})()
