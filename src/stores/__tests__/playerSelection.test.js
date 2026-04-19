import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerSelectionStore } from '../playerSelection'
import { useEntriesStore } from '../entries'

describe('Player Selection Store (Tasks 4.1-4.5)', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear()
      } catch (e) {
        // Ignore
      }
    }
    setActivePinia(createPinia())
  })

  afterEach(() => {
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.clear()
      } catch (e) {
        // Ignore
      }
    }
  })

  describe('Task 4.1: Load NHL players from API', () => {
    it('should load available players with required properties', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const mockPlayers = [
        { id: 1, name: 'Connor McDavid', position: 'F', team: 'Edmonton Oilers' },
        { id: 2, name: 'Cale Makar', position: 'D', team: 'Colorado Avalanche' },
        { id: 3, name: 'Andrei Vasilevskiy', position: 'G', team: 'Tampa Bay Lightning' }
      ]
      playerSelectionStore.setAvailablePlayers(mockPlayers)
      expect(playerSelectionStore.availablePlayers).toHaveLength(3)
      expect(playerSelectionStore.availablePlayers[0]).toHaveProperty('id')
      expect(playerSelectionStore.availablePlayers[0]).toHaveProperty('position')
    })
  })

  describe('Task 4.2: Implement position filtering (F, D, G)', () => {
    beforeEach(() => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = [
        { id: 1, name: 'Player F1', position: 'F', team: 'Team A' },
        { id: 2, name: 'Player F2', position: 'F', team: 'Team A' },
        { id: 3, name: 'Player D1', position: 'D', team: 'Team B' },
        { id: 4, name: 'Player G1', position: 'G', team: 'Team C' }
      ]
      playerSelectionStore.setAvailablePlayers(players)
    })

    it('should filter players by position', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      expect(playerSelectionStore.getPlayersByPosition('F')).toHaveLength(2)
      expect(playerSelectionStore.getPlayersByPosition('D')).toHaveLength(1)
      expect(playerSelectionStore.getPlayersByPosition('G')).toHaveLength(1)
      expect(playerSelectionStore.getPlayersByPosition('X')).toHaveLength(0)
    })
  })

  describe('Task 4.3: Implement player selection (exactly 15)', () => {
    beforeEach(() => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: ['F', 'D', 'G'][i % 3],
        team: 'Team A'
      }))
      playerSelectionStore.setAvailablePlayers(players)
    })

    it('should enforce exactly 15 player selection limit', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      for (let i = 0; i < 15; i++) {
        playerSelectionStore.selectPlayer(playerSelectionStore.availablePlayers[i])
      }
      expect(playerSelectionStore.selectedPlayers).toHaveLength(15)
      expect(playerSelectionStore.isSelectionComplete).toBe(true)
      expect(() => {
        playerSelectionStore.selectPlayer(playerSelectionStore.availablePlayers[15])
      }).toThrow('Cannot select more than 15 players')
    })

    it('should allow deselecting to modify selection', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      for (let i = 0; i < 15; i++) {
        playerSelectionStore.selectPlayer(playerSelectionStore.availablePlayers[i])
      }
      playerSelectionStore.deselectPlayer(1)
      expect(playerSelectionStore.selectedPlayers).toHaveLength(14)
      expect(playerSelectionStore.canSelectMore).toBe(true)
    })
  })

  describe('Task 4.4: Prevent duplicate selections', () => {
    beforeEach(() => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: ['F', 'D', 'G'][i % 3],
        team: 'Team A'
      }))
      playerSelectionStore.setAvailablePlayers(players)
    })

    it('should prevent duplicate selections by player ID', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const player = playerSelectionStore.availablePlayers[0]
      playerSelectionStore.selectPlayer(player)
      expect(() => {
        playerSelectionStore.selectPlayer(player)
      }).toThrow('Player already selected')
      const duplicatePlayer = { ...player, name: 'Different Name' }
      expect(() => {
        playerSelectionStore.selectPlayer(duplicatePlayer)
      }).toThrow('Player already selected')
    })

    it('should allow reselecting after deselection', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const player = playerSelectionStore.availablePlayers[0]
      playerSelectionStore.selectPlayer(player)
      playerSelectionStore.deselectPlayer(player.id)
      playerSelectionStore.selectPlayer(player)
      expect(playerSelectionStore.selectedPlayers).toHaveLength(1)
    })
  })

  describe('Task 4.5: Implement entry submission with timestamp', () => {
    beforeEach(() => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Player ${i + 1}`,
        position: ['F', 'D', 'G'][i % 3],
        team: 'Team A'
      }))
      playerSelectionStore.setAvailablePlayers(players)
    })

    it('should submit entry with exactly 15 players and timestamp', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const entriesStore = useEntriesStore()
      for (let i = 0; i < 15; i++) {
        playerSelectionStore.selectPlayer(playerSelectionStore.availablePlayers[i])
      }
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      const submission = playerSelectionStore.submitEntry(entry.id)
      expect(submission.playerIds).toHaveLength(15)
      expect(submission.submittedAt).toBeDefined()
    })

    it('should prevent submission with fewer than 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      for (let i = 0; i < 14; i++) {
        playerSelectionStore.selectPlayer(playerSelectionStore.availablePlayers[i])
      }
      expect(() => {
        playerSelectionStore.submitEntry('entry-123')
      }).toThrow('Must select exactly 15 players')
    })
  })
})
