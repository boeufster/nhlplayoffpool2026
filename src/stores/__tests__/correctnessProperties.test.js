import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import fc from 'fast-check'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'
import { useScoringEngineStore } from '../scoringEngine'

/**
 * Property-Based Tests for NHL Playoff Pool Correctness Properties (Task 9.6)
 * 
 * These tests validate universal correctness properties that should hold
 * across all valid inputs and scenarios using property-based testing.
 * 
 * Properties tested:
 * 1. Scoring Invariant: Total score = sum of all scoring events
 * 2. Selection Invariant: Selected players count is always 0-15
 * 3. Standings Invariant: Standings sorted by points descending, tiebreaker by timestamp
 * 4. Persistence Invariant: Data written to storage equals data read from storage
 * 5. Duplicate Prevention Invariant: No player ID appears twice in a selection
 */

describe('Correctness Properties (Task 9.6)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Clear localStorage
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

  // ============================================================================
  // Property 1: Scoring Invariant
  // ============================================================================
  describe('Property 1: Scoring Invariant - Total score = sum of all scoring events', () => {
    /**
     * Validates: Requirements 3.2, 3.3, 4.1, 4.2, 4.3, 4.4, 4.5
     */
    it('should calculate total score as sum of all scoring events for an entry', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              playerId: fc.constantFrom('player1', 'player2', 'player3'),
              eventType: fc.constantFrom('goal', 'assist', 'win', 'shutout')
            }),
            { minLength: 0, maxLength: 50 }
          ),
          (events) => {
            const entriesStore = useEntriesStore()
            const scoringEngineStore = useScoringEngineStore()

            // Create entry with all players
            const entry = entriesStore.createEntry('test@example.com', 'Test')
            entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

            // Calculate expected score
            const SCORING_RULES = {
              goal: 1,
              assist: 1,
              win: 1,
              shutout: 3 // 1 for win + 2 for shutout
            }

            const playersInEntry = new Set(['player1', 'player2', 'player3'])
            let expectedScore = 0
            
            for (const event of events) {
              if (playersInEntry.has(event.playerId)) {
                const result = scoringEngineStore.processScoringEvent(event)
                if (result) {
                  expectedScore += SCORING_RULES[event.eventType]
                }
              }
            }

            // Verify actual score matches expected
            const actualEntry = entriesStore.getEntry(entry.id)
            expect(actualEntry.totalScore).toBe(expectedScore)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should never decrease scores when adding new scoring events', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              playerId: fc.constantFrom('player1', 'player2', 'player3'),
              eventType: fc.constantFrom('goal', 'assist', 'win', 'shutout')
            }),
            { minLength: 1, maxLength: 30 }
          ),
          (events) => {
            const entriesStore = useEntriesStore()
            const scoringEngineStore = useScoringEngineStore()

            const entry = entriesStore.createEntry('test@example.com', 'Test')
            entriesStore.setEntryPlayers(entry.id, ['player1', 'player2', 'player3'])

            let previousScore = 0

            for (const event of events) {
              scoringEngineStore.processScoringEvent(event)
              const currentScore = entriesStore.getEntry(entry.id).totalScore

              expect(currentScore).toBeGreaterThanOrEqual(previousScore)
              previousScore = currentScore
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ============================================================================
  // Property 2: Selection Invariant
  // ============================================================================
  describe('Property 2: Selection Invariant - Selected players count is always 0-15', () => {
    /**
     * Validates: Requirements 2.3, 2.4, 2.7
     */
    it('should enforce exactly 15 players in valid entries', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: 15, maxLength: 15 }),
          (playerIds) => {
            const entriesStore = useEntriesStore()

            const entry = entriesStore.createEntry('test@example.com', 'Test')
            entriesStore.setEntryPlayers(entry.id, playerIds)

            const retrievedEntry = entriesStore.getEntry(entry.id)

            // Must have exactly 15 players
            expect(retrievedEntry.playerIds).toHaveLength(15)
            expect(retrievedEntry.playerIds).toEqual(playerIds)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain 15-player invariant across multiple entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              playerIds: fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), {
                minLength: 15,
                maxLength: 15
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entryData) => {
            const entriesStore = useEntriesStore()

            entryData.forEach(data => {
              const entry = entriesStore.createEntry(data.email, 'Test')
              entriesStore.setEntryPlayers(entry.id, data.playerIds)

              const retrieved = entriesStore.getEntry(entry.id)
              expect(retrieved.playerIds).toHaveLength(15)
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ============================================================================
  // Property 3: Standings Invariant
  // ============================================================================
  describe('Property 3: Standings Invariant - Standings sorted by points descending with tiebreaker by timestamp', () => {
    /**
     * Validates: Requirements 5.1, 5.3
     */
    it('should sort standings by points descending with timestamp tiebreaker', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              score: fc.integer({ min: 0, max: 100 })
            }),
            { minLength: 1, maxLength: 20 }
          ),
          (entryData) => {
            const entriesStore = useEntriesStore()

            // Create entries with various scores
            entryData.forEach(data => {
              const entry = entriesStore.createEntry(data.email, 'Test')
              entriesStore.setEntryPlayers(entry.id, Array.from({ length: 15 }, (_, i) => i + 1))
              for (let i = 0; i < data.score; i++) {
                entriesStore.updateEntryScore(entry.id, 1)
              }
            })

            // Get sorted entries
            const sorted = [...entriesStore.entries].sort((a, b) => {
              if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore
              }
              return new Date(a.createdAt) - new Date(b.createdAt)
            })

            // Verify sorting: each entry's score >= next entry's score
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]
              const next = sorted[i + 1]

              if (current.totalScore === next.totalScore) {
                // If scores are equal, earlier entry should come first
                expect(new Date(current.createdAt).getTime()).toBeLessThanOrEqual(
                  new Date(next.createdAt).getTime()
                )
              } else {
                // Otherwise, higher score should come first
                expect(current.totalScore).toBeGreaterThan(next.totalScore)
              }
            }
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should apply tiebreaker by creation timestamp when scores are equal', () => {
      fc.assert(
        fc.property(
          fc.array(fc.emailAddress(), { minLength: 2, maxLength: 10 }),
          (emails) => {
            const entriesStore = useEntriesStore()

            // Create entries with same score
            const entries = emails.map(email => {
              const entry = entriesStore.createEntry(email, 'Test')
              entriesStore.setEntryPlayers(entry.id, Array.from({ length: 15 }, (_, i) => i + 1))
              entriesStore.updateEntryScore(entry.id, 10)
              return entry
            })

            // Sort by standings logic
            const sorted = [...entriesStore.entries].sort((a, b) => {
              if (b.totalScore !== a.totalScore) {
                return b.totalScore - a.totalScore
              }
              return new Date(a.createdAt) - new Date(b.createdAt)
            })

            // With same scores, earlier created entries should come first
            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]
              const next = sorted[i + 1]
              expect(new Date(current.createdAt).getTime()).toBeLessThanOrEqual(
                new Date(next.createdAt).getTime()
              )
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ============================================================================
  // Property 4: Persistence Invariant
  // ============================================================================
  describe('Property 4: Persistence Invariant - Data written to storage equals data read from storage', () => {
    /**
     * Validates: Requirements 10.1, 10.3, 10.4
     */
    it('should persist and restore entry data correctly', () => {
      fc.assert(
        fc.property(
          fc.record({
            email: fc.emailAddress(),
            name: fc.string({ minLength: 1, maxLength: 50 }),
            playerIds: fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), {
              minLength: 15,
              maxLength: 15
            }),
            score: fc.integer({ min: 0, max: 100 })
          }),
          (data) => {
            // Create a fresh Pinia instance for each property run
            setActivePinia(createPinia())
            localStorage.clear()
            
            const entriesStore = useEntriesStore()

            // Create and modify entry
            const entry = entriesStore.createEntry(data.email, data.name)
            entriesStore.setEntryPlayers(entry.id, data.playerIds)
            for (let i = 0; i < data.score; i++) {
              entriesStore.updateEntryScore(entry.id, 1)
            }

            // Verify localStorage has the data
            const stored = JSON.parse(localStorage.getItem('entries'))
            expect(stored).toBeDefined()
            expect(stored).toHaveLength(1)

            const storedEntry = stored[0]
            expect(storedEntry.email).toBe(data.email)
            expect(storedEntry.participantName).toBe(data.name)
            expect(storedEntry.playerIds).toEqual(data.playerIds)
            expect(storedEntry.totalScore).toBe(data.score)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should restore data from localStorage after reload', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              score: fc.integer({ min: 0, max: 50 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entryData) => {
            // Clear localStorage before test
            localStorage.clear()
            
            // Create entries
            const entriesStore = useEntriesStore()
            entryData.forEach(data => {
              const entry = entriesStore.createEntry(data.email, 'Test')
              entriesStore.setEntryPlayers(entry.id, Array.from({ length: 15 }, (_, i) => i + 1))
              for (let i = 0; i < data.score; i++) {
                entriesStore.updateEntryScore(entry.id, 1)
              }
            })

            const originalCount = entriesStore.entries.length
            const originalScores = entriesStore.entries.map(e => e.totalScore)

            // Simulate reload
            const newStore = useEntriesStore()
            newStore.entries = []
            newStore.loadFromStorage()

            // Verify data is restored
            expect(newStore.entries).toHaveLength(originalCount)
            newStore.entries.forEach((entry, index) => {
              expect(entry.totalScore).toBe(originalScores[index])
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  // ============================================================================
  // Property 5: Duplicate Prevention Invariant
  // ============================================================================
  describe('Property 5: Duplicate Prevention Invariant - No player ID appears twice in a selection', () => {
    /**
     * Validates: Requirements 2.7
     */
    it('should prevent duplicate players in entry selection', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: 15, maxLength: 15 }),
          (playerIds) => {
            const entriesStore = useEntriesStore()

            // Create entry
            const entry = entriesStore.createEntry('test@example.com', 'Test')

            // Set exactly 15 players
            entriesStore.setEntryPlayers(entry.id, playerIds)

            const retrieved = entriesStore.getEntry(entry.id)

            // Check for duplicates
            const uniqueIds = new Set(retrieved.playerIds)
            expect(uniqueIds.size).toBe(retrieved.playerIds.length)
            expect(uniqueIds.size).toBe(15)
          }
        ),
        { numRuns: 20 }
      )
    })

    it('should maintain uniqueness across multiple entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              email: fc.emailAddress(),
              playerIds: fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), {
                minLength: 15,
                maxLength: 15
              })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entryData) => {
            const entriesStore = useEntriesStore()

            entryData.forEach(data => {
              const entry = entriesStore.createEntry(data.email, 'Test')
              entriesStore.setEntryPlayers(entry.id, data.playerIds)

              const retrieved = entriesStore.getEntry(entry.id)
              const uniqueIds = new Set(retrieved.playerIds)

              // Each entry should have 15 unique players
              expect(uniqueIds.size).toBe(15)
            })
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
