import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { ref } from 'vue'
import { useHeadToHead } from '../useHeadToHead'
import { useEntriesStore } from '../../stores/entries'
import { useScoresStore } from '../../stores/scores'
import { useEliminatedTeamsStore } from '../../stores/eliminatedTeams'

describe('useHeadToHead', () => {
  let entriesStore
  let scoresStore
  let eliminatedTeamsStore

  beforeEach(() => {
    setActivePinia(createPinia())
    entriesStore = useEntriesStore()
    scoresStore = useScoresStore()
    eliminatedTeamsStore = useEliminatedTeamsStore()
  })

  // --- Task 1.1: Entry resolution and score computation ---

  describe('entry resolution', () => {
    it('should resolve entryA and entryB by ID', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', participantName: 'Alice', playerNames: ['Player A'], playerTeams: {} },
        { id: 'e2', participantName: 'Bob', playerNames: ['Player B'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { entryA, entryB } = useHeadToHead(idA, idB)

      expect(entryA.value.participantName).toBe('Alice')
      expect(entryB.value.participantName).toBe('Bob')
    })

    it('should return null when entry ID is empty', () => {
      const idA = ref('')
      const idB = ref(null)
      const { entryA, entryB } = useHeadToHead(idA, idB)

      expect(entryA.value).toBeNull()
      expect(entryB.value).toBeNull()
    })

    it('should return null when entry ID does not match any entry', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} }
      ])
      const idA = ref('nonexistent')
      const idB = ref('e1')
      const { entryA, entryB } = useHeadToHead(idA, idB)

      expect(entryA.value).toBeNull()
      expect(entryB.value).not.toBeNull()
    })
  })

  describe('isSameEntry and isReady flags', () => {
    it('should set isSameEntry to true when both IDs match', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e1')
      const { isSameEntry, isReady } = useHeadToHead(idA, idB)

      expect(isSameEntry.value).toBe(true)
      expect(isReady.value).toBe(false)
    })

    it('should set isSameEntry to false when IDs differ', () => {
      const idA = ref('e1')
      const idB = ref('e2')
      const { isSameEntry } = useHeadToHead(idA, idB)

      expect(isSameEntry.value).toBe(false)
    })

    it('should set isSameEntry to false when either ID is empty', () => {
      const idA = ref('')
      const idB = ref('')
      const { isSameEntry } = useHeadToHead(idA, idB)

      expect(isSameEntry.value).toBe(false)
    })

    it('should set isReady to true when two distinct valid entries are selected', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} },
        { id: 'e2', playerNames: [], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { isReady } = useHeadToHead(idA, idB)

      expect(isReady.value).toBe(true)
    })

    it('should set isReady to false when only one entry is selected', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('')
      const { isReady } = useHeadToHead(idA, idB)

      expect(isReady.value).toBe(false)
    })
  })

  describe('score computation', () => {
    it('should compute scores by summing player points from scoring events', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player C'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 10 },
        { id: 's2', playerName: 'Player B', points: 5 },
        { id: 's3', playerName: 'Player C', points: 8 }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { scoreA, scoreB } = useHeadToHead(idA, idB)

      expect(scoreA.value).toBe(15)
      expect(scoreB.value).toBe(8)
    })

    it('should default to 0 for players with no scoring events', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Unknown Player'], playerTeams: {} },
        { id: 'e2', playerNames: ['Another Unknown'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([])
      const idA = ref('e1')
      const idB = ref('e2')
      const { scoreA, scoreB } = useHeadToHead(idA, idB)

      expect(scoreA.value).toBe(0)
      expect(scoreB.value).toBe(0)
    })

    it('should look up points case-insensitively', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player X'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'connor mcdavid', points: 12 }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { scoreA } = useHeadToHead(idA, idB)

      expect(scoreA.value).toBe(12)
    })

    it('should return 0 score when entry has no playerNames', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerTeams: {} },
        { id: 'e2', playerNames: undefined, playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { scoreA, scoreB } = useHeadToHead(idA, idB)

      expect(scoreA.value).toBe(0)
      expect(scoreB.value).toBe(0)
    })

    it('should return 0 score when entry is null', () => {
      const idA = ref('')
      const idB = ref('')
      const { scoreA, scoreB } = useHeadToHead(idA, idB)

      expect(scoreA.value).toBe(0)
      expect(scoreB.value).toBe(0)
    })
  })

  // --- Task 1.2: Player partitioning ---

  describe('shared players', () => {
    it('should identify players present in both entries (case-insensitive)', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B', 'Player C'], playerTeams: {} },
        { id: 'e2', playerNames: ['player a', 'Player D', 'PLAYER C'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      const names = sharedPlayers.value.map(p => p.playerName.toLowerCase())
      expect(names).toContain('player a')
      expect(names).toContain('player c')
      expect(names).toHaveLength(2)
    })

    it('should use display name from entry A for shared players', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: {} },
        { id: 'e2', playerNames: ['connor mcdavid'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value[0].playerName).toBe('Connor McDavid')
    })

    it('should return empty array when no players are shared', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player B'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value).toEqual([])
    })

    it('should sort shared players by points descending', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B', 'Player C'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player A', 'Player B', 'Player C'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 3 },
        { id: 's2', playerName: 'Player B', points: 10 },
        { id: 's3', playerName: 'Player C', points: 7 }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value[0].playerName).toBe('Player B')
      expect(sharedPlayers.value[1].playerName).toBe('Player C')
      expect(sharedPlayers.value[2].playerName).toBe('Player A')
    })

    it('should resolve team from entry A first, then entry B for shared players', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: { 'player a': 'EDM' } },
        { id: 'e2', playerNames: ['Player A'], playerTeams: { 'player a': 'COL' } }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value[0].team).toBe('EDM')
    })

    it('should fall back to entry B team when entry A has no team for shared player', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player A'], playerTeams: { 'player a': 'COL' } }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value[0].team).toBe('COL')
    })

    it('should return null team when neither entry has a team for shared player', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player A'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value[0].team).toBeNull()
    })
  })

  describe('unique players', () => {
    it('should identify players unique to each entry', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B', 'Shared'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player C', 'Player D', 'Shared'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      const namesA = uniquePlayersA.value.map(p => p.playerName)
      const namesB = uniquePlayersB.value.map(p => p.playerName)

      expect(namesA).toContain('Player A')
      expect(namesA).toContain('Player B')
      expect(namesA).not.toContain('Shared')
      expect(namesB).toContain('Player C')
      expect(namesB).toContain('Player D')
      expect(namesB).not.toContain('Shared')
    })

    it('should handle case-insensitive matching for unique players', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'SHARED'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player B', 'shared'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      expect(uniquePlayersA.value).toHaveLength(1)
      expect(uniquePlayersA.value[0].playerName).toBe('Player A')
      expect(uniquePlayersB.value).toHaveLength(1)
      expect(uniquePlayersB.value[0].playerName).toBe('Player B')
    })

    it('should sort unique players by points descending', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Low', 'High', 'Mid'], playerTeams: {} },
        { id: 'e2', playerNames: ['Other'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Low', points: 1 },
        { id: 's2', playerName: 'High', points: 20 },
        { id: 's3', playerName: 'Mid', points: 10 }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA } = useHeadToHead(idA, idB)

      expect(uniquePlayersA.value[0].playerName).toBe('High')
      expect(uniquePlayersA.value[1].playerName).toBe('Mid')
      expect(uniquePlayersA.value[2].playerName).toBe('Low')
    })

    it('should resolve team from own entry for unique players', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: { 'player a': 'EDM' } },
        { id: 'e2', playerNames: ['Player B'], playerTeams: { 'player b': 'COL' } }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      expect(uniquePlayersA.value[0].team).toBe('EDM')
      expect(uniquePlayersB.value[0].team).toBe('COL')
    })

    it('should return empty arrays when entries are not ready', () => {
      const idA = ref('')
      const idB = ref('')
      const { sharedPlayers, uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      expect(sharedPlayers.value).toEqual([])
      expect(uniquePlayersA.value).toEqual([])
      expect(uniquePlayersB.value).toEqual([])
    })
  })

  describe('unique subtotals', () => {
    it('should compute subtotals as sum of unique player points', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['A Only', 'Shared'], playerTeams: {} },
        { id: 'e2', playerNames: ['B Only', 'Shared'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'A Only', points: 7 },
        { id: 's2', playerName: 'B Only', points: 3 },
        { id: 's3', playerName: 'Shared', points: 10 }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniqueSubtotalA, uniqueSubtotalB } = useHeadToHead(idA, idB)

      expect(uniqueSubtotalA.value).toBe(7)
      expect(uniqueSubtotalB.value).toBe(3)
    })

    it('should return 0 when there are no unique players', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Shared'], playerTeams: {} },
        { id: 'e2', playerNames: ['Shared'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniqueSubtotalA, uniqueSubtotalB } = useHeadToHead(idA, idB)

      expect(uniqueSubtotalA.value).toBe(0)
      expect(uniqueSubtotalB.value).toBe(0)
    })
  })

  describe('player partitioning completeness', () => {
    it('should partition all players into shared + unique with no overlap', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['A', 'B', 'C', 'D'], playerTeams: {} },
        { id: 'e2', playerNames: ['C', 'D', 'E', 'F'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers, uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      const sharedNames = sharedPlayers.value.map(p => p.playerName.toLowerCase())
      const uniqueANames = uniquePlayersA.value.map(p => p.playerName.toLowerCase())
      const uniqueBNames = uniquePlayersB.value.map(p => p.playerName.toLowerCase())

      // Shared should be C, D
      expect(sharedNames.sort()).toEqual(['c', 'd'])
      // Unique A should be A, B
      expect(uniqueANames.sort()).toEqual(['a', 'b'])
      // Unique B should be E, F
      expect(uniqueBNames.sort()).toEqual(['e', 'f'])

      // No overlap between categories
      const allNames = [...sharedNames, ...uniqueANames, ...uniqueBNames]
      expect(new Set(allNames).size).toBe(allNames.length)
    })
  })

  // --- Task 1.2 continued: Elimination flag ---

  describe('elimination flag', () => {
    it('should mark player as eliminated when their team is eliminated', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: { 'player a': 'EDM' } },
        { id: 'e2', playerNames: ['Player B'], playerTeams: { 'player b': 'COL' } }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA, uniquePlayersB } = useHeadToHead(idA, idB)

      expect(uniquePlayersA.value[0].eliminated).toBe(true)
      expect(uniquePlayersB.value[0].eliminated).toBe(false)
    })

    it('should not mark player as eliminated when team is null', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['No Team'], playerTeams: {} },
        { id: 'e2', playerNames: ['Other'], playerTeams: {} }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM', 'COL'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { uniquePlayersA } = useHeadToHead(idA, idB)

      expect(uniquePlayersA.value[0].eliminated).toBe(false)
    })

    it('should mark shared player as eliminated based on resolved team', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Shared'], playerTeams: { 'shared': 'EDM' } },
        { id: 'e2', playerNames: ['Shared'], playerTeams: { 'shared': 'COL' } }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { sharedPlayers } = useHeadToHead(idA, idB)

      // Team resolved from A (EDM), which is eliminated
      expect(sharedPlayers.value[0].eliminated).toBe(true)
    })
  })

  // --- Task 1.3: Points breakdown ---

  describe('points breakdown', () => {
    it('should partition points into active and eliminated', () => {
      entriesStore.hydrateFromData([
        {
          id: 'e1',
          playerNames: ['Active1', 'Active2', 'Elim1'],
          playerTeams: { 'active1': 'COL', 'active2': 'DAL', 'elim1': 'EDM' }
        },
        {
          id: 'e2',
          playerNames: ['Player X'],
          playerTeams: { 'player x': 'TOR' }
        }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Active1', points: 10 },
        { id: 's2', playerName: 'Active2', points: 5 },
        { id: 's3', playerName: 'Elim1', points: 8 }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA } = useHeadToHead(idA, idB)

      expect(breakdownA.value.activePoints).toBe(15)
      expect(breakdownA.value.eliminatedPoints).toBe(8)
      expect(breakdownA.value.activeCount).toBe(2)
      expect(breakdownA.value.eliminatedCount).toBe(1)
    })

    it('should satisfy activePoints + eliminatedPoints = total score', () => {
      entriesStore.hydrateFromData([
        {
          id: 'e1',
          playerNames: ['P1', 'P2', 'P3'],
          playerTeams: { 'p1': 'EDM', 'p2': 'COL', 'p3': 'DAL' }
        },
        {
          id: 'e2',
          playerNames: ['Other'],
          playerTeams: { 'other': 'TOR' }
        }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'P1', points: 4 },
        { id: 's2', playerName: 'P2', points: 6 },
        { id: 's3', playerName: 'P3', points: 2 }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA, scoreA } = useHeadToHead(idA, idB)

      expect(breakdownA.value.activePoints + breakdownA.value.eliminatedPoints).toBe(scoreA.value)
    })

    it('should satisfy activeCount + eliminatedCount = total player count', () => {
      entriesStore.hydrateFromData([
        {
          id: 'e1',
          playerNames: ['P1', 'P2', 'P3', 'P4'],
          playerTeams: { 'p1': 'EDM', 'p2': 'COL', 'p3': 'DAL', 'p4': 'EDM' }
        },
        {
          id: 'e2',
          playerNames: ['Other'],
          playerTeams: { 'other': 'TOR' }
        }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA } = useHeadToHead(idA, idB)

      expect(breakdownA.value.activeCount + breakdownA.value.eliminatedCount).toBe(4)
    })

    it('should return zero breakdown when entry is null', () => {
      const idA = ref('')
      const idB = ref('')
      const { breakdownA, breakdownB } = useHeadToHead(idA, idB)

      expect(breakdownA.value).toEqual({
        activePoints: 0, eliminatedPoints: 0, activeCount: 0, eliminatedCount: 0
      })
      expect(breakdownB.value).toEqual({
        activePoints: 0, eliminatedPoints: 0, activeCount: 0, eliminatedCount: 0
      })
    })

    it('should treat players with null team as active in breakdown', () => {
      entriesStore.hydrateFromData([
        {
          id: 'e1',
          playerNames: ['No Team'],
          playerTeams: {}
        },
        {
          id: 'e2',
          playerNames: ['Other'],
          playerTeams: {}
        }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'No Team', points: 5 }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM', 'COL'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA } = useHeadToHead(idA, idB)

      expect(breakdownA.value.activePoints).toBe(5)
      expect(breakdownA.value.activeCount).toBe(1)
      expect(breakdownA.value.eliminatedCount).toBe(0)
    })

    it('should handle all players eliminated', () => {
      entriesStore.hydrateFromData([
        {
          id: 'e1',
          playerNames: ['P1', 'P2'],
          playerTeams: { 'p1': 'EDM', 'p2': 'MTL' }
        },
        {
          id: 'e2',
          playerNames: ['Other'],
          playerTeams: { 'other': 'TOR' }
        }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'P1', points: 3 },
        { id: 's2', playerName: 'P2', points: 7 }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM', 'MTL'])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA } = useHeadToHead(idA, idB)

      expect(breakdownA.value.activePoints).toBe(0)
      expect(breakdownA.value.eliminatedPoints).toBe(10)
      expect(breakdownA.value.activeCount).toBe(0)
      expect(breakdownA.value.eliminatedCount).toBe(2)
    })

    it('should handle entry with empty playerNames', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} },
        { id: 'e2', playerNames: ['Other'], playerTeams: {} }
      ])
      const idA = ref('e1')
      const idB = ref('e2')
      const { breakdownA } = useHeadToHead(idA, idB)

      expect(breakdownA.value).toEqual({
        activePoints: 0, eliminatedPoints: 0, activeCount: 0, eliminatedCount: 0
      })
    })
  })
})
