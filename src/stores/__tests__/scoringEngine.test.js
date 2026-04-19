import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoringEngineStore } from '../scoringEngine'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Scoring Engine (Tasks 5.1-5.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Safely clear localStorage
    try {
      const keys = ['entries', 'participants', 'scores', 'scoringEvents', 'processedEventIds']
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

  describe('Task 5.1: Scoring Rules Implementation', () => {
    it('should award 1 point for a goal', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      // Create entry with player
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      // Process goal event
      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result).toBeDefined()
      expect(result.pointsAwarded).toBe(1)
      expect(result.eventType).toBe('goal')

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should award 1 point for an assist', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const event = {
        playerId: 'player1',
        eventType: 'assist',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result.pointsAwarded).toBe(1)
      expect(result.eventType).toBe('assist')

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should award 1 point for a win', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['goalie1', 'player2', 'player3'])

      const event = {
        playerId: 'goalie1',
        eventType: 'win',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result.pointsAwarded).toBe(1)
      expect(result.eventType).toBe('win')

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should award 3 points total for a shutout (1 for win + 2 additional)', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['goalie1', 'player2', 'player3'])

      const event = {
        playerId: 'goalie1',
        eventType: 'shutout',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result.pointsAwarded).toBe(3)
      expect(result.eventType).toBe('shutout')

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(3)
    })

    it('should have correct SCORING_RULES constant', () => {
      const scoringEngine = useScoringEngineStore()

      expect(scoringEngine.SCORING_RULES.goal).toBe(1)
      expect(scoringEngine.SCORING_RULES.assist).toBe(1)
      expect(scoringEngine.SCORING_RULES.win).toBe(1)
      expect(scoringEngine.SCORING_RULES.shutout).toBe(2)
    })

    it('should calculate points correctly for each event type', () => {
      const scoringEngine = useScoringEngineStore()

      expect(scoringEngine.calculatePoints('goal')).toBe(1)
      expect(scoringEngine.calculatePoints('assist')).toBe(1)
      expect(scoringEngine.calculatePoints('win')).toBe(1)
      expect(scoringEngine.calculatePoints('shutout')).toBe(2)
      expect(scoringEngine.calculatePoints('invalid')).toBe(0)
    })
  })

  describe('Task 5.2: Scoring Event Processor', () => {
    it('should process scoring event and update entry score', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result).toBeDefined()
      expect(result.playerId).toBe('player1')
      expect(result.eventType).toBe('goal')
      expect(result.pointsAwarded).toBe(1)
      expect(result.affectedEntries).toContain(entry.id)
    })

    it('should affect multiple entries with same player', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry1.id, ['player1', 'player2', 'player3'])

      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      entriesStore.setEntryPlayers(entry2.id, ['player1', 'player4', 'player5'])

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result.affectedEntries).toHaveLength(2)
      expect(result.affectedEntries).toContain(entry1.id)
      expect(result.affectedEntries).toContain(entry2.id)

      const updated1 = entriesStore.getEntry(entry1.id)
      const updated2 = entriesStore.getEntry(entry2.id)

      expect(updated1.totalScore).toBe(1)
      expect(updated2.totalScore).toBe(1)
    })

    it('should not affect entries without the player', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry1.id, ['player1', 'player2', 'player3'])

      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      entriesStore.setEntryPlayers(entry2.id, ['player4', 'player5', 'player6'])

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result.affectedEntries).toHaveLength(1)
      expect(result.affectedEntries).toContain(entry1.id)

      const updated1 = entriesStore.getEntry(entry1.id)
      const updated2 = entriesStore.getEntry(entry2.id)

      expect(updated1.totalScore).toBe(1)
      expect(updated2.totalScore).toBe(0)
    })

    it('should return null if player not in any entry', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      entriesStore.createEntry('john@example.com', 'John Doe')

      const event = {
        playerId: 'nonexistent-player',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      const result = scoringEngine.processScoringEvent(event)

      expect(result).toBeNull()
    })
  })

  describe('Task 5.3: Prevent Double-Counting of Events', () => {
    it('should prevent processing the same event twice', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      }

      // Process event first time
      const result1 = scoringEngine.processScoringEvent(event)
      expect(result1).toBeDefined()

      // Try to process same event again
      const result2 = scoringEngine.processScoringEvent(event)
      expect(result2).toBeNull()

      // Score should only increase by 1, not 2
      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(1)
    })

    it('should track processed events by playerId-eventType-timestamp', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const timestamp = '2024-01-01T12:00:00Z'

      // Process goal event
      const goalEvent = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp
      }
      scoringEngine.processScoringEvent(goalEvent)

      // Process assist event for same player and timestamp (different event type)
      const assistEvent = {
        playerId: 'player1',
        eventType: 'assist',
        timestamp
      }
      const result = scoringEngine.processScoringEvent(assistEvent)

      // Should process because event type is different
      expect(result).toBeDefined()

      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.totalScore).toBe(2)
    })

    it('should persist processed events across store instances', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      }

      // Process event
      scoringEngine.processScoringEvent(event)

      // Load processed events
      scoringEngine.loadProcessedEvents()

      // Try to process same event again
      const result = scoringEngine.processScoringEvent(event)
      expect(result).toBeNull()
    })
  })

  describe('Task 5.4: Update Entry Scores', () => {
    it('should update entry totalScore immediately', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      expect(entry.totalScore).toBe(0)

      const event = {
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      }

      scoringEngine.processScoringEvent(event)

      const updated = entriesStore.getEntry(entry.id)
      expect(updated.totalScore).toBe(1)
    })

    it('should accumulate multiple scoring events', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      // Process goal
      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      })

      // Process assist
      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'assist',
        timestamp: '2024-01-01T12:05:00Z'
      })

      // Process another goal
      scoringEngine.processScoringEvent({
        playerId: 'player2',
        eventType: 'goal',
        timestamp: '2024-01-01T12:10:00Z'
      })

      const updated = entriesStore.getEntry(entry.id)
      expect(updated.totalScore).toBe(3)
    })

    it('should persist score updates to storage', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      })

      // Verify stored in localStorage
      const stored = JSON.parse(localStorage.getItem('entries'))
      expect(stored[0].totalScore).toBe(1)
    })

    it('should handle shutout scoring correctly (3 points total)', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['goalie1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'goalie1',
        eventType: 'shutout',
        timestamp: new Date().toISOString()
      })

      const updated = entriesStore.getEntry(entry.id)
      expect(updated.totalScore).toBe(3)
    })
  })

  describe('Task 5.5: Log Scoring Events', () => {
    it('should log scoring event with timestamp', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      const beforeTime = new Date().getTime()

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      })

      const afterTime = new Date().getTime()

      const events = scoresStore.getScoringEvents()
      expect(events).toHaveLength(1)

      const loggedEvent = events[0]
      expect(loggedEvent.timestamp).toBeDefined()
      const eventTime = new Date(loggedEvent.timestamp).getTime()
      expect(eventTime).toBeGreaterThanOrEqual(beforeTime)
      expect(eventTime).toBeLessThanOrEqual(afterTime)
    })

    it('should log event with affected entries', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry1.id, ['player1', 'player2', 'player3'])

      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      entriesStore.setEntryPlayers(entry2.id, ['player1', 'player4', 'player5'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      })

      const events = scoresStore.getScoringEvents()
      const loggedEvent = events[0]

      expect(loggedEvent.affectedEntries).toHaveLength(2)
      expect(loggedEvent.affectedEntries).toContain(entry1.id)
      expect(loggedEvent.affectedEntries).toContain(entry2.id)
    })

    it('should log event with correct event details', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      })

      const events = scoresStore.getScoringEvents()
      const loggedEvent = events[0]

      expect(loggedEvent.playerId).toBe('player1')
      expect(loggedEvent.eventType).toBe('goal')
      expect(loggedEvent.pointsAwarded).toBe(1)
    })

    it('should log multiple events separately', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      })

      scoringEngine.processScoringEvent({
        playerId: 'player2',
        eventType: 'assist',
        timestamp: '2024-01-01T12:05:00Z'
      })

      const events = scoresStore.getScoringEvents()
      expect(events).toHaveLength(2)

      expect(events[0].playerId).toBe('player1')
      expect(events[0].eventType).toBe('goal')

      expect(events[1].playerId).toBe('player2')
      expect(events[1].eventType).toBe('assist')
    })

    it('should persist scoring events to storage', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: new Date().toISOString()
      })

      const stored = JSON.parse(localStorage.getItem('scoringEvents'))
      expect(stored).toHaveLength(1)
      expect(stored[0].playerId).toBe('player1')
      expect(stored[0].eventType).toBe('goal')
    })

    it('should generate unique event IDs', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      })

      scoringEngine.processScoringEvent({
        playerId: 'player2',
        eventType: 'assist',
        timestamp: '2024-01-01T12:05:00Z'
      })

      const events = scoresStore.getScoringEvents()
      expect(events[0].id).toBeDefined()
      expect(events[1].id).toBeDefined()
      expect(events[0].id).not.toBe(events[1].id)
    })
  })

  describe('Integration: Complete Scoring Workflow', () => {
    it('should handle complete scoring workflow', () => {
      const scoringEngine = useScoringEngineStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      // Create entries
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry1.id, ['player1', 'player2', 'goalie1'])

      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      entriesStore.setEntryPlayers(entry2.id, ['player1', 'player3', 'goalie2'])

      // Process multiple events
      scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      })

      scoringEngine.processScoringEvent({
        playerId: 'player2',
        eventType: 'assist',
        timestamp: '2024-01-01T12:05:00Z'
      })

      scoringEngine.processScoringEvent({
        playerId: 'goalie1',
        eventType: 'shutout',
        timestamp: '2024-01-01T12:10:00Z'
      })

      // Verify scores
      const updated1 = entriesStore.getEntry(entry1.id)
      const updated2 = entriesStore.getEntry(entry2.id)

      expect(updated1.totalScore).toBe(5) // 1 (goal) + 1 (assist) + 3 (shutout)
      expect(updated2.totalScore).toBe(1) // 1 (goal)

      // Verify logging
      const events = scoresStore.getScoringEvents()
      expect(events).toHaveLength(3)

      // Verify no double-counting
      const duplicateGoal = scoringEngine.processScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        timestamp: '2024-01-01T12:00:00Z'
      })
      expect(duplicateGoal).toBeNull()

      const finalEntry1 = entriesStore.getEntry(entry1.id)
      expect(finalEntry1.totalScore).toBe(5) // Should not increase
    })
  })
})
