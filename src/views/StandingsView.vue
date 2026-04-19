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
  color: #00d4ff;
  font-size: 2rem;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
  color: #888;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 2px dashed #2a2f4a;
  border-radius: 8px;
  font-size: 1.1rem;
}

.standings-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.standings-table th {
  background: linear-gradient(135deg, #2a2f4a 0%, #3a3f5a 100%);
  color: #00d4ff;
  padding: 16px 12px;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 3px solid #c41e3a;
  font-size: 0.9rem;
}

.standings-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #2a2f4a;
  color: #e0e0e0;
}

.standings-table tbody tr {
  transition: all 0.3s ease;
}

.standings-table tbody tr:hover {
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, rgba(196, 30, 58, 0.05) 100%);
  transform: scale(1.01);
  box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.1);
}

.standings-table tbody tr:first-child td:first-child::before {
  content: '👑';
  margin-right: 8px;
  font-size: 1.2em;
}

.standings-table tbody tr:nth-child(2) td:first-child::before {
  content: '🥈';
  margin-right: 8px;
}

.standings-table tbody tr:nth-child(3) td:first-child::before {
  content: '🥉';
  margin-right: 8px;
}

.player-stats-section {
  margin-top: 40px;
  padding: 25px;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 3px solid #c41e3a;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(196, 30, 58, 0.2);
  position: relative;
  overflow: hidden;
}

.player-stats-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #c41e3a 0px,
    #c41e3a 10px,
    #00d4ff 10px,
    #00d4ff 20px
  );
  animation: slide-in 1s ease-out;
}

.player-stats-section h3 {
  margin-top: 0;
  margin-bottom: 20px;
  color: #00d4ff;
  font-size: 1.5rem;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.no-data {
  padding: 30px;
  text-align: center;
  color: #888;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.player-stats-table {
  overflow-x: auto;
}

.player-stats-table table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.player-stats-table th {
  background: linear-gradient(135deg, #2a2f4a 0%, #3a3f5a 100%);
  color: #00d4ff;
  padding: 12px;
  text-align: left;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  border-bottom: 2px solid #c41e3a;
  font-size: 0.85rem;
}

.player-stats-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #2a2f4a;
  color: #e0e0e0;
}

.player-stats-table tbody tr {
  transition: all 0.2s ease;
}

.player-stats-table tbody tr:hover {
  background: rgba(0, 212, 255, 0.1);
  transform: translateX(4px);
}
</style>
