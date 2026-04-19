import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePlayerSelectionStore = defineStore('playerSelection', () => {
  const selectedPlayers = ref([])
  const availablePlayers = ref([])

  const MAX_PLAYERS = 15

  const selectPlayer = (player) => {
    // Check if already selected
    if (selectedPlayers.value.some(p => p.id === player.id)) {
      throw new Error('Player already selected')
    }

    // Check if at max
    if (selectedPlayers.value.length >= MAX_PLAYERS) {
      throw new Error(`Cannot select more than ${MAX_PLAYERS} players`)
    }

    selectedPlayers.value.push(player)
  }

  const deselectPlayer = (playerId) => {
    selectedPlayers.value = selectedPlayers.value.filter(p => p.id !== playerId)
  }

  const clearSelection = () => {
    selectedPlayers.value = []
  }

  const setAvailablePlayers = (players) => {
    availablePlayers.value = players
  }

  const getSelectedPlayerIds = () => {
    return selectedPlayers.value.map(p => p.id)
  }

  const isPlayerSelected = (playerId) => {
    return selectedPlayers.value.some(p => p.id === playerId)
  }

  const canSelectMore = computed(() => {
    return selectedPlayers.value.length < MAX_PLAYERS
  })

  const isSelectionComplete = computed(() => {
    return selectedPlayers.value.length === MAX_PLAYERS
  })

  const getPlayersByPosition = (position) => {
    return availablePlayers.value.filter(p => p.position === position)
  }

  const getSelectedPlayersByPosition = (position) => {
    return selectedPlayers.value.filter(p => p.position === position)
  }

  const submitEntry = (entryId) => {
    if (!isSelectionComplete.value) {
      throw new Error(`Must select exactly ${MAX_PLAYERS} players`)
    }

    return {
      entryId,
      playerIds: getSelectedPlayerIds(),
      submittedAt: new Date().toISOString()
    }
  }

  return {
    selectedPlayers,
    availablePlayers,
    MAX_PLAYERS,
    selectPlayer,
    deselectPlayer,
    clearSelection,
    setAvailablePlayers,
    getSelectedPlayerIds,
    isPlayerSelected,
    canSelectMore,
    isSelectionComplete,
    getPlayersByPosition,
    getSelectedPlayersByPosition,
    submitEntry
  }
})
