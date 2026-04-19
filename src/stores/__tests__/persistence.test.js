import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Store Hydration (hydrateFromData)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Participants Store Hydration', () => {
    it('should replace participants state with hydrated data', () => {
      const store = useParticipantsStore()
      store.addParticipant('old@example.com', 'Old User', 10)
      expect(store.participants).toHaveLength(1)

      store.hydrateFromData([
        { email: 'john@example.com', name: 'John Doe', entryFee: 20, createdAt: '2025-01-01T00:00:00Z' },
        { email: 'jane@example.com', name: 'Jane Doe', entryFee: 25, createdAt: '2025-01-02T00:00:00Z' }
      ])

      expect(store.participants).toHaveLength(2)
      expect(store.participants[0].email).toBe('john@example.com')
      expect(store.participants[1].email).toBe('jane@example.com')
    })

    it('should clear participants when hydrated with empty array', () => {
      const store = useParticipantsStore()
      store.addParticipant('john@example.com', 'John Doe', 20)
      expect(store.participants).toHaveLength(1)

      store.hydrateFromData([])
      expect(store.participants).toEqual([])
    })
  })

  describe('Entries Store Hydration', () => {
    it('should replace entries state with hydrated data', () => {
      const store = useEntriesStore()
      store.createEntry('old@example.com', 'Old User')
      expect(store.entries).toHaveLength(1)

      const apiEntries = [
        {
          id: 'entry-1',
          email: 'john@example.com',
          participantName: 'John Doe',
          totalScore: 10,
          playerNames: ['Player 1', 'Player 2'],
          createdAt: '2025-01-01T00:00:00Z'
        }
      ]
      store.hydrateFromData(apiEntries)

      expect(store.entries).toHaveLength(1)
      expect(store.entries[0].id).toBe('entry-1')
      expect(store.entries[0].totalScore).toBe(10)
      expect(store.entries[0].playerNames).toEqual(['Player 1', 'Player 2'])
    })

    it('should clear entries when hydrated with empty array', () => {
      const store = useEntriesStore()
      store.createEntry('john@example.com', 'John Doe')
      expect(store.entries).toHaveLength(1)

      store.hydrateFromData([])
      expect(store.entries).toEqual([])
    })
  })

  describe('Scores Store Hydration', () => {
    it('should replace scoringEvents state with hydrated data', () => {
      const store = useScoresStore()
      store.addScoringEvent({ playerId: 'old', eventType: 'goal', pointsAwarded: 1 })
      expect(store.scoringEvents).toHaveLength(1)

      const apiEvents = [
        { id: 'score-1', playerName: 'Connor McDavid', points: 12, createdAt: '2025-06-01T00:00:00Z' },
        { id: 'score-2', playerName: 'Cale Makar', points: 8, createdAt: '2025-06-01T00:00:00Z' }
      ]
      store.hydrateFromData(apiEvents)

      expect(store.scoringEvents).toHaveLength(2)
      expect(store.scoringEvents[0].playerName).toBe('Connor McDavid')
      expect(store.scoringEvents[0].points).toBe(12)
      expect(store.scoringEvents[1].playerName).toBe('Cale Makar')
    })

    it('should clear scoringEvents when hydrated with empty array', () => {
      const store = useScoresStore()
      store.addScoringEvent({ playerId: 'p1', eventType: 'goal', pointsAwarded: 1 })
      expect(store.scoringEvents).toHaveLength(1)

      store.hydrateFromData([])
      expect(store.scoringEvents).toEqual([])
    })
  })

  describe('Data Integrity After Hydration', () => {
    it('should maintain data integrity with multiple stores hydrated', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()

      participantsStore.hydrateFromData([
        { email: 'john@example.com', name: 'John Doe', entryFee: 20, createdAt: '2025-01-01T00:00:00Z' }
      ])
      entriesStore.hydrateFromData([
        { id: 'entry-1', email: 'john@example.com', participantName: 'John Doe', totalScore: 5, playerNames: ['P1'], createdAt: '2025-01-01T00:00:00Z' }
      ])
      scoresStore.hydrateFromData([
        { id: 'score-1', playerName: 'P1', points: 5, createdAt: '2025-01-01T00:00:00Z' }
      ])

      expect(participantsStore.participants).toHaveLength(1)
      expect(entriesStore.entries).toHaveLength(1)
      expect(scoresStore.scoringEvents).toHaveLength(1)
      expect(participantsStore.getParticipant('john@example.com')).toBeDefined()
      expect(entriesStore.getEntry('entry-1')).toBeDefined()
    })
  })
})
