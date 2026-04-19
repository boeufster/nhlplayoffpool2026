import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useEntriesStore } from './entries'
import { useScoresStore } from './scores'

export const useScoringUpdatesStore = defineStore('scoringUpdates', () => {
  const scoringUpdateLogs = ref([])

  const VALID_EVENT_TYPES = ['goal', 'assist', 'win', 'shutout']
  const POINTS_MAP = {
    goal: 1,
    assist: 1,
    win: 1,
    shutout: 3
  }

  /**
   * Parse scoring update text in format: "Player Name: goal" or "Player Name: assist"
   * Supports various input formats and whitespace
   * Returns array of parsed scoring events
   */
  const parseScoringInput = (text) => {
    if (!text || typeof text !== 'string') {
      return []
    }

    const lines = text.split('\n').filter(line => line.trim().length > 0)
    const parsedEvents = []

    lines.forEach(line => {
      const trimmed = line.trim()
      
      // Try to match format: "Player Name: event_type"
      const colonMatch = trimmed.match(/^(.+?):\s*(\w+)$/)
      if (colonMatch) {
        const playerName = colonMatch[1].trim()
        const eventType = colonMatch[2].toLowerCase().trim()
        
        if (playerName && eventType) {
          parsedEvents.push({
            playerName,
            eventType,
            rawInput: trimmed
          })
        }
      }
    })

    return parsedEvents
  }

  /**
   * Validate player names are non-empty strings
   * Validate event types are valid (goal, assist, win, shutout)
   * Validate scoring data format
   * Returns validation errors array
   */
  const validateScoringData = (parsedEvents) => {
    const errors = []

    if (!Array.isArray(parsedEvents)) {
      errors.push('Scoring data must be an array')
      return errors
    }

    parsedEvents.forEach((event, index) => {
      // Validate player name
      if (typeof event.playerName !== 'string') {
        errors.push(`Event ${index + 1}: Player name is required and must be a string`)
      } else if (!event.playerName || event.playerName.trim().length === 0) {
        errors.push(`Event ${index + 1}: Player name cannot be empty`)
      }

      // Validate event type
      if (!event.eventType || typeof event.eventType !== 'string') {
        errors.push(`Event ${index + 1}: Event type is required and must be a string`)
      } else if (!VALID_EVENT_TYPES.includes(event.eventType.toLowerCase())) {
        errors.push(`Event ${index + 1}: Invalid event type "${event.eventType}". Must be one of: ${VALID_EVENT_TYPES.join(', ')}`)
      }
    })

    return errors
  }

  /**
   * Process scoring updates and apply to entries
   * Takes parsed scoring updates
   * Finds entries containing the player
   * Applies points to matching entries
   * Updates entry scores
   */
  const processScoringUpdates = (parsedEvents) => {
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()
    const processedUpdates = []

    parsedEvents.forEach(event => {
      const { playerName, eventType } = event
      const eventTypeNormalized = eventType.toLowerCase()
      const points = POINTS_MAP[eventTypeNormalized]

      // Find entries containing this player (by name)
      const affectedEntries = entriesStore.entries.filter(entry => {
        if (!entry.playerNames) return false
        return entry.playerNames.some(name => 
          name.toLowerCase().trim() === playerName.toLowerCase().trim()
        )
      })

      if (affectedEntries.length > 0) {
        // Update scores for affected entries
        const affectedEntryIds = []
        affectedEntries.forEach(entry => {
          entriesStore.updateEntryScore(entry.id, points)
          affectedEntryIds.push(entry.id)
        })

        // Log the update
        const scoringEvent = {
          playerName,
          eventType: eventTypeNormalized,
          pointsAwarded: points,
          affectedEntries: affectedEntryIds,
          timestamp: new Date().toISOString()
        }
        scoresStore.addScoringEvent(scoringEvent)

        processedUpdates.push({
          playerName,
          eventType: eventTypeNormalized,
          points,
          entriesAffected: affectedEntryIds.length,
          success: true
        })
      } else {
        processedUpdates.push({
          playerName,
          eventType: eventTypeNormalized,
          points,
          entriesAffected: 0,
          success: false,
          reason: 'No entries found with this player'
        })
      }
    })

    return processedUpdates
  }

  /**
   * Log scoring updates with timestamp
   * Create log entries for all scoring updates
   * Include timestamp, player name, event type, points awarded
   * Store logs in localStorage
   */
  const logScoringUpdate = (update) => {
    const logEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      playerName: update.playerName,
      eventType: update.eventType,
      pointsAwarded: update.points,
      entriesAffected: update.entriesAffected,
      timestamp: new Date().toISOString(),
      success: update.success,
      reason: update.reason || null
    }

    scoringUpdateLogs.value.push(logEntry)
    saveLogsToStorage()
    return logEntry
  }

  /**
   * Get all scoring update logs
   */
  const getScoringUpdateLogs = () => {
    return scoringUpdateLogs.value
  }

  /**
   * Clear all scoring update logs
   */
  const clearScoringUpdateLogs = () => {
    scoringUpdateLogs.value = []
    saveLogsToStorage()
  }

  /**
   * Save logs to localStorage
   */
  const saveLogsToStorage = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('scoringUpdateLogs', JSON.stringify(scoringUpdateLogs.value))
      }
    } catch (error) {
      console.error('Error saving scoring update logs to storage:', error)
    }
  }

  /**
   * Load logs from localStorage
   */
  const loadLogsFromStorage = () => {
    try {
      const stored = localStorage.getItem('scoringUpdateLogs')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          scoringUpdateLogs.value = parsed
        }
      }
    } catch (error) {
      console.error('Error loading scoring update logs from storage:', error)
      try {
        localStorage.removeItem('scoringUpdateLogs')
      } catch (e) {
        console.error('Error clearing corrupted scoringUpdateLogs:', e)
      }
      scoringUpdateLogs.value = []
    }
  }

  return {
    scoringUpdateLogs,
    VALID_EVENT_TYPES,
    POINTS_MAP,
    parseScoringInput,
    validateScoringData,
    processScoringUpdates,
    logScoringUpdate,
    getScoringUpdateLogs,
    clearScoringUpdateLogs,
    loadLogsFromStorage
  }
})
