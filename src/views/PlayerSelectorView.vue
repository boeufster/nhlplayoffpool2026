<template>
  <div class="player-selector-view">
    <h2>Player Selection</h2>
    
    <div class="selector-container">
      <div class="controls">
        <div class="participant-select">
          <label for="participant">Select Participant:</label>
          <select v-model="selectedParticipantEmail" id="participant">
            <option value="">-- Choose a participant --</option>
            <option v-for="p in participants" :key="p.email" :value="p.email">
              {{ p.name }}
            </option>
          </select>
        </div>

        <div class="position-filters">
          <label>Filter by Position:</label>
          <button
            v-for="pos in positions"
            :key="pos"
            @click="selectedPosition = selectedPosition === pos ? null : pos"
            :class="{ active: selectedPosition === pos }"
          >
            {{ positionLabels[pos] }}
          </button>
        </div>
      </div>

      <div class="selection-status">
        <p>Selected: <strong>{{ selectedPlayers.length }}/{{ MAX_PLAYERS }}</strong></p>
        <button
          @click="submitSelection"
          :disabled="!isSelectionComplete || !selectedParticipantEmail"
          class="submit-btn"
        >
          Submit Selection
        </button>
        <button @click="clearSelection" class="clear-btn">Clear Selection</button>
      </div>

      <div class="content">
        <div class="available-players">
          <h3>Available Players</h3>
          <div class="players-grid">
            <div
              v-for="player in filteredAvailablePlayers"
              :key="player.id"
              class="player-card available"
              @click="selectPlayer(player)"
            >
              <div class="player-name">{{ player.name }}</div>
              <div class="player-info">
                {{ player.position }} - {{ player.team }}
              </div>
            </div>
          </div>
        </div>

        <div class="selected-players">
          <h3>Selected Players ({{ selectedPlayers.length }}/{{ MAX_PLAYERS }})</h3>
          <div class="players-grid">
            <div
              v-for="player in selectedPlayers"
              :key="player.id"
              class="player-card selected"
              @click="deselectPlayer(player.id)"
            >
              <div class="player-name">{{ player.name }}</div>
              <div class="player-info">
                {{ player.position }} - {{ player.team }}
              </div>
              <div class="remove-hint">Click to remove</div>
            </div>
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
import { useNhlApiStore } from '../stores/nhlApi'

