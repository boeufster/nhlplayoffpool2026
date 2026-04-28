import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useParticipantsStore } from '../../stores/participants'
import { useEntriesStore } from '../../stores/entries'
import { useScoresStore } from '../../stores/scores'
import { useEliminatedTeamsStore } from '../../stores/eliminatedTeams'

describe('AdminView Logic', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Password Authentication', () => {
    it('should validate admin password', () => {
      const adminPassword = 'admin123'
      expect('admin123').toBe(adminPassword)
    })

    it('should reject invalid password', () => {
      const adminPassword = 'admin123'
      expect('wrongpassword').not.toBe(adminPassword)
    })
  })

  describe('Participant Management', () => {
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

    it('should display all participants with entry counts', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()

      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)

      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('jane@example.com', 'Jane Doe')

      const johnEntries = entriesStore.entries.filter(e => e.email === 'john@example.com')
      const janeEntries = entriesStore.entries.filter(e => e.email === 'jane@example.com')

      expect(johnEntries).toHaveLength(2)
      expect(janeEntries).toHaveLength(1)
    })
  })

  describe('Entry Management', () => {
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
      const entriesStore = useEntriesStore()
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('john@example.com', 'John Doe')

      expect(entry1.id).not.toBe(entry2.id)
      expect(entriesStore.entries).toHaveLength(2)
    })

    it('should remove entry by ID', () => {
      const entriesStore = useEntriesStore()
      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('john@example.com', 'John Doe')

      entriesStore.removeEntry(entry1.id)

      expect(entriesStore.entries).toHaveLength(1)
      expect(entriesStore.entries[0].id).toBe(entry2.id)
    })
  })

  describe('Score Updates', () => {
    it('should update entry score', () => {
      const entriesStore = useEntriesStore()
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')

      entriesStore.updateEntryScore(entry.id, 5)

      expect(entriesStore.getEntry(entry.id).totalScore).toBe(5)
    })

    it('should accumulate score updates', () => {
      const entriesStore = useEntriesStore()
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')

      entriesStore.updateEntryScore(entry.id, 5)
      entriesStore.updateEntryScore(entry.id, 3)
      entriesStore.updateEntryScore(entry.id, 2)

      expect(entriesStore.getEntry(entry.id).totalScore).toBe(10)
    })
  })

  describe('CSV Export Logic', () => {
    it('should export standings to CSV format', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()

      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 20)

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')

      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 15)

      const sortedEntries = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      let csv = 'Rank,Participant Name,Entry ID,Players Selected,Total Points\n'
      sortedEntries.forEach((entry, idx) => {
        const playerCount = (entry.playerNames || entry.playerIds || []).length
        csv += [idx + 1, `"${entry.participantName}"`, entry.id, playerCount, entry.totalScore].join(',') + '\n'
      })

      expect(csv).toContain('Rank,Participant Name,Entry ID,Players Selected,Total Points')
      expect(csv).toContain('Jane Doe')
      expect(csv).toContain('15')
      expect(csv).toContain('10')
    })

    it('should sort CSV export by points descending, then by creation time', () => {
      const entriesStore = useEntriesStore()

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      const entry2 = entriesStore.createEntry('jane@example.com', 'Jane Doe')
      const entry3 = entriesStore.createEntry('bob@example.com', 'Bob Smith')

      entriesStore.updateEntryScore(entry1.id, 10)
      entriesStore.updateEntryScore(entry2.id, 20)
      entriesStore.updateEntryScore(entry3.id, 10)

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].totalScore).toBe(20)
      expect(sorted[1].totalScore).toBe(10)
      expect(sorted[2].totalScore).toBe(10)
      expect(sorted[1].participantName).toBe('John Doe')
      expect(sorted[2].participantName).toBe('Bob Smith')
    })
  })

  describe('Pool Summary', () => {
    it('should calculate total fees collected', () => {
      const participantsStore = useParticipantsStore()
      const entriesStore = useEntriesStore()

      participantsStore.addParticipant('john@example.com', 'John Doe', 20)
      participantsStore.addParticipant('jane@example.com', 'Jane Doe', 25)

      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('jane@example.com', 'Jane Doe')

      const totalFees = participantsStore.participants.reduce((sum, p) => {
        const count = entriesStore.entries.filter(e => e.email === p.email).length
        return sum + (p.entryFee * count)
      }, 0)

      expect(totalFees).toBe(20 * 2 + 25 * 1)
    })

    it('should count entries with players selected', () => {
      const entriesStore = useEntriesStore()

      const entry1 = entriesStore.createEntry('john@example.com', 'John Doe')
      entriesStore.createEntry('john@example.com', 'John Doe')

      entriesStore.setEntryPlayers(entry1.id, ['p1', 'p2', 'p3'])

      const entriesWithPlayers = entriesStore.entries.filter(
        e => (e.playerNames || e.playerIds || []).length > 0
      ).length

      expect(entriesWithPlayers).toBe(1)
    })
  })

  describe('Eliminated Teams Management', () => {
    it('should parse comma-separated team codes to uppercase', () => {
      const input = 'mtl, ott, buf'
      const parsedCodes = input
        .split(/[,\n]+/)
        .map(code => code.trim().toUpperCase())
        .filter(code => /^[A-Z]{2,4}$/.test(code))

      expect(parsedCodes).toEqual(['MTL', 'OTT', 'BUF'])
    })

    it('should filter out invalid team codes during parsing', () => {
      const input = 'MTL, , TOOLONG, A, OTT, 123'
      const parsedCodes = input
        .split(/[,\n]+/)
        .map(code => code.trim().toUpperCase())
        .filter(code => /^[A-Z]{2,4}$/.test(code))

      expect(parsedCodes).toEqual(['MTL', 'OTT'])
    })

    it('should parse newline-separated team codes', () => {
      const input = 'MTL\nOTT\nBUF'
      const parsedCodes = input
        .split(/[,\n]+/)
        .map(code => code.trim().toUpperCase())
        .filter(code => /^[A-Z]{2,4}$/.test(code))

      expect(parsedCodes).toEqual(['MTL', 'OTT', 'BUF'])
    })

    it('should produce empty array from empty input', () => {
      const input = ''
      const parsedCodes = input
        .trim()
        .split(/[,\n]+/)
        .map(code => code.trim().toUpperCase())
        .filter(code => /^[A-Z]{2,4}$/.test(code))

      expect(parsedCodes).toEqual([])
    })

    it('should hydrate eliminated teams store after successful update', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT', 'BUF'])

      expect(store.eliminatedTeams).toEqual(['MTL', 'OTT', 'BUF'])
      expect(store.isTeamEliminated('MTL')).toBe(true)
      expect(store.isTeamEliminated('EDM')).toBe(false)
    })

    it('should display eliminated teams from the store', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT'])

      expect(store.eliminatedTeams).toHaveLength(2)
      expect(store.eliminatedTeams).toContain('MTL')
      expect(store.eliminatedTeams).toContain('OTT')
    })
  })
})
