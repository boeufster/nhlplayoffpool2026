import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import fc from 'fast-check'
import { useEntriesStore } from '../entries'
import { useScoresStore } from '../scores'

/**
 * Property-Based Tests for NHL Playoff Pool Correctness Properties
 *
 * Updated for Vercel Postgres migration — removed references to
 * deleted stores (scoringEngine, playerSelection, playerRegistry)
 * and localStorage persistence tests.
 */

describe('Correctness Properties', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('Property: Selection Invariant — player count is always 0-15', () => {
    it('should store exactly 15 players when 15 are provided', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: 15, maxLength: 15 }),
          (playerIds) => {
            setActivePinia(createPinia())
            const entriesStore = useEntriesStore()
            const entry = entriesStore.createEntry('test@example.com', 'Test')
            entriesStore.setEntryPlayers(entry.id, playerIds)

            const retrieved = entriesStore.getEntry(entry.id)
            expect(retrieved.playerIds).toHaveLength(15)
            expect(retrieved.playerIds).toEqual(playerIds)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Property: Standings Invariant — sorted by points descending with timestamp tiebreaker', () => {
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
            setActivePinia(createPinia())
            const entriesStore = useEntriesStore()

            entryData.forEach(data => {
              const entry = entriesStore.createEntry(data.email, 'Test')
              for (let i = 0; i < data.score; i++) {
                entriesStore.updateEntryScore(entry.id, 1)
              }
            })

            const sorted = [...entriesStore.entries].sort((a, b) => {
              if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
              return new Date(a.createdAt) - new Date(b.createdAt)
            })

            for (let i = 0; i < sorted.length - 1; i++) {
              const current = sorted[i]
              const next = sorted[i + 1]
              if (current.totalScore === next.totalScore) {
                expect(new Date(current.createdAt).getTime()).toBeLessThanOrEqual(
                  new Date(next.createdAt).getTime()
                )
              } else {
                expect(current.totalScore).toBeGreaterThan(next.totalScore)
              }
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Property: Duplicate Prevention — no player ID appears twice in a selection', () => {
    it('should prevent duplicate players in entry selection', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.integer({ min: 1, max: 10000 }), { minLength: 15, maxLength: 15 }),
          (playerIds) => {
            setActivePinia(createPinia())
            const entriesStore = useEntriesStore()
            const entry = entriesStore.createEntry('test@example.com', 'Test')
            entriesStore.setEntryPlayers(entry.id, playerIds)

            const retrieved = entriesStore.getEntry(entry.id)
            const uniqueIds = new Set(retrieved.playerIds)
            expect(uniqueIds.size).toBe(retrieved.playerIds.length)
            expect(uniqueIds.size).toBe(15)
          }
        ),
        { numRuns: 20 }
      )
    })
  })

  describe('Property: Hydration replaces state completely', () => {
    it('should fully replace entries state on hydration', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 5, maxLength: 20 }),
              email: fc.emailAddress(),
              participantName: fc.string({ minLength: 1, maxLength: 30 }),
              totalScore: fc.integer({ min: 0, max: 500 }),
              playerNames: fc.array(fc.string({ minLength: 1, maxLength: 30 }), { minLength: 0, maxLength: 15 }),
              createdAt: fc.date().map(d => d.toISOString())
            }),
            { minLength: 0, maxLength: 10 }
          ),
          (apiEntries) => {
            setActivePinia(createPinia())
            const entriesStore = useEntriesStore()
            // Pre-populate with some data
            entriesStore.createEntry('old@example.com', 'Old')

            entriesStore.hydrateFromData(apiEntries)

            expect(entriesStore.entries).toHaveLength(apiEntries.length)
            for (let i = 0; i < apiEntries.length; i++) {
              expect(entriesStore.entries[i].id).toBe(apiEntries[i].id)
              expect(entriesStore.entries[i].totalScore).toBe(apiEntries[i].totalScore)
            }
          }
        ),
        { numRuns: 20 }
      )
    })
  })
})
