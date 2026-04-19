import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'

describe('Participants Store (Task 2.1)', () => {
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

  describe('Participant Creation', () => {
    it('should add a participant with email, name, and entryFee', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      expect(store.participants).toHaveLength(1)
      expect(store.participants[0]).toEqual({
        email: 'john@example.com',
        name: 'John Doe',
        entryFee: 20,
        createdAt: expect.any(String)
      })
    })

    it('should use email as unique identifier', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      expect(() => {
        store.addParticipant('john@example.com', 'John Smith', 20)
      }).toThrow('Participant with this email already exists')
      
      expect(store.participants).toHaveLength(1)
    })

    it('should create timestamp on participant creation', () => {
      const store = useParticipantsStore()
      const beforeTime = new Date().getTime()
      store.addParticipant('john@example.com', 'John Doe', 20)
      const afterTime = new Date().getTime()
      
      const participant = store.participants[0]
      expect(participant.createdAt).toBeDefined()
      const participantTime = new Date(participant.createdAt).getTime()
      expect(participantTime).toBeGreaterThanOrEqual(beforeTime)
      expect(participantTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('Participant Retrieval', () => {
    it('should retrieve participant by email', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      const participant = store.getParticipant('john@example.com')
      expect(participant).toBeDefined()
      expect(participant.email).toBe('john@example.com')
      expect(participant.name).toBe('John Doe')
    })

    it('should return undefined for non-existent participant', () => {
      const store = useParticipantsStore()
      const participant = store.getParticipant('nonexistent@example.com')
      expect(participant).toBeUndefined()
    })
  })

  describe('Participant Removal', () => {
    it('should remove participant by email', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      store.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      store.removeParticipant('john@example.com')
      
      expect(store.participants).toHaveLength(1)
      expect(store.participants[0].email).toBe('jane@example.com')
    })

    it('should handle removal of non-existent participant gracefully', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      expect(() => {
        store.removeParticipant('nonexistent@example.com')
      }).not.toThrow()
      
      expect(store.participants).toHaveLength(1)
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should save participants to localStorage', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      const stored = JSON.parse(localStorage.getItem('participants'))
      expect(stored).toHaveLength(1)
      expect(stored[0].email).toBe('john@example.com')
    })

    it('should load participants from localStorage', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      // Create new store instance
      const newStore = useParticipantsStore()
      newStore.participants = []
      newStore.loadFromStorage()
      
      expect(newStore.participants).toHaveLength(1)
      expect(newStore.participants[0].email).toBe('john@example.com')
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('participants', 'invalid json')
      
      const store = useParticipantsStore()
      expect(() => {
        store.loadFromStorage()
      }).not.toThrow()
      
      expect(store.participants).toEqual([])
    })
  })
})
