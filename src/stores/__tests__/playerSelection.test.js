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

  describe('Task 4.1: Create text input component for player names', () => {
    it('should parse player names from text input (one per line)', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const textInput = 'Connor McDavid\nCale Makar\nAndrei Vasilevskiy'
      const players = playerSelectionStore.parsePlayerInput(textInput)
      expect(players).toHaveLength(3)
      expect(players[0]).toBe('Connor McDavid')
      expect(players[1]).toBe('Cale Makar')
      expect(players[2]).toBe('Andrei Vasilevskiy')
    })

    it('should parse player names from comma-separated input', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const textInput = 'Connor McDavid, Cale Makar, Andrei Vasilevskiy'
      const players = playerSelectionStore.parsePlayerInput(textInput)
      expect(players).toHaveLength(3)
      expect(players[0]).toBe('Connor McDavid')
      expect(players[1]).toBe('Cale Makar')
      expect(players[2]).toBe('Andrei Vasilevskiy')
    })
  })

  describe('Task 4.2: Implement player name parsing (one per line or comma-separated)', () => {
    it('should trim whitespace from player names', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const textInput = '  Connor McDavid  \n  Cale Makar  '
      const players = playerSelectionStore.parsePlayerInput(textInput)
      expect(players[0]).toBe('Connor McDavid')
      expect(players[1]).toBe('Cale Makar')
    })

    it('should handle mixed line endings', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const textInput = 'Player 1\r\nPlayer 2\nPlayer 3'
      const players = playerSelectionStore.parsePlayerInput(textInput)
      expect(players).toHaveLength(3)
    })

    it('should filter out empty lines', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const textInput = 'Player 1\n\nPlayer 2\n\n\nPlayer 3'
      const players = playerSelectionStore.parsePlayerInput(textInput)
      expect(players).toHaveLength(3)
    })
  })

  describe('Task 4.3: Implement player count validation (exactly 15)', () => {
    it('should enforce exactly 15 player count', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players14 = Array.from({ length: 14 }, (_, i) => `Player ${i + 1}`)
      const players15 = Array.from({ length: 15 }, (_, i) => `Player ${i + 1}`)
      const players16 = Array.from({ length: 16 }, (_, i) => `Player ${i + 1}`)

      expect(playerSelectionStore.validatePlayerCount(players14)).toBe(false)
      expect(playerSelectionStore.validatePlayerCount(players15)).toBe(true)
      expect(playerSelectionStore.validatePlayerCount(players16)).toBe(false)
    })

    it('should allow submission with exactly 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 15 }, (_, i) => `Player ${i + 1}`)
      expect(playerSelectionStore.validatePlayerCount(players)).toBe(true)
    })

    it('should prevent submission with fewer than 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 14 }, (_, i) => `Player ${i + 1}`)
      expect(playerSelectionStore.validatePlayerCount(players)).toBe(false)
    })

    it('should prevent submission with more than 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 16 }, (_, i) => `Player ${i + 1}`)
      expect(playerSelectionStore.validatePlayerCount(players)).toBe(false)
    })
  })

  describe('Task 4.4: Prevent duplicate player names', () => {
    it('should detect duplicate player names', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = ['Connor McDavid', 'Cale Makar', 'Connor McDavid', 'Andrei Vasilevskiy']
      expect(playerSelectionStore.hasDuplicates(players)).toBe(true)
    })

    it('should allow unique player names', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = ['Connor McDavid', 'Cale Makar', 'Andrei Vasilevskiy']
      expect(playerSelectionStore.hasDuplicates(players)).toBe(false)
    })

    it('should be case-sensitive for duplicates', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = ['Connor McDavid', 'connor mcdavid']
      expect(playerSelectionStore.hasDuplicates(players)).toBe(false)
    })

    it('should validate player names are non-empty', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = ['Connor McDavid', '', 'Cale Makar']
      expect(playerSelectionStore.validatePlayerNames(players)).toBe(false)
    })
  })

  describe('Task 4.5: Implement entry submission with timestamp', () => {
    it('should submit entry with exactly 15 players and timestamp', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const entriesStore = useEntriesStore()
      const players = Array.from({ length: 15 }, (_, i) => `Player ${i + 1}`)
      
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      const submission = playerSelectionStore.submitEntry(entry.id, players)
      
      expect(submission.playerIds).toHaveLength(15)
      expect(submission.submittedAt).toBeDefined()
      expect(new Date(submission.submittedAt)).toBeInstanceOf(Date)
    })

    it('should prevent submission with fewer than 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 14 }, (_, i) => `Player ${i + 1}`)
      
      expect(() => {
        playerSelectionStore.submitEntry('entry-123', players)
      }).toThrow('Must select exactly 15 players')
    })

    it('should prevent submission with more than 15 players', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 16 }, (_, i) => `Player ${i + 1}`)
      
      expect(() => {
        playerSelectionStore.submitEntry('entry-123', players)
      }).toThrow('Must select exactly 15 players')
    })

    it('should prevent submission with duplicate player names', () => {
      const playerSelectionStore = usePlayerSelectionStore()
      const players = Array.from({ length: 14 }, (_, i) => `Player ${i + 1}`)
      players.push('Player 1') // Duplicate
      
      expect(() => {
        playerSelectionStore.submitEntry('entry-123', players)
      }).toThrow('Duplicate player names not allowed')
    })
  })
})
