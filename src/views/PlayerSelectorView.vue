<template>
  <div class="player-selector-view">
    <h2>Player Selection</h2>
    
    <div class="selector-container">
      <div class="controls">
        <div class="participant-select">
          <label for="participant">Select Participant:</label>
          <select v-model="selectedParticipantEmail" id="participant" @change="onParticipantChange">
            <option value="">-- Choose a participant --</option>
            <option v-for="p in participants" :key="p.email" :value="p.email">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div v-if="selectedParticipantEmail" class="entry-select">
          <label for="entry">Select Entry:</label>
          <select v-model="selectedEntryId" id="entry" @change="onEntryChange">
            <option value="">-- Create new entry --</option>
            <option v-for="entry in participantEntries" :key="entry.id" :value="entry.id">
              {{ entry.id }} ({{ entry.playerNames ? entry.playerNames.length : 0 }} players)
            </option>
          </select>
        </div>
      </div>

      <!-- Text Input Section -->
      <div class="text-input-section">
        <h3>Enter Player Names</h3>
        <p class="input-description">Paste or enter 15 player names (one per line or comma-separated)</p>
        
        <textarea
          v-model="playerNamesInput"
          placeholder="Enter 15 player names (one per line or comma-separated)"
          class="player-names-textarea"
          @input="updatePlayerCount"
        ></textarea>

        <div class="input-stats">
          <p>Player count: <strong>{{ detectedPlayerCount }}/{{ MAX_PLAYERS }}</strong></p>
          <p class="character-count">Characters: {{ playerNamesInput.length }}</p>
        </div>

        <div class="text-input-actions">
          <button
            @click="submitTextInput"
            :disabled="detectedPlayerCount !== MAX_PLAYERS || !selectedParticipantEmail"
            class="submit-btn"
          >
            Submit Entry
          </button>
          <button @click="clearTextInput" class="clear-btn">Clear</button>
        </div>

        <div v-if="textInputError" class="error-message">
          {{ textInputError }}
        </div>
      </div>

      <!-- Selected Players Display Section -->
      <div class="selected-players-section">
        <h3>Selected Players</h3>
        <div v-if="submittedPlayers.length === 0" class="no-players">
          No players selected yet
        </div>
        <div v-else class="players-list">
          <div v-for="(player, idx) in submittedPlayers" :key="player.id" class="player-item">
            <span class="player-number">{{ idx + 1 }}.</span>
            <span class="player-name">{{ player.name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useParticipantsStore } from '../stores/participants'
import { usePlayerSelectionStore } from '../stores/playerSelection'
import { useEntriesStore } from '../stores/entries'

export default {
  name: 'PlayerSelectorView',
  setup() {
    const participantsStore = useParticipantsStore()
    const playerSelectionStore = usePlayerSelectionStore()
    const entriesStore = useEntriesStore()

    const selectedParticipantEmail = ref('')
    const selectedPosition = ref(null)
    const selectedEntryId = ref('')
    
    // Text input state
    const playerNamesInput = ref('')
    const detectedPlayerCount = ref(0)
    const textInputError = ref('')
    const submittedPlayers = ref([])

    const MAX_PLAYERS = 15
    const positions = ['F', 'D', 'G']
    const positionLabels = {
      'F': 'Forwards',
      'D': 'Defensemen',
      'G': 'Goalies'
    }

    const participants = computed(() => participantsStore.participants)
    const selectedPlayers = computed(() => playerSelectionStore.selectedPlayers)
    const availablePlayers = computed(() => playerSelectionStore.availablePlayers)

    const participantEntries = computed(() => {
      if (!selectedParticipantEmail.value) return []
      return entriesStore.entries.filter(e => e.email === selectedParticipantEmail.value)
    })

    const filteredAvailablePlayers = computed(() => {
      let players = availablePlayers.value.filter(
        p => !playerSelectionStore.isPlayerSelected(p.id)
      )

      if (selectedPosition.value) {
        players = players.filter(p => p.position === selectedPosition.value)
      }

      return players
    })

    const isSelectionComplete = computed(() => {
      return selectedPlayers.value.length === MAX_PLAYERS
    })

    const updatePlayerCount = () => {
      // Count players from text input (one per line or comma-separated)
      if (!playerNamesInput.value.trim()) {
        detectedPlayerCount.value = 0
        return
      }

      // Split by newlines and commas, filter out empty strings
      const players = playerNamesInput.value
        .split(/[\n,]+/)
        .map(name => name.trim())
        .filter(name => name.length > 0)

      detectedPlayerCount.value = players.length
    }

    const clearTextInput = () => {
      playerNamesInput.value = ''
      detectedPlayerCount.value = 0
      textInputError.value = ''
    }

    const onParticipantChange = () => {
      selectedEntryId.value = ''
      submittedPlayers.value = []
      clearTextInput()
    }

    const onEntryChange = () => {
      if (!selectedEntryId.value) {
        submittedPlayers.value = []
        clearTextInput()
        return
      }

      const entry = entriesStore.getEntry(selectedEntryId.value)
      if (entry && entry.playerNames) {
        submittedPlayers.value = entry.playerNames.map((name, idx) => ({
          id: idx,
          name: name
        }))
        playerNamesInput.value = entry.playerNames.join('\n')
        updatePlayerCount()
      }
    }

    const submitTextInput = () => {
      if (!selectedParticipantEmail.value) {
        textInputError.value = 'Please select a participant'
        return
      }

      if (detectedPlayerCount.value !== MAX_PLAYERS) {
        textInputError.value = `Please enter exactly ${MAX_PLAYERS} players`
        return
      }

      try {
        const participant = participantsStore.getParticipant(selectedParticipantEmail.value)
        
        // Parse player names from input
        const playerNames = playerNamesInput.value
          .split(/[\n,]+/)
          .map(name => name.trim())
          .filter(name => name.length > 0)

        let entryId
        if (selectedEntryId.value) {
          // Update existing entry
          entryId = selectedEntryId.value
          entriesStore.setEntryPlayerNames(entryId, playerNames)
          alert('Entry updated successfully!')
        } else {
          // Create new entry
          const entry = entriesStore.createEntry(
            selectedParticipantEmail.value,
            participant.name
          )
          entryId = entry.id
          entriesStore.setEntryPlayerNames(entryId, playerNames)
          selectedEntryId.value = entryId
          alert('Entry submitted successfully!')
        }

        // Update submitted players list for display
        submittedPlayers.value = playerNames.map((name, idx) => ({
          id: idx,
          name: name
        }))

        // Clear input for next entry
        clearTextInput()
      } catch (error) {
        textInputError.value = 'Failed to submit entry: ' + error.message
        console.error('Error submitting entry:', error)
      }
    }

    const selectPlayer = (player) => {
      try {
        playerSelectionStore.selectPlayer(player)
      } catch (error) {
        console.error('Error selecting player:', error)
      }
    }

    const deselectPlayer = (playerId) => {
      playerSelectionStore.deselectPlayer(playerId)
    }

    const clearSelection = () => {
      playerSelectionStore.clearSelection()
    }

    const submitSelection = () => {
      if (!selectedParticipantEmail.value) {
        errorMessage.value = 'Please select a participant'
        return
      }

      if (!isSelectionComplete.value) {
        errorMessage.value = 'Please select exactly 15 players'
        return
      }

      try {
        const participant = participantsStore.getParticipant(selectedParticipantEmail.value)
        const entry = entriesStore.createEntry(
          selectedParticipantEmail.value,
          participant.name
        )
        entriesStore.setEntryPlayers(entry.id, playerSelectionStore.getSelectedPlayerIds())
        
        // Clear selection for next entry
        playerSelectionStore.clearSelection()
        selectedParticipantEmail.value = ''
        errorMessage.value = ''
        
        alert('Entry submitted successfully!')
      } catch (error) {
        errorMessage.value = 'Failed to submit entry: ' + error.message
        console.error('Error submitting entry:', error)
      }
    }

    return {
      selectedParticipantEmail,
      selectedPosition,
      selectedEntryId,
      MAX_PLAYERS,
      positions,
      positionLabels,
      participants,
      participantEntries,
      selectedPlayers,
      availablePlayers,
      filteredAvailablePlayers,
      isSelectionComplete,
      selectPlayer,
      deselectPlayer,
      clearSelection,
      submitSelection,
      // Text input methods and state
      playerNamesInput,
      detectedPlayerCount,
      textInputError,
      submittedPlayers,
      updatePlayerCount,
      clearTextInput,
      submitTextInput,
      onParticipantChange,
      onEntryChange
    }
  }
}
</script>

<style scoped>
.player-selector-view {
  padding: 20px;
}

.player-selector-view h2 {
  margin-top: 0;
}

.selector-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.participant-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-select label {
  font-weight: 600;
}

.participant-select select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.entry-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-select label {
  font-weight: 600;
}

.entry-select select {
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

/* Text Input Section Styles */
.text-input-section {
  padding: 20px;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
}

.text-input-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #333;
}

.input-description {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 0.95rem;
}

.player-names-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.95rem;
  resize: vertical;
  box-sizing: border-box;
}

