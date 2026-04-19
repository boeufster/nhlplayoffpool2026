import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'

describe('Participants Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

  describe('Hydration', () => {
    it('should hydrate participants from API data', () => {
      const store = useParticipantsStore()
      store.hydrateFromData([
        { email: 'a@example.com', name: 'Alice', entryFee: 20, createdAt: '2025-01-01T00:00:00Z' }
      ])
      expect(store.participants).toHaveLength(1)
      expect(store.participants[0].name).toBe('Alice')
    })
  })
})
