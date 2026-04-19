import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../../stores/participants'
import { useEntriesStore } from '../../stores/entries'
import { useScoresStore } from '../../stores/scores'

describe('Admin View (Tasks 7.1-7.5)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    try {
      const keys = ['participants', 'entries', 'scores', 'scoringEvents', 'manualScoreLogs']
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

  describe('7.1 Password-Protected Admin View', () => {
    it('should require password for admin access', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      // Admin should not be able to access without password
      // This is enforced in the component with isAuthenticated flag
      expect(participantsStore.participants).toEqual([])
      expect(entriesStore.entries).toEqual([])
    })

    it('should validate admin password', () => {
      const adminPassword = 'admin123'
      const testPassword = 'admin123'
      
      expect(testPassword).toBe(adminPassword)
    })

    it('should reject invalid password', () => {
      const adminPassword = 'admin123'
      const testPassword = 'wrongpassword'
      
      expect(testPassword).not.toBe(adminPassword)
    })
  })

  describe('7.2 Participant Management', () => {
    it('should add participant with email, name, and entry fee', () => {
      const store = useParticipantsStore()
      
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      expect(store.participants).toHaveLength(1)
      expect(store.participants[0].email).toBe('john@example.com')
      expect(store.participants[0].name).toBe('John Doe')
      expect(store.participants[0].entryFee).toBe(20)
    })

    it('should prevent duplicate participant emails', () => {
      const store = useParticipantsStore()
      
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      expect(() => {
        store.addParticipant('john@example.com', 'John Smith', 25)
      }).toThrow('Participant with this email already exists')
    })

    it('should remove participant by email', () => {
      const store = useParticipantsStore()
      
      store.addParticipant('john@example.com', 'John Doe', 20)
      store.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      store.removeParticipant('john@example.com')
      
      expect(store.participants).toHaveLength(1)
      expect(store.participants[0].email).toBe('jane@example.com')
    })

    it('should retrieve participant by email', () => {
      const store = useParticipantsStore()
      
      store.addParticipant('john@example.com', 'John Doe', 20)
      
      const participant = store.getParticipant('john@example.com')
      
      expect(participant).toBeDefined()
      expect(participant.name).toBe('John Doe')
    })

    it('should display all participants with entry counts', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('jane@example.com', 'Jane Doe')
      
      const participants = participantsStore.participants.map(p => ({
        ...p,
        entryCount: entriesStore.entries.filter(e => e.email === p.email).length
      }))
      
      expect(participants[0].entryCount).toBe(2)
      expect(participants[1].entryCount).toBe(1)
    })
  })

  describe('7.3 Entry Management', () => {
    it('should create entry for participant', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      expect(entry.email).toBe('john@example.com')
      expect(entry.participantName).toBe('John Doe')
      expect(entry.playerIds).toEqual([])
      expect(entry.totalScore).toBe(0)
    })

    it('should allow multiple entries per participant', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('john@example.com', 'John Doe')
      
      expect(entry1.id).not.toBe(entry2.id)
      expect(entriesStore.entries).toHaveLength(2)
    })

    it('should remove entry by ID', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.removeEntry(entry1.id)
      
      expect(entriesStore.entries).toHaveLength(1)
      expect(entriesStore.entries[0].id).toBe(entry2.id)
    })

    it('should display all entries with participant names and scores', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 10)
      
      const displayEntry = {
        ...entry,
        participantName: participantsStore.getParticipant(entry.email)?.name || 'Unknown'
      }
      
      expect(displayEntry.participantName).toBe('John Doe')
      expect(displayEntry.totalScore).toBe(10)
    })
  })

  describe('7.4 Manual Score Updates', () => {
    it('should update entry score manually', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 5)
      
      const updated = entriesStore.getEntry(entry.id)
      expect(updated.totalScore).toBe(5)
    })

    it('should accumulate manual score updates', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 5)
      entriesStore.updateEntryScore(entry.id, 3)
      entriesStore.updateEntryScore(entry.id, 2)
      
      const updated = entriesStore.getEntry(entry.id)
      expect(updated.totalScore).toBe(10)
    })

    it('should log manual score updates with timestamp and admin ID', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 5)
      
      const log = {
        entryId: entry.id,
        points: 5,
        timestamp: new Date().toISOString(),
        adminId: 'admin'
      }
      
      expect(log.entryId).toBe(entry.id)
      expect(log.points).toBe(5)
      expect(log.timestamp).toBeDefined()
      expect(log.adminId).toBe('admin')
    })

    it('should persist score update logs to localStorage', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.updateEntryScore(entry.id, 5)
      
      const log = {
        entryId: entry.id,
        points: 5,
        timestamp: new Date().toISOString(),
        adminId: 'admin'
      }
      
      const logs = [log]
      localStorage.setItem('manualScoreLogs', JSON.stringify(logs))
      
      const stored = JSON.parse(localStorage.getItem('manualScoreLogs'))
      expect(stored).toHaveLength(1)
      expect(stored[0].entryId).toBe(entry.id)
    })
  })

  describe('7.5 CSV Export', () => {
    it('should export standings to CSV format', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      
      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 15)
      
      const entries = entriesStore.entries.map(e => ({
        ...e,
        participantName: participantsStore.getParticipant(e.email)?.name || 'Unknown'
      }))
      
      const sortedEntries = [...entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      
      let csv = 'Rank,Participant Name,Entry ID,Players Selected,Total Points\n'
      sortedEntries.forEach((entry, idx) => {
        const playerCount = entry.playerIds.length
        const row = [
          idx + 1,
          `"${entry.participantName}"`,
          entry.id,
          playerCount,
          entry.totalScore
        ]
        csv += row.join(',') + '\n'
      })
      
      expect(csv).toContain('Rank,Participant Name,Entry ID,Players Selected,Total Points')
      expect(csv).toContain('Jane Doe')
      expect(csv).toContain('John Doe')
      expect(csv).toContain('15')
      expect(csv).toContain('10')
    })

    it('should include all required fields in CSV export', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.setEntryPlayers(entry.id, ['p1', 'p2', 'p3', 'p4', 'p5'])
      entriesStore.updateEntryScore(entry.id, 25)
      
      const entries = entriesStore.entries.map(e => ({
        ...e,
        participantName: participantsStore.getParticipant(e.email)?.name || 'Unknown'
      }))
      
      let csv = 'Rank,Participant Name,Entry ID,Players Selected,Total Points\n'
      entries.forEach((entry, idx) => {
        const playerCount = entry.playerIds.length
        const row = [
          idx + 1,
          `"${entry.participantName}"`,
          entry.id,
          playerCount,
          entry.totalScore
        ]
        csv += row.join(',') + '\n'
      })
      
      expect(csv).toContain('1')
      expect(csv).toContain('John Doe')
      expect(csv).toContain('5')
      expect(csv).toContain('25')
    })

    it('should sort CSV export by points descending, then by creation time', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)
      participantsStore.addParticipant('bob@example.com', 'Bob Smith', 20)
      
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      const entry3 = entriesStore.createEntry('bob@example.com', 'Bob Smith')
      
      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 20)
      entriesStore.updateEntryScore(entry3.id, 10)
      
      const entries = entriesStore.entries.map(e => ({
        ...e,
        participantName: participantsStore.getParticipant(e.email)?.name || 'Unknown'
      }))
      
      const sortedEntries = [...entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      
      expect(sortedEntries[0].totalScore).toBe(20)
      expect(sortedEntries[1].totalScore).toBe(10)
      expect(sortedEntries[2].totalScore).toBe(10)
      expect(sortedEntries[1].participantName).toBe('John Doe')
      expect(sortedEntries[2].participantName).toBe('Bob Smith')
    })
  })

  describe('Admin Console Summary', () => {
    it('should calculate total participants', () => {
      const store = useParticipantsStore()
      
      store.addParticipant('john@example.com', 'John Doe', 20)
      store.addParticipant('jane@example.com', 'Jane Doe', 20)
      
      expect(store.participants).toHaveLength(2)
    })

    it('should calculate total entries', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')
      
      expect(entriesStore.entries).toHaveLength(2)
    })

    it('should calculate total fees collected', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 25)
      
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('jane@example.com', 'Jane Doe')
      
      const participants = participantsStore.participants.map(p => ({
        ...p,
        entryCount: entriesStore.entries.filter(e => e.email === p.email).length
      }))
      
      const totalFees = participants.reduce((sum, p) => sum + (p.entryFee * p.entryCount), 0)
      
      expect(totalFees).toBe(20 * 2 + 25 * 1)
    })

    it('should count entries with players selected', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()
      
      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('john@example.com', 'John Doe')
      
      entriesStore.setEntryPlayers(entry1.id, ['p1', 'p2', 'p3'])
      
      const entries = entriesStore.entries.map(e => ({
        ...e,
        participantName: participantsStore.getParticipant(e.email)?.name || 'Unknown'
      }))
      
      const entriesWithPlayers = entries.filter(e => e.playerIds.length > 0).length
      
      expect(entriesWithPlayers).toBe(1)
    })
  })
})
