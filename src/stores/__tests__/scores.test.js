import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useScoresStore } from '../scores'

describe('Scores Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Scoring Event Creation', () => {
    it('should add scoring event with auto-generated ID', () => {
      const store = useScoresStore()
      store.addScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1
      })

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
      store.addScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1,
        affectedEntries: ['entry1', 'entry2']
      })

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

  describe('Hydration', () => {
    it('should hydrate scoring events from API data', () => {
      const store = useScoresStore()
      store.hydrateFromData([
        { id: 'score-1', playerName: 'Player A', points: 5, createdAt: '2025-01-01T00:00:00Z' }
      ])
      expect(store.scoringEvents).toHaveLength(1)
      expect(store.scoringEvents[0].playerName).toBe('Player A')
    })
  })
})
