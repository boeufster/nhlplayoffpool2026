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

      <!-- Manual Score Updates Section -->
      <section class="admin-section">
        <h3>Manual Score Updates</h3>
        <div class="form-group">
          <select v-model="scoreUpdate.entryId">
            <option value="">Select Entry</option>
            <option v-for="entry in entries" :key="entry.id" :value="entry.id">
              {{ entry.participantName }} - {{ entry.id }}
            </option>
          </select>
          <input v-model.number="scoreUpdate.points" placeholder="Points to add" type="number" />
          <button @click="updateScore" class="btn-primary">Update Score</button>
          <p v-if="scoreError" class="error">{{ scoreError }}</p>
        </div>
        <div class="score-log">
          <h4>Score Update Log</h4>
          <p v-if="scoreLogs.length === 0">No manual updates yet</p>
          <div v-for="(log, idx) in scoreLogs" :key="idx" class="log-entry">
            <p><strong>{{ log.entryId }}</strong> +{{ log.points }} pts</p>
            <p class="timestamp">{{ formatTime(log.timestamp) }} by {{ log.adminId }}</p>
          </div>
        </div>
      </section>

      <!-- Export Section -->
      <section class="admin-section">
        <h3>Export Data</h3>
        <button @click="exportToCSV" class="btn-primary">Export Standings to CSV</button>
        <p v-if="exportMessage" class="success">{{ exportMessage }}</p>
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
import { ref, computed } from 'vue'
import { useParticipantsStore } from '../stores/participants'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'

export default {
  name: 'AdminView',
  setup() {
    const participantsStore = useParticipantsStore()
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

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

    // Score update form
    const scoreUpdate = ref({
      entryId: '',
      points: 0
    })
    const scoreError = ref('')
    const exportMessage = ref('')

    // Manual score update logs
    const scoreLogs = ref([])

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

    const authenticate = () => {
      if (password.value === adminPassword) {
        isAuthenticated.value = true
        authError.value = ''
        password.value = ''
        loadScoreLogs()
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

    const updateScore = () => {
      scoreError.value = ''
      if (!scoreUpdate.value.entryId) {
        scoreError.value = 'Please select an entry'
        return
      }
      if (scoreUpdate.value.points === 0) {
        scoreError.value = 'Points must be non-zero'
        return
      }
      const entry = entriesStore.getEntry(scoreUpdate.value.entryId)
      if (!entry) {
        scoreError.value = 'Entry not found'
        return
      }
      entriesStore.updateEntryScore(scoreUpdate.value.entryId, scoreUpdate.value.points)
      
      // Log the manual update
      const log = {
        entryId: scoreUpdate.value.entryId,
        points: scoreUpdate.value.points,
        timestamp: new Date().toISOString(),
        adminId: adminId
      }
      scoreLogs.value.push(log)
      saveScoreLogs()
      
      scoreUpdate.value = { entryId: '', points: 0 }
    }

    const saveScoreLogs = () => {
      try {
        if (typeof localStorage !== 'undefined' && localStorage) {
          localStorage.setItem('manualScoreLogs', JSON.stringify(scoreLogs.value))
        }
      } catch (error) {
        console.error('Error saving score logs:', error)
      }
    }

    const loadScoreLogs = () => {
      try {
        const stored = localStorage.getItem('manualScoreLogs')
        if (stored && typeof stored === 'string' && stored.length > 0) {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            scoreLogs.value = parsed
          }
        }
      } catch (error) {
        console.error('Error loading score logs:', error)
        scoreLogs.value = []
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

    return {
      isAuthenticated,
      password,
      authError,
      newParticipant,
      participantError,
      newEntry,
      entryError,
      scoreUpdate,
      scoreError,
      exportMessage,
      participants,
      entries,
      scoreLogs,
      totalFees,
      entriesWithPlayers,
      authenticate,
      logout,
      addParticipant,
      removeParticipant,
      createEntry,
      removeEntry,
      updateScore,
      exportToCSV,
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
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
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
</style>
