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
          <td>{{ entry.totalScore }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { computed, onMounted, onUnmounted } from 'vue'
import { useEntriesStore } from '../stores/entries'

export default {
  name: 'StandingsView',
  setup() {
    const entriesStore = useEntriesStore()

    const entries = computed(() => entriesStore.entries)

    const sortedEntries = computed(() => {
      return [...entries.value].sort((a, b) => {
        // Sort by points descending (highest first)
        if (b.totalScore !== a.totalScore) {
          return b.totalScore - a.totalScore
        }
        // Tiebreaker: earliest entry first (by creation timestamp)
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    })

    // Auto-refresh on score updates
    let refreshInterval = null

    const startAutoRefresh = () => {
      // Refresh every 5 seconds to catch score updates
      refreshInterval = setInterval(() => {
        // Force reactivity by accessing the entries
        entries.value
      }, 5000)
    }

    const stopAutoRefresh = () => {
      if (refreshInterval) {
        clearInterval(refreshInterval)
        refreshInterval = null
      }
    }

    onMounted(() => {
      startAutoRefresh()
    })

    onUnmounted(() => {
      stopAutoRefresh()
    })

    return {
      entries,
      sortedEntries
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
