import { computed } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'
import { useEliminatedTeamsStore } from '../stores/eliminatedTeams'

/**
 * Composable that aggregates all unique players across pool entries,
 * ranks them by pick count, and enriches with points and elimination status.
 *
 * @returns {{
 *   popularityRows: import('vue').ComputedRef<PlayerPopularityRow[]>,
 *   totalEntries: import('vue').ComputedRef<number>
 * }}
 *
 * @typedef {Object} PlayerPopularityRow
 * @property {string} playerName   — display name (original casing from first occurrence)
 * @property {string|null} team    — NHL team code (e.g. "EDM"), or null if unknown
 * @property {number} points       — current playoff points from scores store (0 if none)
 * @property {number} pickCount    — number of entries that drafted this player
 * @property {boolean} eliminated  — true when the player's team is eliminated
 */
export function usePlayerPopularity() {
  const entriesStore = useEntriesStore()
  const scoresStore = useScoresStore()
  const eliminatedTeamsStore = useEliminatedTeamsStore()

  const totalEntries = computed(() => entriesStore.entries.length)

  const popularityRows = computed(() => {
    const entries = entriesStore.entries

    // Map: lowercase player name → { displayName, team, pickCount }
    const playerMap = new Map()

    // 1. Iterate all entries, aggregate player data
    for (const entry of entries) {
      const playerNames = entry.playerNames || []
      const playerTeams = entry.playerTeams || {}

      for (let i = 0; i < playerNames.length; i++) {
        const name = playerNames[i]
        if (!name) continue

        const key = name.toLowerCase()

        if (!playerMap.has(key)) {
          // First occurrence: store original casing and resolve team
          const teamCode = playerTeams[key] || null
          playerMap.set(key, {
            displayName: name,
            team: teamCode,
            pickCount: 1
          })
        } else {
          const data = playerMap.get(key)
          data.pickCount += 1

          // Resolve team if still null (first non-null across entries)
          if (data.team === null) {
            const teamCode = playerTeams[key] || null
            if (teamCode) {
              data.team = teamCode
            }
          }
        }
      }
    }

    // 2. Build points lookup from scoring events (case-insensitive)
    const pointsMap = new Map()
    for (const event of scoresStore.scoringEvents) {
      if (event.playerName) {
        pointsMap.set(event.playerName.toLowerCase(), event.points || 0)
      }
    }

    // 3. Build result rows with points and elimination status
    const rows = []
    for (const [key, data] of playerMap) {
      rows.push({
        playerName: data.displayName,
        team: data.team,
        points: pointsMap.get(key) || 0,
        pickCount: data.pickCount,
        eliminated: data.team ? eliminatedTeamsStore.isTeamEliminated(data.team) : false
      })
    }

    // 4. Sort: descending pickCount → descending points → ascending alphabetical name
    rows.sort((a, b) => {
      if (b.pickCount !== a.pickCount) return b.pickCount - a.pickCount
      if (b.points !== a.points) return b.points - a.points
      return a.playerName.localeCompare(b.playerName)
    })

    return rows
  })

  return {
    popularityRows,
    totalEntries
  }
}