.player-names-textarea:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 5px rgba(76, 175, 80, 0.3);
}

.input-stats {
  display: flex;
  gap: 20px;
  margin: 12px 0;
  font-size: 0.95rem;
}

.input-stats p {
  margin: 0;
  color: #666;
}

.input-stats strong {
  color: #333;
}

.character-count {
  color: #999;
  font-size: 0.85rem;
}

.text-input-actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.error-message {
  margin-top: 12px;
  padding: 10px;
  background: #ffebee;
  border: 1px solid #ef5350;
  border-radius: 4px;
  color: #c62828;
  font-size: 0.9rem;
}

/* Grid Selection Section */
.grid-selection-section {
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.grid-selection-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
}

.position-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  margin-bottom: 15px;
}

.position-filters label {
  font-weight: 600;
}

.position-filters button {
  padding: 8px 16px;
  border: 2px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.position-filters button:hover {
  border-color: #333;
}

.position-filters button.active {
  background: #333;
  color: white;
  border-color: #333;
}

.selection-status {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px;
  background: #e3f2fd;
  border-radius: 4px;
  margin-bottom: 15px;
}

.selection-status p {
  margin: 0;
  font-size: 1.1rem;
}

.submit-btn {
  padding: 10px 20px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #45a049;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.clear-btn {
  padding: 10px 20px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #da190b;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.available-players,
.selected-players {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.available-players h4,
.selected-players h4 {
  margin-top: 0;
  margin-bottom: 15px;
}

.players-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.player-card {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.player-card.available:hover {
  border-color: #4caf50;
  background: #f1f8f4;
}

.player-card.selected {
  background: #c8e6c9;
  border-color: #4caf50;
  position: relative;
}

.player-card.selected:hover {
  background: #a5d6a7;
}

.player-name {
  font-weight: 600;
  margin-bottom: 5px;
}

.player-info {
  font-size: 0.9rem;
  color: #666;
}

.remove-hint {
  font-size: 0.8rem;
  color: #666;
  margin-top: 5px;
  font-style: italic;
}

/* Selected Players Section */
.selected-players-section {
  padding: 20px;
  background: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 4px;
}

.selected-players-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.no-players {
  padding: 20px;
  text-align: center;
  color: #999;
  font-style: italic;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 10px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  gap: 12px;
}

.player-number {
  font-weight: 600;
  color: #666;
  min-width: 30px;
}

.player-name {
  flex: 1;
  color: #333;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
