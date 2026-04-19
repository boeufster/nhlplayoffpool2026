import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * Player Registry Store
 * Manages the standardized player data format (RK, NAME, POS, GP, G, A, PTS)
 * Used for admin screen updates and player statistics tracking
 */
export const usePlayerRegistryStore = defineStore('playerRegistry', () => {
  const players = ref([])
  const lastUpdated = ref(null)

  /**
   * Add or update a player in the registry
   * Follows the standardized format: NAME (with team), POS, GP, G, A, PTS
   */
  const addOrUpdatePlayer = (playerData) => {
    const {
      name,
      team,
      position,
      gamesPlayed,
      goals,
      assists,
      points
    } = playerData

    // Validate required fields
    if (!name || !team || !position) {
      throw new Error('Player name, team, and position are required')
    }

    // Validate position
    const validPositions = ['RW', 'LW', 'C', 'D']
    if (!validPositions.includes(position)) {
      throw new Error(`Invalid position: ${position}`)
    }

    // Validate points calculation
    if (points !== goals + assists) {
      throw new Error(`Points mismatch: ${points} !== ${goals} + ${assists}`)
    }

    // Create standardized player object
    const standardizedPlayer = {
      name,
      team,
      position,
      gamesPlayed,
      goals,
      assists,
      points,
      fullName: `${name} ${team}`,
      updatedAt: new Date().toISOString()
    }

    // Check if player already exists (by name and team)
    const existingIndex = players.value.findIndex(
      p => p.name === name && p.team === team
    )

    if (existingIndex >= 0) {
      // Update existing player
      players.value[existingIndex] = standardizedPlayer
    } else {
      // Add new player
      players.value.push(standardizedPlayer)
    }

    lastUpdated.value = new Date().toISOString()
    saveToStorage()
  }

  /**
   * Import multiple players from standardized format
   * Returns array of results with success/failure status
   */
  const importPlayers = (playerDataArray) => {
    const results = []

    playerDataArray.forEach(playerData => {
      try {
        addOrUpdatePlayer(playerData)
        results.push({
          success: true,
          playerName: playerData.name,
          team: playerData.team
        })
      } catch (error) {
        results.push({
          success: false,
          playerName: playerData.name,
          team: playerData.team,
          reason: error.message
        })
      }
    })

    return results
  }

  /**
   * Get a player by name and team
   */
  const getPlayer = (name, team) => {
    return players.value.find(p => p.name === name && p.team === team)
  }

  /**
   * Get all players
   */
  const getAllPlayers = () => {
    return players.value
  }

  /**
   * Get players sorted by points (descending)
   */
  const getPlayersByPoints = () => {
    return [...players.value].sort((a, b) => b.points - a.points)
  }

  /**
   * Clear all players
   */
  const clearPlayers = () => {
    players.value = []
    lastUpdated.value = null
    saveToStorage()
  }

  /**
   * Save to localStorage
   */
  const saveToStorage = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('playerRegistry', JSON.stringify({
          players: players.value,
          lastUpdated: lastUpdated.value
        }))
      }
    } catch (error) {
      console.error('Error saving player registry to storage:', error)
    }
  }

  /**
   * Load from localStorage
   */
  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('playerRegistry')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (parsed.players && Array.isArray(parsed.players)) {
          players.value = parsed.players
          lastUpdated.value = parsed.lastUpdated
        }
      }
    } catch (error) {
      console.error('Error loading player registry from storage:', error)
      players.value = []
      lastUpdated.value = null
    }
  }

  return {
    players,
    lastUpdated,
    addOrUpdatePlayer,
    importPlayers,
    getPlayer,
    getAllPlayers,
    getPlayersByPoints,
    clearPlayers,
    saveToStorage,
    loadFromStorage
  }
})
