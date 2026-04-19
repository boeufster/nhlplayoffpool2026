import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScoresStore = defineStore('scores', () => {
  const scoringEvents = ref([])

  const hydrateFromData = (scoringEventsArray) => {
    scoringEvents.value = scoringEventsArray
  }

  const addScoringEvent = (event) => {
    scoringEvents.value.push({
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    })
  }

  const getScoringEvents = () => {
    return scoringEvents.value
  }

  return {
    scoringEvents,
    hydrateFromData,
    addScoringEvent,
    getScoringEvents
  }
})
