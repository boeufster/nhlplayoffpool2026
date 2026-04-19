import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../entries'

describe('Entries Store (Task 2.2)', () => {
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

  describe('Entry Creation', () => {
    it('should create entry with unique ID', () => {
      const store = useEntriesStore()
      const entry1 = store.createEntry('john@example.com', 'John Doe')
      const entry2 = store.createEntry('john@example.com', 'John Doe')
      
      expect(entry1.id).not.toBe(entry2.id)
      expect(store.entries).toHaveLength(2)
    })

    it('should initialize entry with empty player selection', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      
      expect(entry.playerIds).toEqual([])
      expect(entry.totalScore).toBe(0)
    })

    it('should create entry with timestamp', () => {
      const store = useEntriesStore()
      const beforeTime = new Date().getTime()
      const entry = store.createEntry('john@example.com', 'John Doe')
      const afterTime = new Date().getTime()
      
      expect(entry.createdAt).toBeDefined()
      const entryTime = new Date(entry.createdAt).getTime()
      expect(entryTime).toBeGreaterThanOrEqual(beforeTime)
      expect(entryTime).toBeLessThanOrEqual(afterTime)
    })

    it('should allow multiple entries per participant', () => {
      const store = useEntriesStore()
      const entry1 = store.createEntry('john@example.com', 'John Doe')
      const entry2 = store.createEntry('john@example.com', 'John Doe')
      
      expect(store.entries).toHaveLength(2)
      expect(entry1.email).toBe(entry2.email)
      expect(entry1.id).not.toBe(entry2.id)
    })

    it('should store participant name with entry', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      
      expect(entry.participantName).toBe('John Doe')
    })
  })

  describe('Entry Retrieval', () => {
    it('should retrieve entry by ID', () => {
      const store = useEntriesStore()
      const created = store.createEntry('john@example.com', 'John Doe')
      
      const retrieved = store.getEntry(created.id)
      expect(retrieved).toBeDefined()
      expect(retrieved.id).toBe(created.id)
      expect(retrieved.email).toBe('john@example.com')
    })

    it('should return undefined for non-existent entry', () => {
      const store = useEntriesStore()
      const entry = store.getEntry('nonexistent-id')
      expect(entry).toBeUndefined()
    })
  })

  describe('Entry Removal', () => {
    it('should remove entry by ID', () => {
      const store = useEntriesStore()
      const entry1 = store.createEntry('john@example.com', 'John Doe')
      const entry2 = store.createEntry('jane@example.com', 'Jane Doe')
      
      store.removeEntry(entry1.id)
      
      expect(store.entries).toHaveLength(1)
      expect(store.entries[0].id).toBe(entry2.id)
    })
  })

  describe('Player Selection', () => {
    it('should set player IDs for entry', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      const playerIds = ['player1', 'player2', 'player3']
      
      store.setEntryPlayers(entry.id, playerIds)
      
      const updated = store.getEntry(entry.id)
      expect(updated.playerIds).toEqual(playerIds)
    })

    it('should replace existing player IDs', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      
      store.setEntryPlayers(entry.id, ['player1', 'player2'])
      store.setEntryPlayers(entry.id, ['player3', 'player4', 'player5'])
      
      const updated = store.getEntry(entry.id)
      expect(updated.playerIds).toEqual(['player3', 'player4', 'player5'])
    })
  })

  describe('Score Updates', () => {
    it('should update entry score', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      
      store.updateEntryScore(entry.id, 5)
      
      const updated = store.getEntry(entry.id)
      expect(updated.totalScore).toBe(5)
    })

    it('should accumulate score updates', () => {
      const store = useEntriesStore()
      const entry = store.createEntry('john@example.com', 'John Doe')
      
      store.updateEntryScore(entry.id, 5)
      store.updateEntryScore(entry.id, 3)
      store.updateEntryScore(entry.id, 2)
      
      const updated = store.getEntry(entry.id)
      expect(updated.totalScore).toBe(10)
    })
  })

  describe('LocalStorage Persistence', () => {
    it('should save entries to localStorage', () => {
      const store = useEntriesStore()
      store.createEntry('john@example.com', 'John Doe')
      
      const stored = JSON.parse(localStorage.getItem('entries'))
      expect(stored).toHaveLength(1)
      expect(stored[0].email).toBe('john@example.com')
    })

    it('should load entries from localStorage', () => {
      const store = useEntriesStore()
      const created = store.createEntry('john@example.com', 'John Doe')
      
      // Create new store instance
      const newStore = useEntriesStore()
      newStore.entries = []
      newStore.loadFromStorage()
      
      expect(newStore.entries).toHaveLength(1)
      expect(newStore.entries[0].id).toBe(created.id)
    })

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem('entries', 'invalid json')
      
      const store = useEntriesStore()
      expect(() => {
        store.loadFromStorage()
      }).not.toThrow()
      
      expect(store.entries).toEqual([])
    })
  })
})
