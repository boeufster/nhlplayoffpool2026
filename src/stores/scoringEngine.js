import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEntriesStore } from './entries'
import { useScoresStore } from './scores'

export const useScoringEngineStore = defineStore('scoringEngine', () => {
  const processedEventIds = ref(new Set())

  const SCORING_RULES = {
    goal: 1,
    assist: 1,
    win: 1,
    shutout: 2 // additional points on top of win
  }

  const calculatePoints = (eventType) => {
    return SCORING_RULES[eventType] || 0
  }

  const processScoringEvent = (event) => {
    const { playerId, eventType } = event
    
    // Prevent double-counting
    const eventKey = `${playerId}-${eventType}-${event.timestamp}`
    if (processedEventIds.value.has(eventKey)) {
      return null
    }

    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    // Find all entries containing this player
    const affectedEntries = entriesStore.entries.filter(entry =>
      entry.playerIds.includes(playerId)
    )

    if (affectedEntries.length === 0) {
      return null
    }

    // Calculate points
    let points = calculatePoints(eventType)
    
    // For shutouts, add 2 additional points (total 3 with win)
    if (eventType === 'shutout') {
      points = 3
    }

    // Update scores for affected entries
    const affectedEntryIds = []
    affectedEntries.forEach(entry => {
      entriesStore.updateEntryScore(entry.id, points)
      affectedEntryIds.push(entry.id)
    })

    // Log the event
    const scoringEvent = {
      playerId,
      eventType,
      pointsAwarded: points,
      affectedEntries: affectedEntryIds,
      timestamp: new Date().toISOString()
    }
    scoresStore.addScoringEvent(scoringEvent)

    // Mark as processed
    processedEventIds.value.add(eventKey)
    saveProcessedEvents()

    return scoringEvent
  }

  const saveProcessedEvents = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('processedEventIds', JSON.stringify(Array.from(processedEventIds.value)))
      }
    } catch (error) {
      console.error('Error saving processed events:', error)
    }
  }

  const loadProcessedEvents = () => {
    try {
      const stored = localStorage.getItem('processedEventIds')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          processedEventIds.value = new Set(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading processed events:', error)
      // Clear corrupted data
      try {
        localStorage.removeItem('processedEventIds')
      } catch (e) {
        console.error('Error clearing corrupted processedEventIds:', e)
      }
      processedEventIds.value = new Set()
    }
  }

  return {
    SCORING_RULES,
    calculatePoints,
    processScoringEvent,
    loadProcessedEvents
  }
})
