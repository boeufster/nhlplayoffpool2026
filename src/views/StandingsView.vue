<template>
  <div class="standings-view">
    <h2>Standings</h2>
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
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stat, idx) in latestPlayerStats" :key="idx">
            <td>{{ stat.playerName }}</td>
            <td>{{ stat.points }}</td>
            <td>{{ formatTime(stat.timestamp) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'

export default {
  name: 'StandingsView',
  setup() {
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()
    const playerStatsUpdateLogs = ref([])

    const entries = computed(() => entriesStore.entries)

    const sortedEntries = computed(() => {
      // Build a map of player stats for quick lookup
      const playerStatsMap = new Map()
      playerStatsUpdateLogs.value.forEach(log => {
        if (log.playerName) {
          playerStatsMap.set(log.playerName.toLowerCase(), log.points)
        }
      })

      // Calculate scores based on player stats
      const entriesWithCalculatedScores = entries.value.map(entry => {
        let calculatedScore = 0
        // Use playerNames if available, otherwise fall back to playerIds
        const players = entry.playerNames || entry.playerIds || []
        if (players && players.length > 0) {
          players.forEach(playerName => {
            // Convert to string and try exact match first, then case-insensitive match
            const playerNameStr = String(playerName)
            let points = playerStatsMap.get(playerNameStr) || playerStatsMap.get(playerNameStr.toLowerCase()) || 0
            calculatedScore += points
          })
        }
        return {
          ...entry,
          calculatedScore
        }
      })

      return entriesWithCalculatedScores.sort((a, b) => {
        // Sort by calculated score descending (highest first)
        if (b.calculatedScore !== a.calculatedScore) {
          return b.calculatedScore - a.calculatedScore
        }
        // Tiebreaker: earliest entry first (by creation timestamp)
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    })

    const loadPlayerStatsFromStorage = () => {
      try {
        const stored = localStorage.getItem('playerStats')
        if (stored && typeof stored === 'string' && stored.length > 0) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            playerStatsUpdateLogs.value = parsed
          }
        }
      } catch (error) {
        console.error('Error loading player stats from storage:', error)
        playerStatsUpdateLogs.value = []
      }
    }

    const latestPlayerStats = computed(() => {
      // Get player stats from localStorage
      const playerStatsMap = new Map()
      
      // Build a map of latest stats for each player
      playerStatsUpdateLogs.value.forEach(log => {
        if (log.playerName) {
          playerStatsMap.set(log.playerName, {
            playerName: log.playerName,
            points: log.points,
            timestamp: log.timestamp
          })
        }
      })
      
      // Convert to array and sort by points descending (highest first), then by timestamp
      return Array.from(playerStatsMap.values())
        .sort((a, b) => {
          // Sort by points descending (highest first)
          if (b.points !== a.points) {
            return b.points - a.points
          }
          // Tiebreaker: most recent first
          return new Date(b.timestamp) - new Date(a.timestamp)
        })
    })

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    // Auto-refresh on score updates
    let refreshInterval = null

    const startAutoRefresh = () => {
      // Refresh every 5 seconds to catch score updates
      refreshInterval = setInterval(() => {
        // Force reactivity by accessing the entries
        entries.value
        // Also reload player stats from storage
        loadPlayerStatsFromStorage()
      }, 5000)
    }

    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }

    onMounted(() => {
      loadPlayerStatsFromStorage()
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return {
      entries,
      sortedEntries,
      latestPlayerStats,
      formatTime
    }
  }
}
</script>

<style scoped>
.standings-view {
  padding: 20px;
}

.standings-view h2 {
  margin-top: 0;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #666;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

.standings-table th,
.standings-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.standings-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.standings-table tbody tr:hover {
  background: #f9f9f9;
}
</style>
