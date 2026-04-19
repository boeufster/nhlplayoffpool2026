<template>
  <div class="standings-view">
    <h2>Standings</h2>
    <p v-if="lastUpdated" class="last-updated">Stats updated: {{ lastUpdated }}</p>
    <div v-if="entries.length === 0" class="empty-state">
      <p>No entries yet</p>
    </div>
    <table v-else class="standings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Participant</th>
          <th>Entry ID</th>
          <th>Points</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, index) in sortedEntries" :key="entry.id">
          <td>{{ index + 1 }}</td>
          <td>{{ entry.participantName }}</td>
          <td>{{ entry.id }}</td>
          <td>{{ entry.calculatedScore }}</td>
        </tr>
      </tbody>
    </table>

    <!-- Latest Player Stats Section -->
    <section class="player-stats-section">
      <h3>Latest Player Stats</h3>
      <div v-if="latestPlayerStats.length === 0" class="no-data">
        No player stats recorded yet
      </div>
      <table v-else class="player-stats-table">
        <thead>
          <tr>
            <th>Player Name</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stat, idx) in latestPlayerStats" :key="idx">
            <td>{{ stat.playerName }}</td>
            <td>{{ stat.points }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'

export default {
  name: 'StandingsView',
  setup() {
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    const entries = computed(() => entriesStore.entries)

    const sortedEntries = computed(() => {
      // Build player → points map from scoring events (case-insensitive)
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }

      // Calculate score for each entry
      const entriesWithScores = entries.value.map(entry => {
        let calculatedScore = 0
        const players = entry.playerNames || entry.playerIds || []
        for (const playerName of players) {
          const key = String(playerName).toLowerCase()
          calculatedScore += playerPointsMap.get(key) || 0
        }
        return { ...entry, calculatedScore }
      })

      // Sort by score descending, tiebreak by createdAt ascending
      return entriesWithScores.sort((a, b) => {
        if (b.calculatedScore !== a.calculatedScore) {
          return b.calculatedScore - a.calculatedScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    })

    const latestPlayerStats = computed(() => {
      // Show scoring events sorted by points descending
      return [...scoresStore.scoringEvents].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return (a.playerName || '').localeCompare(b.playerName || '')
      })
    })

    const lastUpdated = computed(() => {
      if (scoresStore.scoringEvents.length === 0) return null
      const dates = scoresStore.scoringEvents
        .map(e => e.createdAt)
        .filter(Boolean)
        .map(d => new Date(d))
      if (dates.length === 0) return null
      const latest = new Date(Math.max(...dates))
      return latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    })

    return {
      entries,
      sortedEntries,
      latestPlayerStats,
      lastUpdated
    }
  }
}
</script>

<style scoped>
.standings-view { padding: 0; }
.standings-view h2 { margin: 0 0 4px 0; color: var(--text-heading); font-size: 1.8rem; font-weight: 700; }
.last-updated { color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 16px 0; }
.empty-state { text-align: center; padding: 60px 40px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 4px; }
.standings-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
.standings-table th { background: var(--bg-card) !important; color: var(--text-secondary) !important; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color) !important; font-size: 0.75rem; }
.standings-table th:last-child { background: var(--bg-highlight) !important; color: var(--text-primary) !important; }
.standings-table td { padding: 12px; border-bottom: 1px solid var(--border-light) !important; color: var(--text-primary); font-size: 0.9rem; }
.standings-table td:last-child { background: var(--bg-highlight); font-weight: 700; }
.standings-table tbody tr:hover { background: var(--bg-row-hover) !important; }
.standings-table tbody tr:nth-child(even) { background: var(--bg-row-even); }
.player-stats-section { margin-top: 40px; padding: 0; border: none; background: none; }
.player-stats-section h3 { margin: 0 0 16px 0; color: var(--text-heading); font-size: 1.4rem; font-weight: 700; }
.no-data { padding: 30px; text-align: center; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 4px; }
.player-stats-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
.player-stats-table th { background: var(--bg-card) !important; color: var(--text-secondary) !important; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color) !important; font-size: 0.75rem; }
.player-stats-table th:last-child { background: var(--bg-highlight) !important; }
.player-stats-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-light) !important; color: var(--text-primary); }
.player-stats-table td:last-child { background: var(--bg-highlight); font-weight: 700; }
.player-stats-table tbody tr:hover { background: var(--bg-row-hover) !important; }
.player-stats-table tbody tr:nth-child(even) { background: var(--bg-row-even); }
</style>
