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
  color: #00d4ff;
  font-size: 2rem;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  margin-bottom: 30px;
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
  padding: 25px;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 2px solid #00d4ff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.1);
  position: relative;
  overflow: hidden;
}

.controls::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #00d4ff, transparent);
  animation: shimmer 3s infinite;
}

.participant-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.participant-select label {
  font-weight: 700;
  color: #00d4ff;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
}

.participant-select select {
  padding: 12px;
  border: 2px solid #2a2f4a;
  border-radius: 6px;
  font-size: 1rem;
  background: #0a0e27;
  color: #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.participant-select select:hover {
  border-color: #00d4ff;
}

.participant-select select:focus {
  border-color: #00d4ff;
  outline: none;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

.entry-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.entry-select label {
  font-weight: 700;
  color: #00d4ff;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-size: 0.9rem;
}

.entry-select select {
  padding: 12px;
  border: 2px solid #2a2f4a;
  border-radius: 6px;
  font-size: 1rem;
  background: #0a0e27;
  color: #e0e0e0;
  transition: all 0.3s ease;
  cursor: pointer;
}

.entry-select select:hover {
  border-color: #00d4ff;
}

.entry-select select:focus {
  border-color: #00d4ff;
  outline: none;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
}

/* Text Input Section Styles */
.text-input-section {
  padding: 25px;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 3px solid #c41e3a;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(196, 30, 58, 0.2);
  position: relative;
  overflow: hidden;
}

.text-input-section::before {
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

.text-input-section h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #00d4ff;
  font-size: 1.5rem;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
}

.input-description {
  margin: 0 0 15px 0;
  color: #a0a0a0;
  font-size: 0.95rem;
  font-style: italic;
}

.player-names-textarea {
  width: 100%;
  min-height: 150px;
  padding: 12px;
  border: 2px solid #2a2f4a;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-size: 0.95rem;
  resize: vertical;
  box-sizing: border-box;
  background: #0a0e27;
  color: #e0e0e0;
  transition: all 0.3s ease;
}

.player-names-textarea:focus {
  border-color: #00d4ff;
  outline: none;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.05);
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
  color: #a0a0a0;
}

.input-stats strong {
  color: #00d4ff;
}

.character-count {
  color: #888;
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
  background: #3a1a1a;
  border: 1px solid #c41e3a;
  border-radius: 4px;
  color: #ff6b6b;
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
  background: #51cf66;
  color: #0a0e27;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: background 0.2s;
}

.submit-btn:hover:not(:disabled) {
  background: #40c057;
}

.submit-btn:disabled {
  background: #555;
  color: #999;
  cursor: not-allowed;
}

.clear-btn {
  padding: 10px 20px;
  background: #c41e3a;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background 0.2s;
}

.clear-btn:hover {
  background: #a01830;
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
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 3px solid #00d4ff;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.15);
  position: relative;
  overflow: hidden;
}

.selected-players-section::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: repeating-linear-gradient(
    90deg,
    #00d4ff 0px,
    #00d4ff 10px,
    #c41e3a 10px,
    #c41e3a 20px
  );
  animation: slide-in 1s ease-out;
}

.selected-players-section h3 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #00d4ff;
  position: relative;
  z-index: 1;
}

.no-players {
  padding: 20px;
  text-align: center;
  color: #888;
  font-style: italic;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  z-index: 1;
}

.player-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.1) 0%, rgba(196, 30, 58, 0.05) 100%);
  border: 2px solid #2a2f4a;
  border-left: 4px solid #00d4ff;
  border-radius: 6px;
  gap: 12px;
  transition: all 0.3s ease;
}

.player-item:hover {
  background: linear-gradient(90deg, rgba(0, 212, 255, 0.15) 0%, rgba(196, 30, 58, 0.1) 100%);
  border-left-color: #c41e3a;
  transform: translateX(4px);
  box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
}

.player-number {
  font-weight: 700;
  color: #00d4ff;
  min-width: 30px;
  text-align: center;
  background: rgba(0, 212, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9rem;
}

.player-name {
  flex: 1;
  color: #e0e0e0;
  font-weight: 500;
}

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
