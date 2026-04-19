import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useEntriesStore } from '../../stores/entries'
import { useScoresStore } from '../../stores/scores'

describe('StandingsView Logic', () => {
  let entriesStore
  let scoresStore

  beforeEach(() => {
    setActivePinia(createPinia())
    entriesStore = useEntriesStore()
    scoresStore = useScoresStore()
  })

  describe('Sort entries by points (descending)', () => {
    it('should sort entries by total points in descending order', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', email: 'u1@x.com', participantName: 'Player 1', totalScore: 50, playerNames: [], createdAt: '2025-01-01T00:00:00Z' },
        { id: 'e2', email: 'u2@x.com', participantName: 'Player 2', totalScore: 100, playerNames: [], createdAt: '2025-01-02T00:00:00Z' },
        { id: 'e3', email: 'u3@x.com', participantName: 'Player 3', totalScore: 75, playerNames: [], createdAt: '2025-01-03T00:00:00Z' }
      ])

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('Player 2')
      expect(sorted[1].participantName).toBe('Player 3')
      expect(sorted[2].participantName).toBe('Player 1')
    })
  })

  describe('Tiebreaker (earliest entry first)', () => {
    it('should sort by creation timestamp when points are equal', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', email: 'u1@x.com', participantName: 'First Entry', totalScore: 100, playerNames: [], createdAt: '2025-01-01T00:00:00Z' },
        { id: 'e2', email: 'u2@x.com', participantName: 'Second Entry', totalScore: 100, playerNames: [], createdAt: '2025-01-02T00:00:00Z' }
      ])

      const sorted = [...entriesStore.entries].sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return new Date(a.createdAt) - new Date(b.createdAt)
      })

      expect(sorted[0].participantName).toBe('First Entry')
      expect(sorted[1].participantName).toBe('Second Entry')
    })
  })

  describe('Score calculation from scoring events', () => {
    it('should calculate entry scores from scoring events using case-insensitive matching', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', email: 'u1@x.com', participantName: 'John', totalScore: 0, playerNames: ['Connor McDavid', 'Cale Makar'], createdAt: '2025-01-01T00:00:00Z' }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'connor mcdavid', points: 12, createdAt: '2025-06-01T00:00:00Z' },
        { id: 's2', playerName: 'Cale Makar', points: 8, createdAt: '2025-06-01T00:00:00Z' }
      ])

      // Replicate StandingsView computed logic
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }

      const entry = entriesStore.entries[0]
      let calculatedScore = 0
      for (const playerName of (entry.playerNames || [])) {
        calculatedScore += playerPointsMap.get(playerName.toLowerCase()) || 0
      }

      expect(calculatedScore).toBe(20)
    })
  })

  describe('Empty standings', () => {
    it('should handle empty entries', () => {
      expect(entriesStore.entries).toHaveLength(0)
    })
  })

  describe('Latest player stats display', () => {
    it('should sort scoring events by points descending', () => {
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 5, createdAt: '2025-01-01T00:00:00Z' },
        { id: 's2', playerName: 'Player B', points: 12, createdAt: '2025-01-01T00:00:00Z' },
        { id: 's3', playerName: 'Player C', points: 3, createdAt: '2025-01-01T00:00:00Z' }
      ])

      const sorted = [...scoresStore.scoringEvents].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return (a.playerName || '').localeCompare(b.playerName || '')
      })

      expect(sorted[0].playerName).toBe('Player B')
      expect(sorted[1].playerName).toBe('Player A')
      expect(sorted[2].playerName).toBe('Player C')
    })
  })
})
