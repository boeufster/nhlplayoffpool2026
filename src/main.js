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
