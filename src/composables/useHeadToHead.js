import { computed } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'
import { useEliminatedTeamsStore } from '../stores/eliminatedTeams'

/**
 * Composable that compares two pool entries side-by-side, computing
 * shared/unique players, scores, and points breakdowns.
 *
 * @param {import('vue').Ref<string|null>} entryIdA — reactive ID of the first selected entry
 * @param {import('vue').Ref<string|null>} entryIdB — reactive ID of the second selected entry
 *
 * @returns {{
 *   entryA: import('vue').ComputedRef<object|null>,
 *   entryB: import('vue').ComputedRef<object|null>,
 *   scoreA: import('vue').ComputedRef<number>,
 *   scoreB: import('vue').ComputedRef<number>,
 *   sharedPlayers: import('vue').ComputedRef<ComparisonPlayer[]>,
 *   uniquePlayersA: import('vue').ComputedRef<ComparisonPlayer[]>,
 *   uniquePlayersB: import('vue').ComputedRef<ComparisonPlayer[]>,
 *   uniqueSubtotalA: import('vue').ComputedRef<number>,
 *   uniqueSubtotalB: import('vue').ComputedRef<number>,
 *   breakdownA: import('vue').ComputedRef<PointsBreakdown>,
 *   breakdownB: import('vue').ComputedRef<PointsBreakdown>,
 *   isSameEntry: import('vue').ComputedRef<boolean>,
 *   isReady: import('vue').ComputedRef<boolean>
 * }}
 *
 * @typedef {Object} ComparisonPlayer
 * @property {string} playerName   — display name (original casing)
 * @property {string|null} team    — NHL team code, or null if unknown
 * @property {number} points       — current playoff points (0 if no scoring event)
 * @property {boolean} eliminated  — true when the player's team is eliminated
 *
 * @typedef {Object} PointsBreakdown
 * @property {number} activePoints      — sum of points from non-eliminated players
 * @property {number} eliminatedPoints  — sum of points from eliminated players
 * @property {number} activeCount       — count of non-eliminated players
 * @property {number} eliminatedCount   — count of eliminated players
 */
