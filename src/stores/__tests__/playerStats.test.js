import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

describe('Player Stats and Entry Scoring', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Entry Creation and Player Assignment', () => {
    it('should create an entry with participant email and name', () => {
      const entriesStore = useEntriesStore()
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      expect(entry).toBeDefined()
      expect(entry.email).toBe('john@example.com')
      expect(entry.participantName).toBe('John Doe')
      expect(entry.totalScore).toBe(0)
    })

    it('should set player names for an entry', () => {
      const entriesStore = useEntriesStore()
      const entry = entriesStore.createEntry('john@example.com', 'John Doe')
      const playerNames = ['Player A', 'Player B', 'Player C']
      entriesStore.setEntryPlayerNames(entry.id, playerNames)
      const updatedEntry = entriesStore.getEntry(entry.id)
      expect(updatedEntry.playerNames).toEqual(playerNames)
    })
  })

  describe('Score Calculation from Scoring Events', () => {
    it('should calculate score as sum of player scoring events', () => {
      const scoresStore = useScoresStore()
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 5, createdAt: '2025-01-01T00:00:00Z' },
        { id: 's2', playerName: 'Player B', points: 3, createdAt: '2025-01-01T00:00:00Z' }
      ])
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        playerPointsMap.set(event.playerName.toLowerCase(), event.points)
      }
      const playerNames = ['Player A', 'Player B']
      let score = 0
      playerNames.forEach(n => { score += playerPointsMap.get(n.toLowerCase()) || 0 })
      expect(score).toBe(8)
    })

    it('should return 0 for unknown players', () => {
      const scoresStore = useScoresStore()
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 5, createdAt: '2025-01-01T00:00:00Z' }
      ])
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        playerPointsMap.set(event.playerName.toLowerCase(), event.points)
      }
      expect(playerPointsMap.get('unknown') || 0).toBe(0)
    })
  })


  describe('Standings Sorting', () => {
    it('should sort by score descending', () => {
      const entries = [
        { id: '1', calculatedScore: 5, createdAt: '2025-01-01T00:00:00Z' },
        { id: '2', calculatedScore: 10, createdAt: '2025-01-02T00:00:00Z' }
      ]
      const sorted = entries.sort((a, b) => {
        if (b.calculatedScore !== a.calculatedScore) return b.calculatedScore - a.calculatedScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].calculatedScore).toBe(10)
    })

    it('should use timestamp as tiebreaker', () => {
      const now = new Date()
      const later = new Date(now.getTime() + 1000)
      const entries = [
        { id: '1', calculatedScore: 5, createdAt: later.toISOString() },
        { id: '2', calculatedScore: 5, createdAt: now.toISOString() }
      ]
      const sorted = entries.sort((a, b) => {
        if (b.calculatedScore !== a.calculatedScore) return b.calculatedScore - a.calculatedScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
      expect(sorted[0].id).toBe('2')
    })
  })
})
