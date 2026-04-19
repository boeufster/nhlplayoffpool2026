<template>
  <div class="admin-view">
    <h2>Admin Console</h2>
    <div v-if="!isAuthenticated" class="auth-section">
      <h3>Enter Admin Password</h3>
      <input
        v-model="password"
        type="password"
        placeholder="Enter password"
        @keyup.enter="authenticate"
      />
      <button @click="authenticate">Login</button>
      <p v-if="authError" class="error">{{ authError }}</p>
    </div>
    <div v-else class="admin-content">
      <button @click="logout" class="logout-btn">Logout</button>

      <!-- Participants Section -->
      <section class="admin-section">
        <h3>Participants Management</h3>
        <div class="form-group">
          <input v-model="newParticipant.name" placeholder="Name" />
          <input v-model="newParticipant.email" placeholder="Email" type="email" />
          <input v-model.number="newParticipant.entryFee" placeholder="Entry Fee ($)" type="number" />
          <button @click="addParticipant" class="btn-primary">Add Participant</button>
          <p v-if="participantError" class="error">{{ participantError }}</p>
        </div>
        <div class="participant-list">
          <p v-if="participants.length === 0">No participants yet</p>
          <div v-for="participant in participants" :key="participant.email" class="participant-item">
            <div>
              <strong>{{ participant.name }}</strong>
              <p class="email">{{ participant.email }}</p>
              <p class="fee">${{ participant.entryFee }} entry fee</p>
              <p class="entry-count">{{ participant.entryCount }} entries</p>
            </div>
            <button @click="removeParticipant(participant.email)" class="btn-danger">Remove</button>
          </div>
        </div>
      </section>

      <!-- Entries Section -->
      <section class="admin-section">
        <h3>Entries Management</h3>
        <div class="form-group">
          <select v-model="newEntry.email">
            <option value="">Select Participant</option>
            <option v-for="p in participants" :key="p.email" :value="p.email">
              {{ p.name }} ({{ p.email }})
            </option>
          </select>
          <button @click="createEntry" class="btn-primary">Create Entry</button>
          <p v-if="entryError" class="error">{{ entryError }}</p>
        </div>
        <div class="entries-list">
          <p v-if="entries.length === 0">No entries yet</p>
          <div v-for="entry in entries" :key="entry.id" class="entry-item">
            <div>
              <strong>{{ entry.participantName }}</strong>
              <p class="entry-id">ID: {{ entry.id }}</p>
              <p class="players">Players: {{ entry.playerIds.length }}/15</p>
              <p class="score">Score: {{ entry.totalScore }} pts</p>
            </div>
            <button @click="removeEntry(entry.id)" class="btn-danger">Remove</button>
          </div>
        </div>
      </section>

      <!-- Scoring Updates from Player Events Section -->
      <section class="admin-section">
        <h3>Scoring Updates from Player Stats</h3>
        <p class="section-description">Paste player stats in table format (NAME, PTS)</p>
        <p class="section-description">Format: NAME  PTS</p>
        <p class="section-description">Example: Mats Zuccarello  3</p>
        <div class="form-group">
          <textarea 
            v-model="playerStatsInput" 
            placeholder="Mats Zuccarello  3&#10;Kirill Kaprizov  3&#10;Matt Boldy  3"
            class="player-stats-input"
          ></textarea>
          <button @click="processPlayerStats" class="btn-primary">Process Stats</button>
          <p v-if="playerStatsError" class="error">{{ playerStatsError }}</p>
          <p v-if="playerStatsSuccess" class="success">{{ playerStatsSuccess }}</p>
        </div>
        <div class="player-stats-results" v-if="playerStatsResults.length > 0">
          <h4>Processing Results</h4>
          <div v-for="(result, idx) in playerStatsResults" :key="idx" class="result-entry" :class="{ success: result.success, failure: !result.success }">
            <p><strong>{{ result.playerName }}</strong></p>
            <p class="result-detail">Points: {{ result.points }}</p>
            <p v-if="!result.success" class="result-detail error-detail">{{ result.reason }}</p>
          </div>
        </div>
        <div class="player-stats-update-log">
          <h4>Stats Update History</h4>
          <p v-if="playerStatsUpdateLogs.length === 0">No stats updates yet</p>
          <div v-else class="compact-stats-list">
            <div v-for="(log, idx) in playerStatsUpdateLogs.slice().reverse()" :key="idx" class="compact-stat-line">
              <span class="player-name">{{ log.playerName }}</span>
              <span class="player-pts">{{ log.points }} pts</span>
              <span class="player-time">{{ formatTime(log.timestamp) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Export Section -->
      <section class="admin-section">
        <h3>Export Data</h3>
        <button @click="exportToCSV" class="btn-primary">Export Standings to CSV</button>
        <p v-if="exportMessage" class="success">{{ exportMessage }}</p>
      </section>

      <!-- Latest Player Stats Section -->
      <section class="admin-section">
        <h3>Latest Player Stats</h3>
        <div v-if="playerStatsUpdateLogs.length === 0" class="no-data">
          No player stats recorded yet
        </div>
        <div v-else class="player-stats-table">
          <table>
            <thead>
              <tr>
                <th>Player Name</th>
                <th>Points</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(log, idx) in playerStatsUpdateLogs.slice().reverse()" :key="idx">
                <td>{{ log.playerName }}</td>
                <td>{{ log.points }}</td>
                <td>{{ formatTime(log.timestamp) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Summary Section -->
      <section class="admin-section summary">
        <h3>Pool Summary</h3>
        <div class="summary-grid">
          <div class="summary-item">
            <p class="label">Total Participants</p>
            <p class="value">{{ participants.length }}</p>
          </div>
          <div class="summary-item">
            <p class="label">Total Entries</p>
            <p class="value">{{ entries.length }}</p>
          </div>
          <div class="summary-item">
            <p class="label">Total Fees Collected</p>
            <p class="value">${{ totalFees }}</p>
          </div>
          <div class="summary-item">
            <p class="label">Entries with Players</p>
            <p class="value">{{ entriesWithPlayers }}</p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useParticipantsStore } from '../stores/participants'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'
import { useScoringUpdatesStore } from '../stores/scoringUpdates'
import { usePlayerRegistryStore } from '../stores/playerRegistry'

export default {
  name: 'AdminView',
  setup() {
    const participantsStore = useParticipantsStore()
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()
    const scoringUpdatesStore = useScoringUpdatesStore()
    const playerRegistryStore = usePlayerRegistryStore()

    const isAuthenticated = ref(false)
    const password = ref('')
    const authError = ref('')
    const adminPassword = 'admin123'
    const adminId = 'admin'

    // Participant form
    const newParticipant = ref({
      name: '',
      email: '',
      entryFee: 20
    })
    const participantError = ref('')

    // Entry form
    const newEntry = ref({
      email: ''
    })
    const entryError = ref('')
    const exportMessage = ref('')

    // Manual score update logs
    const scoreLogs = ref([])

    // Scoring updates form
    const scoringUpdateInput = ref('')
    const scoringUpdateError = ref('')
    const scoringUpdateSuccess = ref('')
    const scoringUpdateResults = ref([])
    const scoringUpdateLogs = computed(() => scoringUpdatesStore.getScoringUpdateLogs())

    // Player stats form
    const playerStatsInput = ref('')
    const playerStatsError = ref('')
    const playerStatsSuccess = ref('')
    const playerStatsResults = ref([])
    const playerStatsUpdateLogs = ref([])

    const savePlayerStatsToStorage = () => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem('playerStats', JSON.stringify(playerStatsUpdateLogs.value))
        }
      } catch (error) {
        console.error('Error saving player stats to storage:', error)
      }
    }

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

    const participants = computed(() => {
      return participantsStore.participants.map(p => ({
        ...p,
        entryCount: entriesStore.entries.filter(e => e.email === p.email).length
      }))
    })

    const entries = computed(() => {
      return entriesStore.entries.map(e => ({
        ...e,
        participantName: participantsStore.getParticipant(e.email)?.name || 'Unknown'
      }))
    })

    const totalFees = computed(() => {
      return participants.value.reduce((sum, p) => sum + (p.entryFee * p.entryCount), 0)
    })

    const entriesWithPlayers = computed(() => {
      return entries.value.filter(e => e.playerIds.length > 0).length
    })

    // Load player stats on component mount
    onMounted(() => {
      loadPlayerStatsFromStorage()
    });

    const authenticate = () => {
      if (password.value === adminPassword) {
        isAuthenticated.value = true
        authError.value = ''
        password.value = ''
        loadPlayerStatsFromStorage()
        scoringUpdatesStore.loadLogsFromStorage()
      } else {
        authError.value = 'Invalid password'
      }
    }

    const logout = () => {
      isAuthenticated.value = false
      password.value = ''
    }

    const addParticipant = () => {
      participantError.value = ''
      if (!newParticipant.value.name.trim()) {
        participantError.value = 'Name is required'
        return
      }
      if (!newParticipant.value.email.trim()) {
        participantError.value = 'Email is required'
        return
      }
      if (newParticipant.value.entryFee <= 0) {
        participantError.value = 'Entry fee must be greater than 0'
        return
      }
      try {
        participantsStore.addParticipant(
          newParticipant.value.email,
          newParticipant.value.name,
          newParticipant.value.entryFee
        )
        newParticipant.value = { name: '', email: '', entryFee: 20 }
      } catch (error) {
        participantError.value = error.message
      }
    }

    const removeParticipant = (email) => {
      if (confirm(`Remove participant ${email}? This will also remove all their entries.`)) {
        // Remove all entries for this participant
        entriesStore.entries
          .filter(e => e.email === email)
          .forEach(e => entriesStore.removeEntry(e.id))
        participantsStore.removeParticipant(email)
      }
    }

    const createEntry = () => {
      entryError.value = ''
      if (!newEntry.value.email) {
        entryError.value = 'Please select a participant'
        return
      }
      const participant = participantsStore.getParticipant(newEntry.value.email)
      if (!participant) {
        entryError.value = 'Participant not found'
        return
      }
      entriesStore.createEntry(newEntry.value.email, participant.name)
      newEntry.value.email = ''
    }

    const removeEntry = (entryId) => {
      if (confirm(`Remove entry ${entryId}?`)) {
        entriesStore.removeEntry(entryId)
      }
    }

    const formatTime = (timestamp) => {
      return new Date(timestamp).toLocaleString()
    }

    const exportToCSV = () => {
      exportMessage.value = ''
      try {
        // Sort entries by score (descending), then by creation time (ascending)
        const sortedEntries = [...entries.value].sort((a, b) => {
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore
          }
          return new Date(a.createdAt) - new Date(b.createdAt)
        })

        // Build CSV content
        let csv = 'Rank,Participant Name,Entry ID,Players Selected,Total Points\n'
        sortedEntries.forEach((entry, idx) => {
          const playerCount = entry.playerIds.length
          const row = [
            idx + 1,
            `"${entry.participantName}"`,
            entry.id,
            playerCount,
            entry.totalScore
          ]
          csv += row.join(',') + '\n'
        })

        // Create blob and download
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        link.setAttribute('download', `nhl-pool-standings-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        exportMessage.value = 'CSV exported successfully!'
        setTimeout(() => {
          exportMessage.value = ''
        }, 3000)
      } catch (error) {
        exportMessage.value = `Export failed: ${error.message}`
      }
    }

    const processScoringUpdates = () => {
      scoringUpdateError.value = ''
      scoringUpdateSuccess.value = ''
      scoringUpdateResults.value = []

      if (!scoringUpdateInput.value.trim()) {
        scoringUpdateError.value = 'Please enter scoring updates'
        return
      }

      // Parse input
      const parsed = scoringUpdatesStore.parseScoringInput(scoringUpdateInput.value)
      if (parsed.length === 0) {
        scoringUpdateError.value = 'No valid scoring updates found. Use format: "Player Name: event_type"'
        return
      }

      // Validate
      const errors = scoringUpdatesStore.validateScoringData(parsed)
      if (errors.length > 0) {
        scoringUpdateError.value = errors.join('; ')
        return
      }

      // Process
      const results = scoringUpdatesStore.processScoringUpdates(parsed)
      scoringUpdateResults.value = results

      // Log each result
      results.forEach(result => {
        scoringUpdatesStore.logScoringUpdate(result)
      })

      // Count successes
      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      if (successCount > 0) {
        scoringUpdateSuccess.value = `Successfully processed ${successCount} scoring update(s)`
        if (failureCount > 0) {
          scoringUpdateSuccess.value += ` (${failureCount} failed)`
        }
      } else if (failureCount > 0) {
        scoringUpdateError.value = `Failed to process ${failureCount} scoring update(s)`
      }

      // Clear input
      scoringUpdateInput.value = ''

      // Clear results after 5 seconds
      setTimeout(() => {
        scoringUpdateResults.value = []
      }, 5000)
    }
    const processPlayerStats = () => {
      playerStatsError.value = ''
      playerStatsSuccess.value = ''
      playerStatsResults.value = []

      if (!playerStatsInput.value.trim()) {
        playerStatsError.value = 'Please enter player stats'
        return
      }

      // Parse player stats table format: NAME  PTS
      const lines = playerStatsInput.value.trim().split('\n')
      const results = []
      let successCount = 0
      let failureCount = 0

      for (const line of lines) {
        if (!line.trim()) continue

        // Parse line: NAME  PTS (whitespace-separated)
        const parts = line.trim().split(/\s+/)

        if (parts.length < 2) {
          results.push({
            success: false,
            reason: 'Invalid format. Expected: NAME  PTS'
          })
          failureCount++
          continue
        }

        try {
          // Last part is PTS, everything before is NAME
          const pts = parseInt(parts[parts.length - 1])
          const playerName = parts.slice(0, -1).join(' ')

          // Validate
          if (isNaN(pts)) {
            results.push({
              success: false,
              playerName,
              reason: 'Invalid points value'
            })
            failureCount++
            continue
          }

          if (pts < 0) {
            results.push({
              success: false,
              playerName,
              reason: 'Points cannot be negative'
            })
            failureCount++
            continue
          }

          // Log the stats update
          const log = {
            playerName,
            points: pts,
            timestamp: new Date().toISOString(),
            success: true
          }
          playerStatsUpdateLogs.value.push(log)

          results.push({
            success: true,
            playerName,
            points: pts
          })
          successCount++
        } catch (error) {
          results.push({
            success: false,
            reason: error.message
          })
          failureCount++
        }
      }

      playerStatsResults.value = results

      if (successCount > 0) {
        playerStatsSuccess.value = `Successfully processed ${successCount} player stat(s)`
        if (failureCount > 0) {
          playerStatsSuccess.value += ` (${failureCount} failed)`
        }
        // Save to storage after successful processing
        savePlayerStatsToStorage()
      } else if (failureCount > 0) {
        playerStatsError.value = `Failed to process ${failureCount} player stat(s)`
      }

      // Clear input
      playerStatsInput.value = ''

      // Clear results after 5 seconds
      setTimeout(() => {
        playerStatsResults.value = []
      }, 5000)
    }

    return {
      isAuthenticated,
      password,
      authError,
      newParticipant,
      participantError,
      newEntry,
      entryError,
      exportMessage,
      participants,
      entries,
      totalFees,
      entriesWithPlayers,
      scoringUpdateInput,
      scoringUpdateError,
      scoringUpdateSuccess,
      scoringUpdateResults,
      scoringUpdateLogs,
      playerStatsInput,
      playerStatsError,
      playerStatsSuccess,
      playerStatsResults,
      playerStatsUpdateLogs,
      authenticate,
      logout,
      addParticipant,
      removeParticipant,
      createEntry,
      removeEntry,
      exportToCSV,
      processScoringUpdates,
      processPlayerStats,
      formatTime
    }
  }
}
</script>

<style scoped>
.admin-view {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-view h2 {
  margin-top: 0;
}

.auth-section {
  max-width: 400px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.auth-section h3 {
  margin-top: 0;
}

.auth-section input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  border: 2px solid #1976d2;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
  background: white;
  color: #333;
}

.auth-section button {
  width: 100%;
  padding: 10px;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.auth-section button:hover {
  background: #555;
}

.error {
  color: #d32f2f;
  margin-top: 10px;
}

.success {
  color: #388e3c;
  margin-top: 10px;
}

.admin-content {
  position: relative;
}

.logout-btn {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8px 16px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.logout-btn:hover {
  background: #b71c1c;
}

.admin-section {
  margin-top: 40px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.admin-section h3 {
  margin-top: 0;
}

.admin-section h4 {
  margin: 15px 0 10px 0;
}

.form-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.form-group input,
.form-group select {
  flex: 1;
  min-width: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group select {
  flex: 1.5;
}

.btn-primary {
  padding: 10px 20px;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  white-space: nowrap;
}

.btn-primary:hover {
  background: #1565c0;
}

.btn-danger {
  padding: 8px 16px;
  background: #d32f2f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-danger:hover {
  background: #b71c1c;
}

.participant-list,
.entries-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.participant-item,
.entry-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 4px;
}

.participant-item div,
.entry-item div {
  flex: 1;
}

.participant-item p,
.entry-item p {
  margin: 5px 0;
  font-size: 0.9rem;
}

.email,
.entry-id,
.players {
  color: #666;
}

.fee,
.score {
  font-weight: 600;
  color: #333;
}

.entry-count {
  color: #1976d2;
  font-weight: 600;
}

.score-log {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.log-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.log-entry p {
  margin: 5px 0;
}

.timestamp {
  font-size: 0.85rem;
  color: #999;
}

.summary {
  background: #f0f7ff;
  border: 2px solid #1976d2;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 15px;
}

.summary-item {
  padding: 15px;
  background: white;
  border-radius: 4px;
  text-align: center;
  border: 1px solid #ddd;
}

.summary-item .label {
  font-size: 0.9rem;
  color: #666;
  margin: 0;
}

.summary-item .value {
  font-size: 2rem;
  font-weight: bold;
  color: #1976d2;
  margin: 10px 0 0 0;
}

.section-description {
  font-size: 0.9rem;
  color: #666;
  margin: 10px 0;
  font-style: italic;
}

.no-data {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
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
  background: #f5f5f5;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #ddd;
}

.player-stats-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.player-stats-table tr:hover {
  background: #f9f9f9;
}

.scoring-input {
  width: 100%;
  min-height: 120px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  box-sizing: border-box;
  resize: vertical;
}

.player-data-input {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  box-sizing: border-box;
  resize: vertical;
}

.scoring-results {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.result-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.result-entry.success {
  border-left-color: #388e3c;
}

.result-entry.failure {
  border-left-color: #d32f2f;
}

.result-detail {
  font-size: 0.85rem;
  color: #666;
  margin: 5px 0 0 0;
}

.error-detail {
  color: #d32f2f;
  font-weight: 600;
}

.scoring-update-log {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.scoring-update-log .log-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.scoring-update-log .log-entry.success {
  border-left-color: #388e3c;
}

.scoring-update-log .log-entry.failure {
  border-left-color: #d32f2f;
}

.player-data-results {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.player-data-results .result-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.player-data-results .result-entry.success {
  border-left-color: #388e3c;
}

.player-data-results .result-entry.failure {
  border-left-color: #d32f2f;
}

.player-stats-input {
  width: 100%;
  min-height: 150px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.85rem;
  box-sizing: border-box;
  resize: vertical;
}

.player-stats-results {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.player-stats-results .result-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.player-stats-results .result-entry.success {
  border-left-color: #388e3c;
}

.player-stats-results .result-entry.failure {
  border-left-color: #d32f2f;
}

.player-stats-update-log {
  margin-top: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.player-stats-update-log .log-entry {
  padding: 10px;
  background: white;
  border-left: 3px solid #1976d2;
  margin-bottom: 10px;
  border-radius: 2px;
}

.player-stats-update-log .log-entry.success {
  border-left-color: #388e3c;
}

.player-stats-update-log .log-entry.failure {
  border-left-color: #d32f2f;
}

.compact-stats-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.compact-stat-line {
  display: flex;
  gap: 15px;
  font-size: 0.8rem;
  padding: 4px 8px;
  background: #f9f9f9;
  border-radius: 2px;
  align-items: center;
}

.compact-stat-line .player-name {
  flex: 1;
  font-weight: 500;
  color: #333;
}

.compact-stat-line .player-pts {
  font-weight: 600;
  color: #1976d2;
  min-width: 50px;
}

.compact-stat-line .player-time {
  color: #999;
  font-size: 0.75rem;
  white-space: nowrap;
}

</style>
