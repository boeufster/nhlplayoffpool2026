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

      <!-- Global API Error -->
      <p v-if="apiError" class="error api-error">{{ apiError }}</p>

      <!-- Participants Section -->
      <section class="admin-section">
        <h3>Participants Management</h3>
        <div class="form-group">
          <input v-model="newParticipant.name" placeholder="Name" />
          <input v-model="newParticipant.email" placeholder="Email" type="email" />
          <input v-model.number="newParticipant.entryFee" placeholder="Entry Fee ($)" type="number" />
          <button @click="addParticipant" class="btn-primary">Add Participant</button>
        </div>
        <p v-if="participantError" class="error">{{ participantError }}</p>
        <div class="participant-list">
          <p v-if="participants.length === 0">No participants yet</p>
          <div v-for="participant in participants" :key="participant.email" class="participant-item">
            <div>
              <strong>{{ participant.name }}</strong>
              <p class="email">{{ participant.email }}</p>
              <p class="fee">${{ participant.entryFee }} entry fee</p>
              <p class="entry-count">{{ getEntryCount(participant.email) }} entries</p>
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
        </div>
        <p v-if="entryError" class="error">{{ entryError }}</p>
        <div class="entries-list">
          <p v-if="entries.length === 0">No entries yet</p>
          <div v-for="entry in entries" :key="entry.id" class="entry-item">
            <div>
              <strong>{{ entry.participantName }}</strong>
              <p class="entry-id">ID: {{ entry.id }}</p>
              <p class="players">Players: {{ (entry.playerNames || entry.playerIds || []).length }}/15</p>
              <p class="score">Score: {{ entry.totalScore }} pts</p>
            </div>
            <button @click="removeEntry(entry.id)" class="btn-danger">Remove</button>
          </div>
        </div>
      </section>

      <!-- Assign Players to Entry Section -->
      <section class="admin-section">
        <h3>Assign Players to Entry</h3>
        <div class="form-group">
          <select v-model="assignForm.email" @change="onAssignParticipantChange">
            <option value="">Select Participant</option>
            <option v-for="p in participants" :key="p.email" :value="p.email">
              {{ p.name }}
            </option>
          </select>
          <select v-model="assignForm.entryId">
            <option value="">Select Entry</option>
            <option v-for="entry in assignParticipantEntries" :key="entry.id" :value="entry.id">
              {{ entry.id }} ({{ (entry.playerNames || entry.playerIds || []).length }} players)
            </option>
          </select>
        </div>
        <div class="form-group">
          <textarea
            v-model="assignForm.playerNamesText"
            placeholder="Enter 15 player names (one per line)"
            class="player-names-textarea"
          ></textarea>
        </div>
        <div class="form-group">
          <button @click="assignPlayers" class="btn-primary">Assign Players</button>
        </div>
        <p v-if="assignError" class="error">{{ assignError }}</p>
        <p v-if="assignSuccess" class="success">{{ assignSuccess }}</p>
      </section>

      <!-- Scoring Updates from Player Stats Section -->
      <section class="admin-section">
        <h3>Scoring Updates from Player Stats</h3>
        <p class="section-description">Paste player stats (NAME  PTS, one per line)</p>
        <p class="section-description">Example: Mats Zuccarello  3</p>
        <div class="form-group">
          <textarea
            v-model="playerStatsInput"
            placeholder="Mats Zuccarello  3&#10;Kirill Kaprizov  3&#10;Matt Boldy  3"
            class="player-stats-input"
          ></textarea>
          <button @click="processPlayerStats" class="btn-primary">Process Stats</button>
        </div>
        <p v-if="playerStatsError" class="error">{{ playerStatsError }}</p>
        <p v-if="playerStatsSuccess" class="success">{{ playerStatsSuccess }}</p>
        <div class="player-stats-results" v-if="playerStatsResults.length > 0">
          <h4>Processing Results</h4>
          <div v-for="(result, idx) in playerStatsResults" :key="idx" class="result-entry" :class="{ success: result.success, failure: !result.success }">
            <p><strong>{{ result.playerName }}</strong></p>
            <p class="result-detail">Points: {{ result.points }}</p>
            <p v-if="!result.success" class="result-detail error-detail">{{ result.reason }}</p>
          </div>
        </div>
      </section>

      <!-- Goalie Stats Section -->
      <section class="admin-section">
        <h3>Goalie Stats</h3>
        <p class="section-description">Paste goalie stats (NAME  WINS  SHUTOUTS, one per line)</p>
        <p class="section-description">Scoring: 1 pt per win + 2 extra pts per shutout</p>
        <p class="section-description">Example: Frederik Andersen  1  1  (= 3 pts)</p>
        <div class="form-group">
          <textarea
            v-model="goalieStatsInput"
            placeholder="Frederik Andersen  1  1&#10;Jesper Wallstedt  1  0&#10;Dan Vladar  1  0"
            class="player-stats-input"
          ></textarea>
          <button @click="processGoalieStats" class="btn-primary">Process Goalie Stats</button>
        </div>
        <p v-if="goalieStatsError" class="error">{{ goalieStatsError }}</p>
        <p v-if="goalieStatsSuccess" class="success">{{ goalieStatsSuccess }}</p>
        <div class="player-stats-results" v-if="goalieStatsResults.length > 0">
          <h4>Goalie Processing Results</h4>
          <div v-for="(result, idx) in goalieStatsResults" :key="idx" class="result-entry" :class="{ success: result.success, failure: !result.success }">
            <p><strong>{{ result.playerName }}</strong></p>
            <p class="result-detail">Wins: {{ result.wins }}, Shutouts: {{ result.shutouts }} → {{ result.points }} pts</p>
            <p v-if="!result.success" class="result-detail error-detail">{{ result.reason }}</p>
          </div>
        </div>
      </section>

      <!-- Export Section -->
      <section class="admin-section">
        <h3>Export Data</h3>
        <button @click="exportToCSV" class="btn-primary">Export Standings to CSV</button>
        <p v-if="exportMessage" class="success">{{ exportMessage }}</p>
      </section>

      <!-- Trash Talk Ticker Section -->
      <section class="admin-section">
        <h3>Trash Talk Ticker</h3>
        <div class="form-group">
          <input v-model="newTickerMessage" placeholder="Enter trash talk message" @keyup.enter="addTickerMessage" />
          <button @click="addTickerMessage" class="btn-primary">Add Message</button>
        </div>
        <p v-if="tickerError" class="error">{{ tickerError }}</p>
        <p v-if="tickerSuccess" class="success">{{ tickerSuccess }}</p>
        <div class="ticker-list">
          <p v-if="tickerMessages.length === 0">No ticker messages yet</p>
          <div v-for="msg in tickerMessages" :key="msg.id" class="ticker-item">
            <span class="ticker-msg-text">{{ msg.message }}</span>
            <button @click="removeTickerMessage(msg.id)" class="btn-danger">Remove</button>
          </div>
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
import { apiService } from '../services/apiService'

