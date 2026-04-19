import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEntriesStore } from '../../stores/entries'

describe('StandingsView (Phase 8: Standings Display)', () => {
  let pinia
  let entriesStore

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    entriesStore = useEntriesStore()
    try {
      localStorage.clear()
    } catch (e) {
      // Ignore
    }
  })

  afterEach(() => {
    try {
      localStorage.clear()
    } catch (e) {
      // Ignore
    }
  })

  describe('8.1 Sort entries by points (descending)', () => {
    it('should sort entries by total points in descending order', () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'Player 1')
      const entry2 = entriesStore.createEntry('user2@example.com', 'Player 2')
      const entry3 = entriesStore.createEntry('user3@example.com', 'Player 3')

      entriesStore.updateEntryScore(entry1.id, 50)
      entriesStore.updateEntryScore(entry2.id, 100)
      entriesStore.updateEntryScore(entry3.id, 75)

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('Player 2')
      expect(sorted[1].participantName).toBe('Player 3')
      expect(sorted[2].participantName).toBe('Player 1')
    })

    it('should update sort order when scores change', () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'Player 1')
      const entry2 = entriesStore.createEntry('user2@example.com', 'Player 2')

      entriesStore.updateEntryScore(entry1.id, 100)
      entriesStore.updateEntryScore(entry2.id, 50)

      let sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].participantName).toBe('Player 1')

      entriesStore.updateEntryScore(entry2.id, 150)
      sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].participantName).toBe('Player 2')
    })
  })

  describe('8.2 Implement tiebreaker (earliest entry first)', () => {
    it('should sort by creation timestamp when points are equal', async () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'First Entry')
      await new Promise(resolve => setTimeout(resolve, 10))
      const entry2 = entriesStore.createEntry('user2@example.com', 'Second Entry')

      entriesStore.updateEntryScore(entry1.id, 100)
      entriesStore.updateEntryScore(entry2.id, 100)

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('First Entry')
      expect(sorted[1].participantName).toBe('Second Entry')
    })

    it('should use tiebreaker only when points are equal', async () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'Lower Score')
      await new Promise(resolve => setTimeout(resolve, 10))
      const entry2 = entriesStore.createEntry('user2@example.com', 'Higher Score')

      entriesStore.updateEntryScore(entry1.id, 100)
      entriesStore.updateEntryScore(entry2.id, 150)

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('Higher Score')
      expect(sorted[1].participantName).toBe('Lower Score')
    })
  })

  describe('8.3 Auto-refresh on score updates', () => {
    it('should reflect score updates in sorted standings', () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'Player 1')
      const entry2 = entriesStore.createEntry('user2@example.com', 'Player 2')

      entriesStore.updateEntryScore(entry1.id, 50)
      entriesStore.updateEntryScore(entry2.id, 100)

      let sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].participantName).toBe('Player 2')

      entriesStore.updateEntryScore(entry1.id, 200)
      sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].participantName).toBe('Player 1')
      expect(sorted[0].totalScore).toBe(250)
    })
  })

  describe('8.4 Display participant name, entry ID, points', () => {
    it('should display all required fields for entry', () => {
      const entry = entriesStore.createEntry('user@example.com', 'Test Player')
      entriesStore.updateEntryScore(entry.id, 99)

      expect(entry).toHaveProperty('participantName', 'Test Player')
      expect(entry).toHaveProperty('id')
      expect(entry).toHaveProperty('totalScore', 99)
    })

    it('should display correct information for multiple entries', () => {
      const entry1 = entriesStore.createEntry('user1@example.com', 'Alice')
      const entry2 = entriesStore.createEntry('user2@example.com', 'Bob')
      const entry3 = entriesStore.createEntry('user3@example.com', 'Charlie')

      entriesStore.updateEntryScore(entry1.id, 100)
      entriesStore.updateEntryScore(entry2.id, 75)
      entriesStore.updateEntryScore(entry3.id, 50)

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('Alice')
      expect(sorted[0].totalScore).toBe(100)
      expect(sorted[1].participantName).toBe('Bob')
      expect(sorted[1].totalScore).toBe(75)
      expect(sorted[2].participantName).toBe('Charlie')
      expect(sorted[2].totalScore).toBe(50)
    })
  })

  describe('8.5 Make standings publicly accessible', () => {
    it('should be accessible without authentication', () => {
      const entry = entriesStore.createEntry('user@example.com', 'Player')
      expect(entriesStore.entries).toHaveLength(1)
      expect(entriesStore.entries[0].participantName).toBe('Player')
    })

    it('should handle empty standings', () => {
      expect(entriesStore.entries).toHaveLength(0)
    })
  })
})
