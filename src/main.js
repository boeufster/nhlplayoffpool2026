import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { useParticipantsStore } from './stores/participants'
import { useEntriesStore } from './stores/entries'
import { useScoresStore } from './stores/scores'
import { useScoringEngineStore } from './stores/scoringEngine'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Add global dark mode styles
const style = document.createElement('style')
style.textContent = `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    background: #0a0e27;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  #app {
    background: #0a0e27;
  }
  
  table {
    background: #1a1f3a;
    color: #e0e0e0;
  }
  
  th {
    background: #2a2f4a !important;
    color: #00d4ff !important;
    border-color: #c41e3a !important;
  }
  
  td {
    border-color: #2a2f4a !important;
  }
  
  tr:hover {
    background: #252a45 !important;
  }
  
  input, textarea, select {
    background: #1a1f3a;
    color: #e0e0e0;
    border-color: #2a2f4a !important;
  }
  
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: #00d4ff !important;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
  }
  
  button {
    transition: all 0.2s;
  }
  
  .error {
    color: #ff6b6b !important;
  }
  
  .success {
    color: #51cf66 !important;
  }
`
document.head.appendChild(style)

// Load data from storage on app startup
try {
  const participantsStore = useParticipantsStore()
  const entriesStore = useEntriesStore()
  const scoresStore = useScoresStore()
  const scoringEngineStore = useScoringEngineStore()

  participantsStore.loadFromStorage()
  entriesStore.loadFromStorage()
  scoresStore.loadFromStorage()
  scoringEngineStore.loadProcessedEvents()
} catch (error) {
  console.error('Error loading data from storage:', error)
}

app.mount('#app')