export default {
  name: 'AdminView',
  setup() {
    const participantsStore = useParticipantsStore()
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    const isAuthenticated = ref(false)
    const password = ref('')
    const authError = ref('')
    const apiError = ref('')
    const adminPassword = 'admin123'

    // Participant form
    const newParticipant = ref({ name: '', email: '', entryFee: 20 })
    const participantError = ref('')

    // Entry form
    const newEntry = ref({ email: '' })
    const entryError = ref('')
    const exportMessage = ref('')

    // Assign players form
    const assignForm = ref({ email: '', entryId: '', playerNamesText: '' })
    const assignError = ref('')
    const assignSuccess = ref('')

    // Player stats form
    const playerStatsInput = ref('')
    const playerStatsError = ref('')
    const playerStatsSuccess = ref('')
    const playerStatsResults = ref([])

    // Goalie stats form
    const goalieStatsInput = ref('')
    const goalieStatsError = ref('')
    const goalieStatsSuccess = ref('')
    const goalieStatsResults = ref([])

    // Ticker form
    const newTickerMessage = ref('')
    const tickerMessages = ref([])
    const tickerError = ref('')
    const tickerSuccess = ref('')
    const participants = computed(() => participantsStore.participants)
    const entries = computed(() => entriesStore.entries)

    const getEntryCount = (email) => {
      return entries.value.filter(e => e.email === email).length
    }

    const assignParticipantEntries = computed(() => {
      if (!assignForm.value.email) return []
      return entries.value.filter(e => e.email === assignForm.value.email)
    })

    const totalFees = computed(() => {
      return participants.value.reduce((sum, p) => {
        const count = getEntryCount(p.email)
        return sum + (p.entryFee * count)
      }, 0)
    })

    const entriesWithPlayers = computed(() => {
      return entries.value.filter(e => (e.playerNames || e.playerIds || []).length > 0).length
    })

    // Helper: refresh all pool data from API
    const refreshPoolData = async () => {
      try {
        const data = await apiService.fetchPoolData()
        participantsStore.hydrateFromData(data.participants)
        entriesStore.hydrateFromData(data.entries)
        scoresStore.hydrateFromData(data.scoringEvents)
      } catch (err) {
        apiError.value = 'Failed to refresh data: ' + err.message
      }
    }

    // Restore auth state from localStorage
    onMounted(() => {
      try {
        const stored = localStorage.getItem('adminAuthenticated')
        if (stored === 'true') {
          isAuthenticated.value = true
          loadTickerMessages()
        }
      } catch (e) { /* ignore */ }
    })

    const authenticate = () => {
      if (password.value === adminPassword) {
        isAuthenticated.value = true
        authError.value = ''
        password.value = ''
        try { localStorage.setItem('adminAuthenticated', 'true') } catch (e) { /* ignore */ }
      } else {
        authError.value = 'Invalid password'
      }
    }

    const logout = () => {
      isAuthenticated.value = false
      password.value = ''
      try { localStorage.removeItem('adminAuthenticated') } catch (e) { /* ignore */ }
    }

    const addParticipant = async () => {
      participantError.value = ''
      apiError.value = ''
      if (!newParticipant.value.name.trim()) { participantError.value = 'Name is required'; return }
      if (!newParticipant.value.email.trim()) { participantError.value = 'Email is required'; return }
      if (newParticipant.value.entryFee <= 0) { participantError.value = 'Entry fee must be greater than 0'; return }
      try {
        await apiService.createParticipant(
          newParticipant.value.email,
          newParticipant.value.name,
          newParticipant.value.entryFee
        )
        await refreshPoolData()
        newParticipant.value = { name: '', email: '', entryFee: 20 }
      } catch (error) {
        participantError.value = error.message
      }
    }

    const removeParticipant = async (email) => {
      if (!confirm(`Remove participant ${email}? This will also remove all their entries.`)) return
      apiError.value = ''
      try {
        await apiService.deleteParticipant(email)
        await refreshPoolData()
      } catch (error) {
        apiError.value = 'Failed to remove participant: ' + error.message
      }
    }

    const createEntry = async () => {
      entryError.value = ''
      apiError.value = ''
      if (!newEntry.value.email) { entryError.value = 'Please select a participant'; return }
      const participant = participantsStore.getParticipant(newEntry.value.email)
      if (!participant) { entryError.value = 'Participant not found'; return }
      try {
        await apiService.createEntry(newEntry.value.email, participant.name)
        await refreshPoolData()
        newEntry.value.email = ''
      } catch (error) {
        entryError.value = error.message
      }
    }

    const removeEntry = async (entryId) => {
      if (!confirm(`Remove entry ${entryId}?`)) return
      apiError.value = ''
      try {
        await apiService.deleteEntry(entryId)
        await refreshPoolData()
      } catch (error) {
        apiError.value = 'Failed to remove entry: ' + error.message
      }
    }

    const onAssignParticipantChange = () => {
      assignForm.value.entryId = ''
    }

    const assignPlayers = async () => {
      assignError.value = ''
      assignSuccess.value = ''
      apiError.value = ''
      if (!assignForm.value.entryId) { assignError.value = 'Please select an entry'; return }
      const playerNames = assignForm.value.playerNamesText
        .split(/\n/)
        .map(n => n.trim())
        .filter(n => n.length > 0)
      if (playerNames.length !== 15) {
        assignError.value = `Must provide exactly 15 player names (got ${playerNames.length})`
        return
      }
      try {
        await apiService.assignPlayers(assignForm.value.entryId, playerNames)
        await refreshPoolData()
        assignSuccess.value = 'Players assigned successfully!'
        assignForm.value.playerNamesText = ''
        setTimeout(() => { assignSuccess.value = '' }, 3000)
      } catch (error) {
        assignError.value = error.message
      }
    }

    const processPlayerStats = async () => {
      playerStatsError.value = ''
      playerStatsSuccess.value = ''
      playerStatsResults.value = []
      apiError.value = ''

      if (!playerStatsInput.value.trim()) {
        playerStatsError.value = 'Please enter player stats'
        return
      }

      const lines = playerStatsInput.value.trim().split('\n')
      const players = []
      for (const line of lines) {
        if (!line.trim()) continue
        const parts = line.trim().split(/\s+/)
        if (parts.length < 2) continue
        const pts = parseInt(parts[parts.length - 1])
        const playerName = parts.slice(0, -1).join(' ')
        if (!isNaN(pts) && pts >= 0) {
          players.push({ playerName, points: pts })
        }
      }

      if (players.length === 0) {
        playerStatsError.value = 'No valid player stats found'
        return
      }

      try {
        const response = await apiService.updateScores(players)
        playerStatsResults.value = response.results || []
        const successCount = playerStatsResults.value.filter(r => r.success).length
        const failureCount = playerStatsResults.value.filter(r => !r.success).length
        if (successCount > 0) {
          playerStatsSuccess.value = `Processed ${successCount} player stat(s)`
          if (failureCount > 0) playerStatsSuccess.value += ` (${failureCount} failed)`
        } else {
          playerStatsError.value = `Failed to process ${failureCount} player stat(s)`
        }
        await refreshPoolData()
        playerStatsInput.value = ''
        setTimeout(() => { playerStatsResults.value = [] }, 5000)
      } catch (error) {
        playerStatsError.value = error.message
      }
    }

    const processGoalieStats = async () => {
      goalieStatsError.value = ''
      goalieStatsSuccess.value = ''
      goalieStatsResults.value = []
      apiError.value = ''

      if (!goalieStatsInput.value.trim()) {
        goalieStatsError.value = 'Please enter goalie stats'
        return
      }

      const lines = goalieStatsInput.value.trim().split('\n')
      const players = []
      for (const line of lines) {
        if (!line.trim()) continue
        const parts = line.trim().split(/\s+/)
        if (parts.length < 3) continue
        const shutouts = parseInt(parts[parts.length - 1])
        const wins = parseInt(parts[parts.length - 2])
        const playerName = parts.slice(0, -2).join(' ')
        if (!isNaN(wins) && !isNaN(shutouts) && wins >= 0 && shutouts >= 0) {
          const points = wins + (shutouts * 2)
          players.push({ playerName, points, wins, shutouts })
        }
      }

      if (players.length === 0) {
        goalieStatsError.value = 'No valid goalie stats found. Format: NAME  WINS  SHUTOUTS'
        return
      }

      try {
        const response = await apiService.updateScores(
          players.map(p => ({ playerName: p.playerName, points: p.points }))
        )
        goalieStatsResults.value = (response.results || []).map((r, i) => ({
          ...r,
          wins: players[i]?.wins ?? 0,
          shutouts: players[i]?.shutouts ?? 0
        }))
        const successCount = goalieStatsResults.value.filter(r => r.success).length
        const failureCount = goalieStatsResults.value.filter(r => !r.success).length
        if (successCount > 0) {
          goalieStatsSuccess.value = `Processed ${successCount} goalie stat(s)`
          if (failureCount > 0) goalieStatsSuccess.value += ` (${failureCount} failed)`
        } else {
          goalieStatsError.value = `Failed to process ${failureCount} goalie stat(s)`
        }
        await refreshPoolData()
        goalieStatsInput.value = ''
        setTimeout(() => { goalieStatsResults.value = [] }, 5000)
      } catch (error) {
        goalieStatsError.value = error.message
      }
    }

    const loadTickerMessages = async () => {
      try {
        tickerMessages.value = await apiService.getTickerMessages()
      } catch (e) { /* ignore */ }
    }

    const addTickerMessage = async () => {
      tickerError.value = ''
      tickerSuccess.value = ''
      if (!newTickerMessage.value.trim()) { tickerError.value = 'Message is required'; return }
      try {
        await apiService.postTickerMessage(newTickerMessage.value.trim())
        newTickerMessage.value = ''
        await loadTickerMessages()
        if (window.__refreshTicker) window.__refreshTicker()
        tickerSuccess.value = 'Message added!'
        setTimeout(() => { tickerSuccess.value = '' }, 3000)
      } catch (error) {
        tickerError.value = error.message
      }
    }

    const removeTickerMessage = async (id) => {
      tickerError.value = ''
      try {
        await apiService.deleteTickerMessage(id)
        await loadTickerMessages()
        if (window.__refreshTicker) window.__refreshTicker()
      } catch (error) {
        tickerError.value = error.message
      }
    }

    const exportToCSV = () => {
      exportMessage.value = ''
      try {
        const sortedEntries = [...entries.value].sort((a, b) => {
          if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
          return new Date(a.createdAt) - new Date(b.createdAt)
        })
        let csv = 'Rank,Participant Name,Entry ID,Players Selected,Total Points\n'
        sortedEntries.forEach((entry, idx) => {
          const playerCount = (entry.playerNames || entry.playerIds || []).length
          csv += [idx + 1, `"${entry.participantName}"`, entry.id, playerCount, entry.totalScore].join(',') + '\n'
        })
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.setAttribute('href', URL.createObjectURL(blob))
        link.setAttribute('download', `nhl-pool-standings-${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        exportMessage.value = 'CSV exported successfully!'
        setTimeout(() => { exportMessage.value = '' }, 3000)
      } catch (error) {
        exportMessage.value = `Export failed: ${error.message}`
      }
    }

    return {
      isAuthenticated, password, authError, apiError,
      newParticipant, participantError,
      newEntry, entryError, exportMessage,
      assignForm, assignError, assignSuccess, assignParticipantEntries,
      playerStatsInput, playerStatsError, playerStatsSuccess, playerStatsResults,
      goalieStatsInput, goalieStatsError, goalieStatsSuccess, goalieStatsResults,
      newTickerMessage, tickerMessages, tickerError, tickerSuccess,
      participants, entries, totalFees, entriesWithPlayers,
      getEntryCount, onAssignParticipantChange,
      authenticate, logout,
      addParticipant, removeParticipant,
      createEntry, removeEntry,
      assignPlayers, processPlayerStats, processGoalieStats,
      addTickerMessage, removeTickerMessage,
      exportToCSV
    }
  }
}
</script>

<style scoped>
.admin-view { padding: 0; max-width: 1200px; margin: 0 auto; }
.admin-view h2 { margin: 0 0 20px 0; color: var(--text-heading); font-size: 1.8rem; font-weight: 700; }
.auth-section { max-width: 400px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; }
.auth-section h3 { margin-top: 0; color: var(--text-primary); }
.auth-section input { width: 100%; padding: 10px; margin-bottom: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 1rem; box-sizing: border-box; background: var(--bg-input); color: var(--text-primary); }
.auth-section button { width: 100%; padding: 10px; background: var(--btn-bg); color: var(--btn-text); border: none; border-radius: 4px; cursor: pointer; font-size: 1rem; font-weight: 600; }
.auth-section button:hover { background: var(--btn-hover); }
.error { color: var(--error-color); margin-top: 8px; font-size: 0.9rem; }
.success { color: var(--success-color); margin-top: 8px; font-size: 0.9rem; }
.api-error { padding: 10px; background: var(--bg-card); border: 1px solid var(--error-color); border-radius: 4px; margin-bottom: 16px; color: var(--error-color); }
.admin-content { position: relative; }
.logout-btn { position: absolute; top: 0; right: 0; padding: 6px 14px; background: var(--btn-bg); color: var(--btn-text); border: none; border-radius: 4px; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
.logout-btn:hover { background: var(--btn-hover); }
.admin-section { margin-top: 24px; padding: 20px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; }
.admin-section h3 { margin-top: 0; color: var(--text-heading); font-size: 1.2rem; font-weight: 700; }
.admin-section h4 { margin: 12px 0 8px 0; color: var(--text-primary); }
.form-group { display: flex; gap: 8px; margin-bottom: 8px; flex-wrap: wrap; }
.form-group input, .form-group select { flex: 1; min-width: 150px; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.9rem; background: var(--bg-input); color: var(--text-primary); }
.form-group select { flex: 1.5; }
.btn-primary { padding: 8px 18px; background: var(--btn-bg); color: var(--btn-text); border: none; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 600; white-space: nowrap; }
.btn-primary:hover { background: var(--btn-hover); }
.btn-danger { padding: 6px 14px; background: var(--btn-danger-bg); color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 0.85rem; font-weight: 600; }
.btn-danger:hover { background: var(--btn-danger-hover); }
.participant-list, .entries-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.participant-item, .entry-item { display: flex; justify-content: space-between; align-items: center; padding: 12px; background: var(--bg-row-even); border: 1px solid var(--border-light); border-radius: 4px; }
.participant-item div, .entry-item div { flex: 1; }
.participant-item p, .entry-item p { margin: 2px 0; font-size: 0.85rem; }
.participant-item strong, .entry-item strong { color: var(--text-heading); }
.email, .entry-id, .players { color: var(--text-secondary); }
.fee, .score { font-weight: 600; color: var(--text-primary); }
.entry-count { color: var(--text-primary); font-weight: 600; }
.section-description { font-size: 0.85rem; color: var(--text-secondary); margin: 6px 0; font-style: italic; }
.player-names-textarea, .player-stats-input { width: 100%; min-height: 150px; padding: 10px; border: 1px solid var(--border-color); border-radius: 4px; font-family: var(--font-mono); font-size: 0.85rem; box-sizing: border-box; resize: vertical; background: var(--bg-input); color: var(--text-primary); }
.player-stats-results { margin-top: 12px; padding: 12px; background: var(--bg-row-even); border-radius: 4px; }
.result-entry { padding: 8px; background: var(--bg-card); border-left: 3px solid var(--border-color); margin-bottom: 6px; border-radius: 0 4px 4px 0; }
.result-entry.success { border-left-color: var(--success-color); }
.result-entry.failure { border-left-color: var(--error-color); }
.result-detail { font-size: 0.8rem; color: var(--text-secondary); margin: 2px 0 0 0; }
.error-detail { color: var(--error-color); font-weight: 600; }
.summary { border-color: var(--text-heading); }
.ticker-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.ticker-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: var(--bg-row-even); border: 1px solid var(--border-light); border-radius: 4px; }
.ticker-msg-text { color: var(--text-primary); font-size: 0.9rem; flex: 1; margin-right: 12px; }
.summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-top: 12px; }
.summary-item { padding: 14px; background: var(--bg-row-even); border-radius: 4px; text-align: center; border: 1px solid var(--border-light); }
.summary-item .label { font-size: 0.8rem; color: var(--text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
.summary-item .value { font-size: 1.8rem; font-weight: 700; color: var(--text-heading); margin: 8px 0 0 0; }
</style>