export default {
  name: 'PlayerSelectorView',
  setup() {
    const participantsStore = useParticipantsStore()
    const playerSelectionStore = usePlayerSelectionStore()
    const entriesStore = useEntriesStore()
    const nhlApiStore = useNhlApiStore()

    const selectedParticipantEmail = ref('')
    const selectedPosition = ref(null)
    const isLoading = ref(false)
    const errorMessage = ref('')

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

    const loadPlayers = async () => {
      isLoading.value = true
      errorMessage.value = ''
      try {
        const players = await nhlApiStore.fetchPlayers()
        
        // Fallback to mock data if no players loaded
        if (!players || players.length === 0) {
          console.warn('No players from API, using mock data')
          const mockPlayers = [
            { id: 1, name: 'Fake Player One', position: 'F', team: 'Mock Team A' },
            { id: 2, name: 'Fake Player Two', position: 'F', team: 'Mock Team A' },
            { id: 3, name: 'Fake Player Three', position: 'D', team: 'Mock Team B' },
            { id: 4, name: 'Fake Player Four', position: 'D', team: 'Mock Team C' },
            { id: 5, name: 'Fake Player Five', position: 'G', team: 'Mock Team C' },
            { id: 6, name: 'Fake Player Six', position: 'G', team: 'Mock Team D' },
            { id: 7, name: 'Fake Player Seven', position: 'F', team: 'Mock Team E' },
            { id: 8, name: 'Fake Player Eight', position: 'F', team: 'Mock Team E' },
            { id: 9, name: 'Fake Player Nine', position: 'D', team: 'Mock Team E' },
            { id: 10, name: 'Fake Player Ten', position: 'G', team: 'Mock Team E' },
            { id: 11, name: 'Fake Player Eleven', position: 'F', team: 'Mock Team B' },
            { id: 12, name: 'Fake Player Twelve', position: 'F', team: 'Mock Team D' },
            { id: 13, name: 'Fake Player Thirteen', position: 'D', team: 'Mock Team D' },
            { id: 14, name: 'Fake Player Fourteen', position: 'D', team: 'Mock Team A' },
            { id: 15, name: 'Fake Player Fifteen', position: 'F', team: 'Mock Team F' },
            { id: 16, name: 'Fake Player Sixteen', position: 'D', team: 'Mock Team F' },
            { id: 17, name: 'Fake Player Seventeen', position: 'G', team: 'Mock Team F' },
            { id: 18, name: 'Fake Player Eighteen', position: 'G', team: 'Mock Team G' },
            { id: 19, name: 'Fake Player Nineteen', position: 'F', team: 'Mock Team G' },
            { id: 20, name: 'Fake Player Twenty', position: 'D', team: 'Mock Team G' }
          ]
          playerSelectionStore.setAvailablePlayers(mockPlayers)
        } else {
          playerSelectionStore.setAvailablePlayers(players)
        }
      } catch (error) {
        errorMessage.value = 'Failed to load players. Using mock data.'
        console.error('Error loading players:', error)
        
        // Fallback to mock data on error
        const mockPlayers = [
          { id: 1, name: 'Fake Player One', position: 'F', team: 'Mock Team A' },
          { id: 2, name: 'Fake Player Two', position: 'F', team: 'Mock Team A' },
          { id: 3, name: 'Fake Player Three', position: 'D', team: 'Mock Team B' },
          { id: 4, name: 'Fake Player Four', position: 'D', team: 'Mock Team C' },
          { id: 5, name: 'Fake Player Five', position: 'G', team: 'Mock Team C' },
          { id: 6, name: 'Fake Player Six', position: 'G', team: 'Mock Team D' },
          { id: 7, name: 'Fake Player Seven', position: 'F', team: 'Mock Team E' },
          { id: 8, name: 'Fake Player Eight', position: 'F', team: 'Mock Team E' },
          { id: 9, name: 'Fake Player Nine', position: 'D', team: 'Mock Team E' },
          { id: 10, name: 'Fake Player Ten', position: 'G', team: 'Mock Team E' },
          { id: 11, name: 'Fake Player Eleven', position: 'F', team: 'Mock Team B' },
          { id: 12, name: 'Fake Player Twelve', position: 'F', team: 'Mock Team D' },
          { id: 13, name: 'Fake Player Thirteen', position: 'D', team: 'Mock Team D' },
          { id: 14, name: 'Fake Player Fourteen', position: 'D', team: 'Mock Team A' },
          { id: 15, name: 'Fake Player Fifteen', position: 'F', team: 'Mock Team F' },
          { id: 16, name: 'Fake Player Sixteen', position: 'D', team: 'Mock Team F' },
          { id: 17, name: 'Fake Player Seventeen', position: 'G', team: 'Mock Team F' },
          { id: 18, name: 'Fake Player Eighteen', position: 'G', team: 'Mock Team G' },
          { id: 19, name: 'Fake Player Nineteen', position: 'F', team: 'Mock Team G' },
          { id: 20, name: 'Fake Player Twenty', position: 'D', team: 'Mock Team G' }
        ]
        playerSelectionStore.setAvailablePlayers(mockPlayers)
      } finally {
        isLoading.value = false
      }
    }

    const selectPlayer = (player) => {
      try {
        playerSelectionStore.selectPlayer(player)
        errorMessage.value = ''
      } catch (error) {
        errorMessage.value = error.message
      }
    }

    const deselectPlayer = (playerId) => {
      playerSelectionStore.deselectPlayer(playerId)
    }

    const clearSelection = () => {
      playerSelectionStore.clearSelection()
      errorMessage.value = ''
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

    // Load players on component mount
    loadPlayers()

    return {
      selectedParticipantEmail,
      selectedPosition,
      isLoading,
      errorMessage,
      MAX_PLAYERS,
      positions,
      positionLabels,
      participants,
      selectedPlayers,
      availablePlayers,
      filteredAvailablePlayers,
      isSelectionComplete,
      selectPlayer,
      deselectPlayer,
      clearSelection,
      submitSelection
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

.position-filters {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.position-filters label {
  font-weight: 600;
}

.position-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
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

.available-players h3,
.selected-players h3 {
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

@media (max-width: 1024px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
