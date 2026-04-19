import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../participants'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Data Persistence (Tasks 2.4 & 2.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
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

  describe('LocalStorage Persistence', () => {
    it('should persist participants across store instances', () => {
      const store1 = useParticipantsStore()
      store1.addParticipant('john@example.com', 'John Doe', 20)
      
      const store2 = useParticipantsStore()
      store2.participants = []
      store2.loadFromStorage()
      
      expect(store2.participants).toHaveLength(1)
      expect(store2.participants[0].email).toBe('john@example.com')
    })

    it('should persist entries across store instances', () => {
      const store1 = useEntriesStore()
      const entry = store1.createEntry('john@example.com', 'John Doe')
      store1.setEntryPlayers(entry.id, ['player1', 'player2'])
      store1.updateEntryScore(entry.id, 5)
      
      const store2 = useEntriesStore()
      store2.entries = []
      store2.loadFromStorage()
      
      expect(store2.entries).toHaveLength(1)
      expect(store2.entries[0].playerIds).toEqual(['player1', 'player2'])
      expect(store2.entries[0].totalScore).toBe(5)
    })

    it('should persist scoring events across store instances', () => {
      const store1 = useScoresStore()
      store1.addScoringEvent({ playerId: 'player1', eventType: 'goal', pointsAwarded: 1 })
      
      const store2 = useScoresStore()
      store2.scoringEvents = []
      store2.loadFromStorage()
      
      expect(store2.scoringEvents).toHaveLength(1)
      expect(store2.scoringEvents[0].playerId).toBe('player1')
    })
  })

  describe('Data Integrity', () => {
    it('should maintain data integrity with multiple participants and entries', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      
      entriesStore.setEntryPlayers(entry1.id, ['p1', 'p2', 'p3'])
      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 15)
      
      const newParticipantsStore = useParticipantsStore()
      const newEntriesStore = useEntriesStore()
      
      newParticipantsStore.participants = []
      newEntriesStore.entries = []
      
      newParticipantsStore.loadFromStorage()
      newEntriesStore.loadFromStorage()
      
      expect(newParticipantsStore.participants).toHaveLength(2)
      expect(newEntriesStore.entries).toHaveLength(2)
      
      const reloadedEntry1 = newEntriesStore.getEntry(entry1.id)
      expect(reloadedEntry1.playerIds).toEqual(['p1', 'p2', 'p3'])
      expect(reloadedEntry1.totalScore).toBe(10)
    })

    it('should handle empty data on first load', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()
      
      participantsStore.loadFromStorage()
      entriesStore.loadFromStorage()
      scoresStore.loadFromStorage()
      
      expect(participantsStore.participants).toEqual([])
      expect(entriesStore.entries).toEqual([])
      expect(scoresStore.scoringEvents).toEqual([])
    })
  })

  describe('Immediate Persistence', () => {
    it('should persist data immediately on creation', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.updateEntryScore(entry.id, 5)
      entriesStore.setEntryPlayers(entry.id, ['player1', 'player2'])
      
      const storedParticipants = JSON.parse(localStorage.getItem('participants'))
      const storedEntries = JSON.parse(localStorage.getItem('entries'))
      
      expect(storedParticipants).toHaveLength(1)
      expect(storedEntries).toHaveLength(1)
      expect(storedEntries[0].totalScore).toBe(5)
      expect(storedEntries[0].playerIds).toEqual(['player1', 'player2'])
    })
  })

  describe('Entry Persistence with All Data', () => {
    it('should persist entry with all participant data', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['p1', 'p2', 'p3', 'p4', 'p5'])
      entriesStore.updateEntryScore(entry.id, 25)
      
      const newEntriesStore = useEntriesStore()
      newEntriesStore.entries = []
      newEntriesStore.loadFromStorage()
      
      const reloaded = newEntriesStore.getEntry(entry.id)
      expect(reloaded.email).toBe('john@example.com')
      expect(reloaded.participantName).toBe('John Doe')
      expect(reloaded.playerIds).toEqual(['p1', 'p2', 'p3', 'p4', 'p5'])
      expect(reloaded.totalScore).toBe(25)
      expect(reloaded.createdAt).toBeDefined()
    })

    it('should persist multiple entries with different scores', () => {
      const entriesStore = useEntriesStore()
      
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      const entry3 = entriesStore.createEntry('bob@example.com', 'Bob Smith')
      
      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 20)
      entriesStore.updateEntryScore(entry3.id, 15)
      
      const newEntriesStore = useEntriesStore()
      newEntriesStore.entries = []
      newEntriesStore.loadFromStorage()
      
      expect(newEntriesStore.entries).toHaveLength(3)
      expect(newEntriesStore.getEntry(entry1.id).totalScore).toBe(10)
      expect(newEntriesStore.getEntry(entry2.id).totalScore).toBe(20)
      expect(newEntriesStore.getEntry(entry3.id).totalScore).toBe(15)
    })
  })

  describe('Score Persistence', () => {
    it('should persist scores correctly after multiple updates', () => {
      const entriesStore = useEntriesStore()
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 1)
      entriesStore.updateEntryScore(entry.id, 1)
      entriesStore.updateEntryScore(entry.id, 2)
      entriesStore.updateEntryScore(entry.id, 3)
      
      const newEntriesStore = useEntriesStore()
      newEntriesStore.entries = []
      newEntriesStore.loadFromStorage()
      
      const reloaded = newEntriesStore.getEntry(entry.id)
      expect(reloaded.totalScore).toBe(7)
    })
  })

  describe('Multiple Data Types Independence', () => {
    it('should persist all data types simultaneously', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      const scoresStore = useScoresStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.updateEntryScore(entry.id, 5)
      scoresStore.addScoringEvent({
        playerId: 'player1',
        eventType: 'goal',
        pointsAwarded: 1
      })
      
      const newParticipantsStore = useParticipantsStore()
      const newEntriesStore = useEntriesStore()
      const newScoresStore = useScoresStore()
      
      newParticipantsStore.participants = []
      newEntriesStore.entries = []
      newScoresStore.scoringEvents = []
      
      newParticipantsStore.loadFromStorage()
      newEntriesStore.loadFromStorage()
      newScoresStore.loadFromStorage()
      
      expect(newParticipantsStore.participants).toHaveLength(1)
      expect(newEntriesStore.entries).toHaveLength(1)
      expect(newScoresStore.scoringEvents).toHaveLength(1)
    })
  })

  describe('Edge Cases - Corrupted Data', () => {
    it('should handle corrupted data gracefully', () => {
      localStorage.setItem('participants', 'invalid json {')
      localStorage.setItem('entries', 'not valid json')
      localStorage.setItem('scoringEvents', '{invalid}')
      
      const pStore = useParticipantsStore()
      const eStore = useEntriesStore()
      const sStore = useScoresStore()
      
      expect(() => {
        pStore.loadFromStorage()
        eStore.loadFromStorage()
        sStore.loadFromStorage()
      }).not.toThrow()
      
      expect(pStore.participants).toEqual([])
      expect(eStore.entries).toEqual([])
      expect(sStore.scoringEvents).toEqual([])
    })
  })

  describe('Timestamp Persistence', () => {
    it('should preserve creation timestamps', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      const beforeTime = new Date().getTime()
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      const afterTime = new Date().getTime()
      
      const newParticipantsStore = useParticipantsStore()
      const newEntriesStore = useEntriesStore()
      
      newParticipantsStore.participants = []
      newEntriesStore.entries = []
      
      newParticipantsStore.loadFromStorage()
      newEntriesStore.loadFromStorage()
      
      const reloadedParticipant = newParticipantsStore.participants[0]
      const reloadedEntry = newEntriesStore.getEntry(entry.id)
      
      expect(reloadedParticipant.createdAt).toBeDefined()
      expect(reloadedEntry.createdAt).toBeDefined()
      
      const participantTime = new Date(reloadedParticipant.createdAt).getTime()
      const entryTime = new Date(reloadedEntry.createdAt).getTime()
      
      expect(participantTime).toBeGreaterThanOrEqual(beforeTime)
      expect(participantTime).toBeLessThanOrEqual(afterTime)
      expect(entryTime).toBeGreaterThanOrEqual(beforeTime)
      expect(entryTime).toBeLessThanOrEqual(afterTime)
    })
  })
})
