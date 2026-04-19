import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoringUpdatesStore } from '../scoringUpdates'
import { useEntriesStore } from '../entries'

describe('Scoring Updates Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Store Initialization', () => {
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

  describe('Scoring Update Parsing', () => {
    it('should parse "Player Name: goal" format', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput('Connor McDavid: goal')
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor McDavid')
      expect(result[0].eventType).toBe('goal')
    })

    it('should parse multiple scoring updates separated by newlines', () => {
      const store = useScoringUpdatesStore()
      const input = `Connor McDavid: goal\nLeon Draisaitl: assist\nEvan Bouchard: win`
      const result = store.parseScoringInput(input)
      expect(result).toHaveLength(3)
    })

    it('should handle various whitespace formats', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput('  Connor McDavid  :  goal  ')
      expect(result).toHaveLength(1)
      expect(result[0].playerName).toBe('Connor McDavid')
    })

    it('should handle case-insensitive event types', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput('Connor McDavid: GOAL')
      expect(result).toHaveLength(1)
      expect(result[0].eventType).toBe('goal')
    })

    it('should skip empty lines', () => {
      const store = useScoringUpdatesStore()
      const result = store.parseScoringInput('Connor McDavid: goal\n\nLeon Draisaitl: assist')
      expect(result).toHaveLength(2)
    })

    it('should return empty array for null/undefined/empty input', () => {
      const store = useScoringUpdatesStore()
      expect(store.parseScoringInput(null)).toEqual([])
      expect(store.parseScoringInput(undefined)).toEqual([])
      expect(store.parseScoringInput('')).toEqual([])
    })
  })

  describe('Scoring Update Validation', () => {
    it('should validate player names are non-empty strings', () => {
      const store = useScoringUpdatesStore()
      const errors = store.validateScoringData([{ playerName: '', eventType: 'goal' }])
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('Player name cannot be empty'))).toBe(true)
    })

    it('should validate event types are valid', () => {
      const store = useScoringUpdatesStore()
      const errors = store.validateScoringData([{ playerName: 'Player', eventType: 'invalid' }])
      expect(errors.length).toBeGreaterThan(0)
      expect(errors.some(e => e.includes('Invalid event type'))).toBe(true)
    })

    it('should accept valid events', () => {
      const store = useScoringUpdatesStore()
      const errors = store.validateScoringData([{ playerName: 'Player', eventType: 'goal' }])
      expect(errors).toEqual([])
    })

    it('should return error for non-array input', () => {
      const store = useScoringUpdatesStore()
      const errors = store.validateScoringData('not an array')
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('must be an array')
    })
  })

  describe('Process Scoring Updates', () => {
    it('should process scoring updates and apply to matching entries', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid', 'Leon Draisaitl'])

      const events = [{ playerName: 'Connor McDavid', eventType: 'goal' }]
      const result = store.processScoringUpdates(events)

      expect(result).toHaveLength(1)
      expect(result[0].success).toBe(true)
      expect(result[0].entriesAffected).toBe(1)

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should handle case-insensitive player name matching', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const result = store.processScoringUpdates([{ playerName: 'connor mcdavid', eventType: 'goal' }])
      expect(result[0].success).toBe(true)
      expect(result[0].entriesAffected).toBe(1)
    })

    it('should return failure when player not found in any entry', () => {
      const store = useScoringUpdatesStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayerNames(entry.id, ['Connor McDavid'])

      const result = store.processScoringUpdates([{ playerName: 'Unknown Player', eventType: 'goal' }])
      expect(result[0].success).toBe(false)
      expect(result[0].entriesAffected).toBe(0)
    })
  })

  describe('Logging', () => {
    it('should log scoring updates with timestamp', () => {
      const store = useScoringUpdatesStore()
      const logEntry = store.logScoringUpdate({
        playerName: 'Connor McDavid',
        eventType: 'goal',
        points: 1,
        entriesAffected: 1,
        success: true
      })

      expect(logEntry).toBeDefined()
      expect(logEntry.playerName).toBe('Connor McDavid')
      expect(logEntry.timestamp).toBeDefined()
      expect(store.scoringUpdateLogs).toHaveLength(1)
    })

    it('should retrieve and clear scoring update logs', () => {
      const store = useScoringUpdatesStore()
      store.logScoringUpdate({ playerName: 'P1', eventType: 'goal', points: 1, entriesAffected: 1, success: true })

      expect(store.getScoringUpdateLogs()).toHaveLength(1)

      store.clearScoringUpdateLogs()
      expect(store.scoringUpdateLogs).toHaveLength(0)
    })
  })

  describe('Hydration', () => {
    it('should hydrate scoring update logs from API data', () => {
      const store = useScoringUpdatesStore()
      store.hydrateFromData([
        { id: 'log-1', playerName: 'P1', points: 3, entriesAffected: 2, success: true, createdAt: '2025-01-01T00:00:00Z' }
      ])
      expect(store.scoringUpdateLogs).toHaveLength(1)
      expect(store.scoringUpdateLogs[0].playerName).toBe('P1')
    })
  })
})
