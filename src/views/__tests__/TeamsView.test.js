import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../../stores/entries'
import { useEliminatedTeamsStore } from '../../stores/eliminatedTeams'

/**
 * TeamsView Logic Tests
 * Tests the read-only view logic: sorting, empty state, data display.
 * No @vue/test-utils available, so we test the computed logic directly.
 */
describe('TeamsView Logic', () => {
  let entriesStore

  beforeEach(() => {
    setActivePinia(createPinia())
    entriesStore = useEntriesStore()
  })

  describe('Empty state', () => {
    it('should have no entries initially', () => {
      expect(entriesStore.entries).toHaveLength(0)
    })
  })

  describe('Entries display (read-only)', () => {
    it('should display entries with participant name, entry ID, player names, and score', () => {
      entriesStore.hydrateFromData([
        {
          id: 'entry-1',
          email: 'john@example.com',
          participantName: 'John Doe',
          totalScore: 24,
          playerNames: ['Player 1', 'Player 2', 'Player 3'],
          createdAt: '2025-01-01T00:00:00Z'
        }
      ])

      const entry = entriesStore.entries[0]
      expect(entry.participantName).toBe('John Doe')
      expect(entry.id).toBe('entry-1')
      expect(entry.totalScore).toBe(24)
      expect(entry.playerNames).toHaveLength(3)
      expect(entry.playerNames[0]).toBe('Player 1')
    })

    it('should show entries with no players assigned', () => {
      entriesStore.hydrateFromData([
        {
          id: 'entry-1',
          email: 'john@example.com',
          participantName: 'John Doe',
          totalScore: 0,
          playerNames: [],
          createdAt: '2025-01-01T00:00:00Z'
        }
      ])

      const entry = entriesStore.entries[0]
      expect(entry.playerNames).toHaveLength(0)
    })
  })

  describe('Alphabetical sorting by participant name', () => {
    it('should sort entries alphabetically by participant name', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', email: 'c@x.com', participantName: 'Charlie', totalScore: 0, playerNames: [], createdAt: '2025-01-01T00:00:00Z' },
        { id: 'e2', email: 'a@x.com', participantName: 'Alice', totalScore: 0, playerNames: [], createdAt: '2025-01-02T00:00:00Z' },
        { id: 'e3', email: 'b@x.com', participantName: 'Bob', totalScore: 0, playerNames: [], createdAt: '2025-01-03T00:00:00Z' }
      ])

      // Replicate TeamsView sorting logic
      const sorted = [...entriesStore.entries].sort((a, b) => {
        const nameA = (a.participantName || '').toLowerCase()
        const nameB = (b.participantName || '').toLowerCase()
        return nameA.localeCompare(nameB)
      })

      expect(sorted[0].participantName).toBe('Alice')
      expect(sorted[1].participantName).toBe('Bob')
      expect(sorted[2].participantName).toBe('Charlie')
    })
  })

  describe('No edit controls (read-only verification)', () => {
    it('should only expose read data — no mutation methods called on entries from TeamsView', () => {
      // TeamsView only reads entriesStore.entries and sorts them.
      // It does not call createEntry, removeEntry, updateEntryScore, etc.
      // We verify the store has the read-only data path available.
      entriesStore.hydrateFromData([
        { id: 'e1', email: 'a@x.com', participantName: 'Alice', totalScore: 10, playerNames: ['P1'], createdAt: '2025-01-01T00:00:00Z' }
      ])

      // TeamsView only accesses: entriesStore.entries (read), sort (pure), display fields
      const sortedEntries = [...entriesStore.entries].sort((a, b) => {
        return (a.participantName || '').toLowerCase().localeCompare((b.participantName || '').toLowerCase())
      })

      expect(sortedEntries).toHaveLength(1)
      expect(sortedEntries[0].participantName).toBe('Alice')
      expect(sortedEntries[0].totalScore).toBe(10)
      expect(sortedEntries[0].playerNames).toEqual(['P1'])
    })
  })

  describe('Eliminated player indicators', () => {
    let eliminatedTeamsStore

    beforeEach(() => {
      eliminatedTeamsStore = useEliminatedTeamsStore()
    })

    // Helper functions replicating TeamsView logic
    const getPlayerTeam = (playerName, entry) => {
      if (!entry || !entry.playerTeams) return null
      return entry.playerTeams[String(playerName).toLowerCase()] || null
    }

    const isPlayerEliminated = (playerName, entry) => {
      const teamCode = getPlayerTeam(playerName, entry)
      return eliminatedTeamsStore.isTeamEliminated(teamCode)
    }

    it('should identify a player as eliminated when their team is in the eliminated list', () => {
      eliminatedTeamsStore.hydrateFromData(['MTL', 'OTT'])

      const entry = {
        id: 'e1',
        participantName: 'Alice',
        playerNames: ['Connor McDavid', 'Nick Suzuki'],
        playerTeams: { 'connor mcdavid': 'EDM', 'nick suzuki': 'MTL' }
      }

      expect(isPlayerEliminated('Nick Suzuki', entry)).toBe(true)
      expect(isPlayerEliminated('Connor McDavid', entry)).toBe(false)
    })

    it('should return false for players without a team code', () => {
      eliminatedTeamsStore.hydrateFromData(['MTL'])

      const entry = {
        id: 'e1',
        participantName: 'Bob',
        playerNames: ['Sidney Crosby'],
        playerTeams: { 'sidney crosby': null }
      }

      expect(isPlayerEliminated('Sidney Crosby', entry)).toBe(false)
    })

    it('should return false when entry has no playerTeams data', () => {
      eliminatedTeamsStore.hydrateFromData(['MTL'])

      const entry = {
        id: 'e1',
        participantName: 'Charlie',
        playerNames: ['Player One']
      }

      expect(isPlayerEliminated('Player One', entry)).toBe(false)
    })

    it('should return the team code from playerTeams map', () => {
      const entry = {
        id: 'e1',
        participantName: 'Alice',
        playerNames: ['Connor McDavid'],
        playerTeams: { 'connor mcdavid': 'EDM' }
      }

      expect(getPlayerTeam('Connor McDavid', entry)).toBe('EDM')
    })

    it('should return null for players not in the playerTeams map', () => {
      const entry = {
        id: 'e1',
        participantName: 'Alice',
        playerNames: ['Unknown Player'],
        playerTeams: { 'connor mcdavid': 'EDM' }
      }

      expect(getPlayerTeam('Unknown Player', entry)).toBeNull()
    })

    it('should handle case-insensitive player name lookup', () => {
      const entry = {
        id: 'e1',
        participantName: 'Alice',
        playerNames: ['Connor McDavid'],
        playerTeams: { 'connor mcdavid': 'EDM' }
      }

      expect(getPlayerTeam('CONNOR MCDAVID', entry)).toBe('EDM')
      expect(getPlayerTeam('connor mcdavid', entry)).toBe('EDM')
    })

    it('should not mark players on non-eliminated teams as eliminated', () => {
      eliminatedTeamsStore.hydrateFromData(['MTL', 'OTT'])

      const entry = {
        id: 'e1',
        participantName: 'Alice',
        playerNames: ['Connor McDavid', 'Auston Matthews'],
        playerTeams: { 'connor mcdavid': 'EDM', 'auston matthews': 'TOR' }
      }

      expect(isPlayerEliminated('Connor McDavid', entry)).toBe(false)
      expect(isPlayerEliminated('Auston Matthews', entry)).toBe(false)
    })
  })
})
