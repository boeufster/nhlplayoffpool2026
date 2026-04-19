import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Store Implementation Verification', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Participants Store', () => {
    it('should have all required methods', () => {
      const store = useParticipantsStore()
      expect(typeof store.addParticipant).toBe('function')
      expect(typeof store.removeParticipant).toBe('function')
      expect(typeof store.getParticipant).toBe('function')
      expect(typeof store.hydrateFromData).toBe('function')
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
      expect(typeof store.hydrateFromData).toBe('function')
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
      expect(typeof store.hydrateFromData).toBe('function')
    })

    it('should have scoringEvents state', () => {
      const store = useScoresStore()
      expect(Array.isArray(store.scoringEvents)).toBe(true)
    })
  })
})
