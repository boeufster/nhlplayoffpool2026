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

  const parsePlayerInput = (textInput) => {
    if (!textInput) return []
    
    // Try comma-separated first
    if (textInput.includes(',')) {
      return textInput
        .split(',')
        .map(name => name.trim())
        .filter(name => name.length > 0)
    }
    
    // Otherwise split by lines
    return textInput
      .split(/\r?\n/)
      .map(name => name.trim())
      .filter(name => name.length > 0)
  }

  const validatePlayerCount = (players) => {
    return Array.isArray(players) && players.length === MAX_PLAYERS
  }

  const validatePlayerNames = (players) => {
    if (!Array.isArray(players)) return false
    return players.every(name => typeof name === 'string' && name.trim().length > 0)
  }

  const hasDuplicates = (players) => {
    if (!Array.isArray(players)) return false
    const seen = new Set()
    for (const player of players) {
      if (seen.has(player)) return true
      seen.add(player)
    }
    return false
  }

  const submitEntry = (entryId, players) => {
    // Validate count
    if (!validatePlayerCount(players)) {
      throw new Error(`Must select exactly ${MAX_PLAYERS} players`)
    }

    // Validate names
    if (!validatePlayerNames(players)) {
      throw new Error('Invalid player names')
    }

    // Check for duplicates
    if (hasDuplicates(players)) {
      throw new Error('Duplicate player names not allowed')
    }

    return {
      entryId,
      playerIds: players,
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
    parsePlayerInput,
    validatePlayerCount,
    validatePlayerNames,
    hasDuplicates,
    submitEntry
  }
})
