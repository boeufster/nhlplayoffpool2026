import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useScoresStore = defineStore('scores', () => {
  const scoringEvents = ref([])

  const addScoringEvent = (event) => {
    scoringEvents.value.push({
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    })
    saveToStorage()
  }

  const getScoringEvents = () => {
    return scoringEvents.value
  }

  const saveToStorage = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('scoringEvents', JSON.stringify(scoringEvents.value))
      }
    } catch (error) {
      console.error('Error saving scoring events to storage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('scoringEvents')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          scoringEvents.value = parsed
        }
      }
    } catch (error) {
      console.error('Error loading scoring events from storage:', error)
      try {
        localStorage.removeItem('scoringEvents')
      } catch (e) {
        console.error('Error clearing corrupted scoringEvents:', e)
      }
      scoringEvents.value = []
    }
  }

  return {
    scoringEvents,
    addScoringEvent,
    getScoringEvents,
    loadFromStorage
  }
})
