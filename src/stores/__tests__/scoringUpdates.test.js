import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoringUpdatesStore } from '../scoringUpdates'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Scoring Updates (Tasks 6.1-6.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    try {
      const keys = ['entries', 'participants', 'scores', 'scoringEvents', 'scoringUpdateLogs', 'processedEventIds']
      for (const key of keys) {
        try {
          localStorage.removeItem(key)
        } catch (e) {
          // Ignore
        }
      }
      localStorage.clear()
    } catch (e) {
      // Ignore localStorage errors
    }
  })

  afterEach(() => {
    try {
      localStorage.clear()
    } catch (e) {
      // Ignore
    }
  })

  describe('Task 6.1: Create text input component for scoring updates', () => {
    it('should provide a store for handling scoring updates', () => {
      const store = useScoringUpdatesStore()
      expect(store).toBeDefined()
      expect(store.parseScoringInput).toBeDefined()
      expect(store.validateScoringData).toBeDefined()
      expect(store.processScoringUpdates).toBeDefined()
      expect(store.logScoringUpdate).toBeDefined()
    })

    it('should initialize with empty scoring update logs', () => {
      const store = useScoringUpdatesStore()
      expect(store.scoringUpdateLogs).toEqual([])
    })

    it('should have valid event types defined', () => {
      const store = useScoringUpdatesStore()
      expect(store.VALID_EVENT_TYPES).toContain('goal')
      expect(store.VALID_EVENT_TYPES).toContain('assist')
      expect(store.VALID_EVENT_TYPES).toContain('win')
      expect(store.VALID_EVENT_TYPES).toContain('shutout')
    })

    it('should have correct points mapping', () => {
      const store = useScoringUpdatesStore()
      expect(store.POINTS_MAP.goal).toBe(1)
      expect(store.POINTS_MAP.assist).toBe(1)
      expect(store.POINTS_MAP.win).toBe(1)
      expect(store.POINTS_MAP.shutout).toBe(3)
    })
  })

  describe('Task 6.2: Implement scoring update parsing', () => {
    it('should parse "Player Name: goal" format', () => {
      const store = useScoringUpdatesStore()
      const input = 'Connor McDavid: goal'
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[0].eventType).toBe('goal')
    })

    it('should parse "Player Name: assist" format', () => {
      const store = useScoringUpdatesStore()
      const input = 'Leon Draisaitl: assist'
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Leon Draisaitl')
      expect(result[0].eventType).toBe('assist')
    })

    it('should parse multiple scoring updates separated by newlines', () => {
      const store = useScoringUpdatesStore()
      const input = `Connor McDavid: goal
Leon Draisaitl: assist
Evan Bouchard: win`
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(3)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[0].eventType).toBe('goal')
      expect(result[1].playerName).toBe('Leon Draisaitl')
      expect(result[1].eventType).toBe('assist')
      expect(result[2].playerName).toBe('Evan Bouchard')
      expect(result[2].eventType).toBe('win')
    })

    it('should handle various whitespace formats', () => {
      const store = useScoringUpdatesStore()
      const input = '  Connor McDavid  :  goal  '
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[0].eventType).toBe('goal')
    })

    it('should handle case-insensitive event types', () => {
      const store = useScoringUpdatesStore()
      const input = 'Connor McDavid: GOAL'
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(1)
      expect(result[0].eventType).toBe('goal')
    })

    it('should handle shutout event type', () => {
      const store = useScoringUpdatesStore()
      const input = 'Connor Hellebuyck: shutout'
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor Hellebuyck')
      expect(result[0].eventType).toBe('shutout')
    })

    it('should skip empty lines', () => {
      const store = useScoringUpdatesStore()
      const input = `Connor McDavid: goal

Leon Draisaitl: assist`
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(2)
    })

    it('should return empty array for null input', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput(null)
      expect(result).toEqual([])
    })

    it('should return empty array for undefined input', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput(undefined)
      expect(result).toEqual([])
    })

    it('should return empty array for empty string', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput('')
      expect(result).toEqual([])
    })

    it('should ignore lines that do not match the format', () => {
      const store = useScoringUpdatesStore()
      const input = `Connor McDavid: goal
invalid line without colon
Leon Draisaitl: assist`
      const result = store.parseScoringInput(input)
      
      expect(result).toHaveLength(2)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[1].playerName).toBe('Leon Draisaitl')
    })
  })

  describe('Task 6.3: Implement scoring update validation', () => {
    it('should validate player names are non-empty strings', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: '', eventType: 'goal' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('Player name cannot be empty'))).toBe(true)
    })

    it('should validate event types are valid', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor McDavid', eventType: 'invalid' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('Invalid event type'))).toBe(true)
    })

    it('should accept valid goal event', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor McDavid', eventType: 'goal' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors).toEqual([])
    })

    it('should accept valid assist event', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Leon Draisaitl', eventType: 'assist' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors).toEqual([])
    })

    it('should accept valid win event', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor Hellebuyck', eventType: 'win' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors).toEqual([])
    })

    it('should accept valid shutout event', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor Hellebuyck', eventType: 'shutout' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors).toEqual([])
    })

    it('should validate multiple events', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor McDavid', eventType: 'goal' },
        { playerName: '', eventType: 'assist' },
        { playerName: 'Leon Draisaitl', eventType: 'invalid' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(errors.length).toBeGreaterThan(0)
    })

    it('should return error for non-array input', () => {
      const store = useScoringUpdatesStore()
      const errors = store.validateScoringData('not an array')
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('must be an array')
    })

    it('should validate scoring data format', () => {
      const store = useScoringUpdatesStore()
      const events = [
        { playerName: 'Connor McDavid', eventType: 'goal' }
      ]
      const errors = store.validateScoringData(events)
      
      expect(Array.isArray(errors)).toBe(true)
    })
  })

  describe('Task 6.4: Process scoring updates and apply to entries', () => {
    it('should process scoring updates and apply to matching entries', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      // Create entry with players
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid', 'Leon Draisaitl'])

      // Process scoring update
      const events = [
        { playerName: 'Connor McDavid', eventType: 'goal' }
      ]
      const result = store.processScoringUpdates(events)

      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[0].eventType).toBe('goal')
      expect(result[0].points).toBe(1)
      expect(result[0].entriesAffected).toBe(1)
      expect(result[0].success).toBe(true)

      // Verify entry score was updated
      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should apply correct points for goal event', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const events = [{ playerName: 'Connor McDavid', eventType: 'goal' }]
      store.processScoringUpdates(events)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should apply correct points for assist event', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Leon Draisaitl'])

      const events = [{ playerName: 'Leon Draisaitl', eventType: 'assist' }]
      store.processScoringUpdates(events)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should apply correct points for win event', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor Hellebuyck'])

      const events = [{ playerName: 'Connor Hellebuyck', eventType: 'win' }]
      store.processScoringUpdates(events)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should apply correct points for shutout event (3 points)', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor Hellebuyck'])

      const events = [{ playerName: 'Connor Hellebuyck', eventType: 'shutout' }]
      store.processScoringUpdates(events)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(3)
    })

    it('should apply updates to multiple entries with same player', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      // Create two entries with same player
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry1.id, ['Connor McDavid'])

      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      entriesStore.setEntryPlayerNames(entry2.id, ['Connor McDavid'])

      const events = [{ playerName: 'Connor McDavid', eventType: 'goal' }]
      const result = store.processScoringUpdates(events)

      expect(result[0].entriesAffected).toBe(2)

      const updatedEntry1 = entriesStore.getEntry(entry1.id)
      const updatedEntry2 = entriesStore.getEntry(entry2.id)
      expect(updatedEntry1.totalScore).toBe(1)
      expect(updatedEntry2.totalScore).toBe(1)
    })

    it('should handle case-insensitive player name matching', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const events = [{ playerName: 'connor mcdavid', eventType: 'goal' }]
      const result = store.processScoringUpdates(events)

      expect(result[0].success).toBe(true)
      expect(result[0].entriesAffected).toBe(1)
    })

    it('should return failure when player not found in any entry', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const events = [{ playerName: 'Unknown Player', eventType: 'goal' }]
      const result = store.processScoringUpdates(events)

      expect(result[0].success).toBe(false)
      expect(result[0].entriesAffected).toBe(0)
      expect(result[0].reason).toContain('No entries found')
    })

    it('should process multiple scoring updates', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid', 'Leon Draisaitl'])

      const events = [
        { playerName: 'Connor McDavid', eventType: 'goal' },
        { playerName: 'Leon Draisaitl', eventType: 'assist' }
      ]
      const result = store.processScoringUpdates(events)

      expect(result).toHaveLength(2)
      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(2)
    })
  })

  describe('Task 6.5: Log scoring updates with timestamp', () => {
    it('should log scoring updates with timestamp', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      const logEntry = store.logScoringUpdate(update)

      expect(logEntry).toBeDefined()
      expect(logEntry.playerName).toBe('Connor McDavid')
      expect(logEntry.eventType).toBe('goal')
      expect(logEntry.pointsAwarded).toBe(1)
      expect(logEntry.timestamp).toBeDefined()
      expect(new Date(logEntry.timestamp)).toBeInstanceOf(Date)
    })

    it('should include all required fields in log entry', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 2,
        success: true
      }

      const logEntry = store.logScoringUpdate(update)

      expect(logEntry.id).toBeDefined()
      expect(logEntry.playerName).toBe('Connor McDavid')
      expect(logEntry.eventType).toBe('goal')
      expect(logEntry.pointsAwarded).toBe(1)
      expect(logEntry.entriesAffected).toBe(2)
      expect(logEntry.timestamp).toBeDefined()
      expect(logEntry.success).toBe(true)
    })

    it('should store logs in scoringUpdateLogs', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store.logScoringUpdate(update)

      expect(store.scoringUpdateLogs).toHaveLength(1)
      expect(store.scoringUpdateLogs[0].playerName).toBe('Connor McDavid')
    })

    it('should log multiple scoring updates', () => {
      const store = useScoringUpdatesStore()

      const update1 = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      const update2 = {
        playerName: 'Leon Draisaitl',
        eventType: 'assist',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store.logScoringUpdate(update1)
      store.logScoringUpdate(update2)

      expect(store.scoringUpdateLogs).toHaveLength(2)
    })

    it('should persist logs to localStorage', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store.logScoringUpdate(update)

      const stored = localStorage.getItem('scoringUpdateLogs')
      expect(stored).toBeDefined()
      const parsed = JSON.parse(stored)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
    })

    it('should retrieve scoring update logs', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store.logScoringUpdate(update)
      const logs = store.getScoringUpdateLogs()

      expect(logs).toHaveLength(1)
      expect(logs[0].playerName).toBe('Connor McDavid')
    })

    it('should load logs from localStorage on startup', () => {
      const store1 = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store1.logScoringUpdate(update)

      // Create new store instance (simulating app restart)
      const store2 = useScoringUpdatesStore()
      store2.loadLogsFromStorage()

      expect(store2.scoringUpdateLogs).toHaveLength(1)
      expect(store2.scoringUpdateLogs[0].playerName).toBe('Connor McDavid')
    })

    it('should clear scoring update logs', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      }

      store.logScoringUpdate(update)
      expect(store.scoringUpdateLogs).toHaveLength(1)

      store.clearScoringUpdateLogs()
      expect(store.scoringUpdateLogs).toHaveLength(0)
    })

    it('should log failed scoring updates with reason', () => {
      const store = useScoringUpdatesStore()

      const update = {
        playerName: 'Unknown Player',
        eventType: 'goal',
        points: 1,
        entriesAffected: 0,
        success: false,
        reason: 'No entries found with this player'
      }

      const logEntry = store.logScoringUpdate(update)

      expect(logEntry.success).toBe(false)
      expect(logEntry.reason).toBe('No entries found with this player')
    })
  })

  describe('Integration: Full scoring update workflow', () => {
    it('should parse, validate, process, and log scoring updates', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      // Create entry with players
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid', 'Leon Draisaitl'])

      // Parse input
      const input = `Connor McDavid: goal
Leon Draisaitl: assist`
      const parsed = store.parseScoringInput(input)
      expect(parsed).toHaveLength(2)

      // Validate
      const errors = store.validateScoringData(parsed)
      expect(errors).toHaveLength(0)

      // Process
      const results = store.processScoringUpdates(parsed)
      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)

      // Log
      results.forEach(result => {
        store.logScoringUpdate(result)
      })

      // Verify
      const logs = store.getScoringUpdateLogs()
      expect(logs).toHaveLength(2)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(2)
    })

    it('should handle mixed success and failure in batch processing', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const input = `Connor McDavid: goal
Unknown Player: assist`
      const parsed = store.parseScoringInput(input)
      const results = store.processScoringUpdates(parsed)

      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)

      results.forEach(result => {
        store.logScoringUpdate(result)
      })

      const logs = store.getScoringUpdateLogs()
      expect(logs).toHaveLength(2)
      expect(logs[0].success).toBe(true)
      expect(logs[1].success).toBe(false)
    })
  })
})
