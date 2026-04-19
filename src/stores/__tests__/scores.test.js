import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoresStore } from '../scores'

describe('Scores Store (Task 2.3)', () => {
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

  describe('Scoring Event Creation', () => {
    it('should add scoring event with auto-generated ID', () => {
      const store = useScoresStore()
      const event = {
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1
      }
      
      store.addScoringEvent(event)
      
      expect(store.scoringEvents).toHaveLength(1)
      expect(store.scoringEvents[0].id).toBeDefined()
      expect(store.scoringEvents[0].id).toMatch(/^event-/)
    })

    it('should create timestamp for scoring event', () => {
      const store = useScoresStore()
      const beforeTime = new Date().getTime()
      
      store.addScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1
      })
      
      const afterTime = new Date().getTime()
      const event = store.scoringEvents[0]
      
      expect(event.timestamp).toBeDefined()
      const eventTime = new Date(event.timestamp).getTime()
      expect(eventTime).toBeGreaterThanOrEqual(beforeTime)
      expect(eventTime).toBeLessThanOrEqual(afterTime)
    })

    it('should preserve event data', () => {
      const store = useScoresStore()
      const eventData = {
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1,
        affectedEntries: ['entry1', 'entry2']
      }
      
      store.addScoringEvent(eventData)
      
      const event = store.scoringEvents[0]
      expect(event.playerId).toBe('player1')
      expect(event.eventType).toBe('goal')
      expect(event.pointsAwarded).toBe(1)
      expect(event.affectedEntries).toEqual(['entry1', 'entry2'])
    })
  })

  describe('Scoring Event Retrieval', () => {
    it('should retrieve all scoring events', () => {
      const store = useScoresStore()
      
      store.addScoringEvent({ playerId: 'player1', eventType: 'goal', pointsAwarded: 1 })
      store.addScoringEvent({ playerId: 'player2', eventType: 'assist', pointsAwarded: 1 })
      store.addScoringEvent({ playerId: 'player3', eventType: 'win', pointsAwarded: 1 })
      
      const events = store.getScoringEvents()
      expect(events).toHaveLength(3)
    })

    it('should return empty array when no events', () => {
      const store = useScoresStore()
      const events = store.getScoringEvents()
      expect(events).toEqual([])
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should save scoring events to localStorage', () => {
      const store = useScoresStore()
      store.addScoringEvent({ playerId: 'player1', eventType: 'goal', pointsAwarded: 1 })
      
      const stored = JSON.parse(localStorage.getItem('scoringEvents'))
      expect(stored).toHaveLength(1)
      expect(stored[0].playerId).toBe('player1')
    })

    it('should load scoring events from localStorage', () => {
      const store = useScoresStore()
      store.addScoringEvent({ playerId: 'player1', eventType: 'goal', pointsAwarded: 1 })
      
      // Create new store instance
      const newStore = useScoresStore()
      newStore.scoringEvents = []
      newStore.loadFromStorage()
      
      expect(newStore.scoringEvents).toHaveLength(1)
      expect(newStore.scoringEvents[0].playerId).toBe('player1')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('scoringEvents', 'invalid json')
      
      const store = useScoresStore()
      expect(() => {
        store.loadFromStorage()
      }).not.toThrow()
      
      expect(store.scoringEvents).toEqual([])
    })
  })
})
