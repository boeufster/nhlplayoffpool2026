import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerPopularity } from '../usePlayerPopularity'
import { useEntriesStore } from '../../stores/entries'
import { useScoresStore } from '../../stores/scores'
import { useEliminatedTeamsStore } from '../../stores/eliminatedTeams'

describe('usePlayerPopularity', () => {
  let entriesStore
  let scoresStore
  let eliminatedTeamsStore

  beforeEach(() => {
    setActivePinia(createPinia())
    entriesStore = useEntriesStore()
    scoresStore = useScoresStore()
    eliminatedTeamsStore = useEliminatedTeamsStore()
  })

  describe('totalEntries', () => {
    it('should return 0 when no entries exist', () => {
      const { totalEntries } = usePlayerPopularity()
      expect(totalEntries.value).toBe(0)
    })

    it('should return the number of entries', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player B'], playerTeams: {} }
      ])
      const { totalEntries } = usePlayerPopularity()
      expect(totalEntries.value).toBe(2)
    })
  })

  describe('empty / edge-case stores', () => {
    it('should return empty rows when entries store is empty', () => {
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toEqual([])
    })

    it('should return empty rows when entries have no playerNames', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerTeams: {} },
        { id: 'e2', playerNames: undefined, playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toEqual([])
    })

    it('should return empty rows when all playerNames arrays are empty', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: [], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toEqual([])
    })

    it('should handle entries with missing playerTeams gracefully', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'] }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toHaveLength(1)
      expect(popularityRows.value[0].team).toBeNull()
    })
  })

  describe('aggregation', () => {
    it('should produce one row per unique player', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid', 'Cale Makar'], playerTeams: {} },
        { id: 'e2', playerNames: ['Nathan MacKinnon', 'Connor McDavid'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toHaveLength(3)
    })

    it('should treat same name with different casing as one player', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: {} },
        { id: 'e2', playerNames: ['connor mcdavid'], playerTeams: {} },
        { id: 'e3', playerNames: ['CONNOR MCDAVID'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value).toHaveLength(1)
      expect(popularityRows.value[0].pickCount).toBe(3)
    })

    it('should use first-occurrence casing for display name', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['connor mcdavid'], playerTeams: {} },
        { id: 'e2', playerNames: ['Connor McDavid'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].playerName).toBe('connor mcdavid')
    })
  })

  describe('pick count', () => {
    it('should count the number of entries containing each player', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player A', 'Player C'], playerTeams: {} },
        { id: 'e3', playerNames: ['Player A', 'Player B', 'Player C'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      const rowA = popularityRows.value.find(r => r.playerName === 'Player A')
      const rowB = popularityRows.value.find(r => r.playerName === 'Player B')
      const rowC = popularityRows.value.find(r => r.playerName === 'Player C')
      expect(rowA.pickCount).toBe(3)
      expect(rowB.pickCount).toBe(2)
      expect(rowC.pickCount).toBe(2)
    })
  })

  describe('points lookup', () => {
    it('should look up points from scoring events (case-insensitive)', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'connor mcdavid', points: 12 }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].points).toBe(12)
    })

    it('should default to 0 when no scoring event exists', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Unknown Player'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].points).toBe(0)
    })
  })

  describe('team resolution', () => {
    it('should resolve team code from entry playerTeams', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: { 'connor mcdavid': 'EDM' } }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].team).toBe('EDM')
    })

    it('should use first non-null team code across entries', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: {} },
        { id: 'e2', playerNames: ['Connor McDavid'], playerTeams: { 'connor mcdavid': 'EDM' } },
        { id: 'e3', playerNames: ['Connor McDavid'], playerTeams: { 'connor mcdavid': 'TOR' } }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].team).toBe('EDM')
    })

    it('should return null team when no entry has a team code', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Mystery Player'], playerTeams: {} },
        { id: 'e2', playerNames: ['Mystery Player'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].team).toBeNull()
    })
  })

  describe('elimination status', () => {
    it('should mark player as eliminated when their team is eliminated', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: { 'connor mcdavid': 'EDM' } }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].eliminated).toBe(true)
    })

    it('should not mark player as eliminated when their team is active', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Connor McDavid'], playerTeams: { 'connor mcdavid': 'EDM' } }
      ])
      eliminatedTeamsStore.hydrateFromData(['MTL'])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].eliminated).toBe(false)
    })

    it('should not mark player as eliminated when team is null', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Unknown Player'], playerTeams: {} }
      ])
      eliminatedTeamsStore.hydrateFromData(['EDM'])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].eliminated).toBe(false)
    })
  })

  describe('sorting', () => {
    it('should sort by descending pick count first', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B'], playerTeams: {} },
        { id: 'e2', playerNames: ['Player A'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].playerName).toBe('Player A')
      expect(popularityRows.value[1].playerName).toBe('Player B')
    })

    it('should sort by descending points when pick count is equal', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Player A', 'Player B'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Player A', points: 5 },
        { id: 's2', playerName: 'Player B', points: 10 }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].playerName).toBe('Player B')
      expect(popularityRows.value[1].playerName).toBe('Player A')
    })

    it('should sort alphabetically ascending when pick count and points are equal', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Zach', 'Aaron', 'Mike'], playerTeams: {} }
      ])
      const { popularityRows } = usePlayerPopularity()
      expect(popularityRows.value[0].playerName).toBe('Aaron')
      expect(popularityRows.value[1].playerName).toBe('Mike')
      expect(popularityRows.value[2].playerName).toBe('Zach')
    })

    it('should apply full sort cascade correctly', () => {
      entriesStore.hydrateFromData([
        { id: 'e1', playerNames: ['Alpha', 'Beta', 'Gamma', 'Delta'], playerTeams: {} },
        { id: 'e2', playerNames: ['Alpha', 'Beta', 'Gamma'], playerTeams: {} },
        { id: 'e3', playerNames: ['Alpha', 'Beta'], playerTeams: {} }
      ])
      scoresStore.hydrateFromData([
        { id: 's1', playerName: 'Beta', points: 8 },
        { id: 's2', playerName: 'Gamma', points: 5 }
      ])
      const { popularityRows } = usePlayerPopularity()

      // Alpha: pickCount=3, points=0
      // Beta: pickCount=3, points=8
      // Gamma: pickCount=2, points=5
      // Delta: pickCount=1, points=0

      expect(popularityRows.value[0].playerName).toBe('Beta')   // 3 picks, 8 pts
      expect(popularityRows.value[1].playerName).toBe('Alpha')  // 3 picks, 0 pts
      expect(popularityRows.value[2].playerName).toBe('Gamma')  // 2 picks, 5 pts
      expect(popularityRows.value[3].playerName).toBe('Delta')  // 1 pick, 0 pts
    })
  })
})
