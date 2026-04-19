import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'
import { useScoringEngineStore } from '../scoringEngine'

describe('Store Implementation Verification', () => {
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

  describe('Participants Store', () => {
    it('should have all required methods', () => {
      const store = useParticipantsStore()
      expect(typeof store.addParticipant).toBe('function')
      expect(typeof store.removeParticipant).toBe('function')
      expect(typeof store.getParticipant).toBe('function')
      expect(typeof store.loadFromStorage).toBe('function')
    })

    it('should have participants state', () => {
      const store = useParticipantsStore()
      expect(Array.isArray(store.participants)).toBe(true)
    })
  })

  describe('Entries Store', () => {
    it('should have all required methods', () => {
      const store = useEntriesStore()
      expect(typeof store.createEntry).toBe('function')
      expect(typeof store.removeEntry).toBe('function')
      expect(typeof store.getEntry).toBe('function')
      expect(typeof store.updateEntryScore).toBe('function')
      expect(typeof store.setEntryPlayers).toBe('function')
      expect(typeof store.loadFromStorage).toBe('function')
    })

    it('should have entries state', () => {
      const store = useEntriesStore()
      expect(Array.isArray(store.entries)).toBe(true)
    })
  })

  describe('Scores Store', () => {
    it('should have all required methods', () => {
      const store = useScoresStore()
      expect(typeof store.addScoringEvent).toBe('function')
      expect(typeof store.getScoringEvents).toBe('function')
      expect(typeof store.loadFromStorage).toBe('function')
    })

    it('should have scoringEvents state', () => {
      const store = useScoresStore()
      expect(Array.isArray(store.scoringEvents)).toBe(true)
    })
  })

  describe('Scoring Engine Store', () => {
    it('should have all required methods', () => {
      const store = useScoringEngineStore()
      expect(typeof store.calculatePoints).toBe('function')
      expect(typeof store.processScoringEvent).toBe('function')
      expect(typeof store.loadProcessedEvents).toBe('function')
    })

    it('should have SCORING_RULES constant', () => {
      const store = useScoringEngineStore()
      expect(store.SCORING_RULES).toBeDefined()
      expect(store.SCORING_RULES.goal).toBe(1)
      expect(store.SCORING_RULES.assist).toBe(1)
      expect(store.SCORING_RULES.win).toBe(1)
      expect(store.SCORING_RULES.shutout).toBe(2)
    })
  })
})