export function useHeadToHead(entryIdA, entryIdB) {
  const entriesStore = useEntriesStore()
  const scoresStore = useScoresStore()
  const eliminatedTeamsStore = useEliminatedTeamsStore()

  // --- Task 1.1: Entry resolution ---

  const entryA = computed(() => {
    const id = entryIdA.value
    if (!id) return null
    return entriesStore.entries.find(e => e.id === id) || null
  })

  const entryB = computed(() => {
    const id = entryIdB.value
    if (!id) return null
    return entriesStore.entries.find(e => e.id === id) || null
  })

  const isSameEntry = computed(() => {
    const a = entryIdA.value
    const b = entryIdB.value
    return !!a && !!b && a === b
  })

  const isReady = computed(() => {
    return entryA.value !== null && entryB.value !== null && !isSameEntry.value
  })

  // --- Points map from scoring events (lowercase → points) ---

  const pointsMap = computed(() => {
    const map = new Map()
    for (const event of scoresStore.scoringEvents) {
      if (event.playerName) {
        map.set(event.playerName.toLowerCase(), event.points || 0)
      }
    }
    return map
  })

  // --- Helper: get points for a player name ---

  function getPoints(playerName) {
    return pointsMap.value.get(playerName.toLowerCase()) || 0
  }

  // --- Task 1.1: Score computation ---

  const scoreA = computed(() => {
    if (!entryA.value) return 0
    const players = entryA.value.playerNames || []
    return players.reduce((sum, name) => sum + getPoints(name), 0)
  })

  const scoreB = computed(() => {
    if (!entryB.value) return 0
    const players = entryB.value.playerNames || []
    return players.reduce((sum, name) => sum + getPoints(name), 0)
  })

  // --- Task 1.2: Player partitioning ---

  /**
   * Build a ComparisonPlayer object for a given player name.
   * @param {string} displayName — original casing
   * @param {object} primaryEntry — entry to resolve team from first
   * @param {object|null} fallbackEntry — entry to try if primary has no team
   */
  function buildPlayer(displayName, primaryEntry, fallbackEntry) {
    const key = displayName.toLowerCase()
    const points = pointsMap.value.get(key) || 0

    // Resolve team: primary entry first, then fallback
    const primaryTeams = primaryEntry.playerTeams || {}
    let team = primaryTeams[key] || null

    if (team === null && fallbackEntry) {
      const fallbackTeams = fallbackEntry.playerTeams || {}
      team = fallbackTeams[key] || null
    }

    const eliminated = team ? eliminatedTeamsStore.isTeamEliminated(team) : false

    return { playerName: displayName, team, points, eliminated }
  }

  const sharedPlayers = computed(() => {
    if (!isReady.value) return []

    const a = entryA.value
    const b = entryB.value
    const namesA = a.playerNames || []
    const namesB = b.playerNames || []

    // Build lowercase sets
    const setA = new Set(namesA.map(n => n.toLowerCase()))
    const setB = new Set(namesB.map(n => n.toLowerCase()))

    // Intersection — use display name from entry A
    const displayMap = new Map()
    for (const name of namesA) {
      displayMap.set(name.toLowerCase(), name)
    }

    const shared = []
    for (const key of setA) {
      if (setB.has(key)) {
        const displayName = displayMap.get(key)
        // For shared players: resolve team from A first, then B
        shared.push(buildPlayer(displayName, a, b))
      }
    }

    // Sort by points descending
    shared.sort((x, y) => y.points - x.points)
    return shared
  })

  const uniquePlayersA = computed(() => {
    if (!isReady.value) return []

    const a = entryA.value
    const b = entryB.value
    const namesA = a.playerNames || []
    const namesB = b.playerNames || []

    const setB = new Set(namesB.map(n => n.toLowerCase()))

    const unique = []
    for (const name of namesA) {
      if (!setB.has(name.toLowerCase())) {
        unique.push(buildPlayer(name, a, null))
      }
    }

    unique.sort((x, y) => y.points - x.points)
    return unique
  })

  const uniquePlayersB = computed(() => {
    if (!isReady.value) return []

    const a = entryA.value
    const b = entryB.value
    const namesA = a.playerNames || []
    const namesB = b.playerNames || []

    const setA = new Set(namesA.map(n => n.toLowerCase()))

    const unique = []
    for (const name of namesB) {
      if (!setA.has(name.toLowerCase())) {
        unique.push(buildPlayer(name, b, null))
      }
    }

    unique.sort((x, y) => y.points - x.points)
    return unique
  })

  const uniqueSubtotalA = computed(() => {
    return uniquePlayersA.value.reduce((sum, p) => sum + p.points, 0)
  })

  const uniqueSubtotalB = computed(() => {
    return uniquePlayersB.value.reduce((sum, p) => sum + p.points, 0)
  })

  // --- Task 1.3: Points breakdown by elimination status ---

  function computeBreakdown(entry) {
    if (!entry) {
      return { activePoints: 0, eliminatedPoints: 0, activeCount: 0, eliminatedCount: 0 }
    }

    const players = entry.playerNames || []
    const playerTeams = entry.playerTeams || {}

    let activePoints = 0
    let eliminatedPoints = 0
    let activeCount = 0
    let eliminatedCount = 0

    for (const name of players) {
      const key = name.toLowerCase()
      const pts = pointsMap.value.get(key) || 0
      const team = playerTeams[key] || null
      const isEliminated = team ? eliminatedTeamsStore.isTeamEliminated(team) : false

      if (isEliminated) {
        eliminatedPoints += pts
        eliminatedCount++
      } else {
        activePoints += pts
        activeCount++
      }
    }

    return { activePoints, eliminatedPoints, activeCount, eliminatedCount }
  }

  const breakdownA = computed(() => computeBreakdown(entryA.value))
  const breakdownB = computed(() => computeBreakdown(entryB.value))

  return {
    entryA,
    entryB,
    scoreA,
    scoreB,
    sharedPlayers,
    uniquePlayersA,
    uniquePlayersB,
    uniqueSubtotalA,
    uniqueSubtotalB,
    breakdownA,
    breakdownB,
    isSameEntry,
    isReady
  }
}
