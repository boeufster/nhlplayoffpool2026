import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { usePlayerRegistryStore } from '../playerRegistry'

describe('Player Registry Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock localStorage
    global.localStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
  })

  it('should add a new player to the registry', () => {
    const store = usePlayerRegistryStore()
    
    const playerData = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3
    }

    store.addOrUpdatePlayer(playerData)

    expect(store.players).toHaveLength(1)
    expect(store.players[0].name).toBe('Mats Zuccarello')
    expect(store.players[0].team).toBe('MIN')
    expect(store.players[0].points).toBe(3)
  })

  it('should update an existing player', () => {
    const store = usePlayerRegistryStore()
    
    const playerData1 = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3
    }

    const playerData2 = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 2,
      goals: 1,
      assists: 4,
      points: 5
    }

    store.addOrUpdatePlayer(playerData1)
    store.addOrUpdatePlayer(playerData2)

    expect(store.players).toHaveLength(1)
    expect(store.players[0].points).toBe(5)
    expect(store.players[0].gamesPlayed).toBe(2)
  })

  it('should validate points calculation', () => {
    const store = usePlayerRegistryStore()
    
    const invalidPlayerData = {
      name: 'Invalid Player',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 1,
      assists: 1,
      points: 5 // Should be 2, not 5
    }

    expect(() => {
      store.addOrUpdatePlayer(invalidPlayerData)
    }).toThrow('Points mismatch')
  })

  it('should validate position codes', () => {
    const store = usePlayerRegistryStore()
    
    const invalidPlayerData = {
      name: 'Invalid Player',
      team: 'MIN',
      position: 'XX', // Invalid position
      gamesPlayed: 1,
      goals: 1,
      assists: 1,
      points: 2
    }

    expect(() => {
      store.addOrUpdatePlayer(invalidPlayerData)
    }).toThrow('Invalid position')
  })

  it('should import multiple players', () => {
    const store = usePlayerRegistryStore()
    
    const playersData = [
      {
        name: 'Mats Zuccarello',
        team: 'MIN',
        position: 'RW',
        gamesPlayed: 1,
        goals: 0,
        assists: 3,
        points: 3
      },
      {
        name: 'Kiril Kaprizov',
        team: 'MIN',
        position: 'LW',
        gamesPlayed: 1,
        goals: 1,
        assists: 2,
        points: 3
      }
    ]

    const results = store.importPlayers(playersData)

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(true)
    expect(store.players).toHaveLength(2)
  })

  it('should handle import errors gracefully', () => {
    const store = usePlayerRegistryStore()
    
    const playersData = [
      {
        name: 'Valid Player',
        team: 'MIN',
        position: 'RW',
        gamesPlayed: 1,
        goals: 1,
        assists: 1,
        points: 2
      },
      {
        name: 'Invalid Player',
        team: 'MIN',
        position: 'XX', // Invalid position
        gamesPlayed: 1,
        goals: 1,
        assists: 1,
        points: 2
      }
    ]

    const results = store.importPlayers(playersData)

    expect(results).toHaveLength(2)
    expect(results[0].success).toBe(true)
    expect(results[1].success).toBe(false)
    expect(store.players).toHaveLength(1) // Only valid player added
  })

  it('should get player by name and team', () => {
    const store = usePlayerRegistryStore()
    
    const playerData = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3
    }

    store.addOrUpdatePlayer(playerData)
    const player = store.getPlayer('Mats Zuccarello', 'MIN')

    expect(player).toBeDefined()
    expect(player.points).toBe(3)
  })

  it('should return null for non-existent player', () => {
    const store = usePlayerRegistryStore()
    const player = store.getPlayer('Non Existent', 'XXX')

    expect(player).toBeUndefined()
  })

  it('should get all players', () => {
    const store = usePlayerRegistryStore()
    
    const playersData = [
      {
        name: 'Player 1',
        team: 'MIN',
        position: 'RW',
        gamesPlayed: 1,
        goals: 1,
        assists: 1,
        points: 2
      },
      {
        name: 'Player 2',
        team: 'PIT',
        position: 'LW',
        gamesPlayed: 1,
        goals: 2,
        assists: 1,
        points: 3
      }
    ]

    store.importPlayers(playersData)
    const allPlayers = store.getAllPlayers()

    expect(allPlayers).toHaveLength(2)
  })

  it('should get players sorted by points', () => {
    const store = usePlayerRegistryStore()
    
    const playersData = [
      {
        name: 'Player 1',
        team: 'MIN',
        position: 'RW',
        gamesPlayed: 1,
        goals: 1,
        assists: 1,
        points: 2
      },
      {
        name: 'Player 2',
        team: 'PIT',
        position: 'LW',
        gamesPlayed: 1,
        goals: 2,
        assists: 2,
        points: 4
      },
      {
        name: 'Player 3',
        team: 'PHI',
        position: 'C',
        gamesPlayed: 1,
        goals: 0,
        assists: 1,
        points: 1
      }
    ]

    store.importPlayers(playersData)
    const sortedPlayers = store.getPlayersByPoints()

    expect(sortedPlayers[0].points).toBe(4)
    expect(sortedPlayers[1].points).toBe(2)
    expect(sortedPlayers[2].points).toBe(1)
  })

  it('should clear all players', () => {
    const store = usePlayerRegistryStore()
    
    const playerData = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3
    }

    store.addOrUpdatePlayer(playerData)
    expect(store.players).toHaveLength(1)

    store.clearPlayers()
    expect(store.players).toHaveLength(0)
    expect(store.lastUpdated).toBeNull()
  })

  it('should track last updated timestamp', () => {
    const store = usePlayerRegistryStore()
    
    const playerData = {
      name: 'Mats Zuccarello',
      team: 'MIN',
      position: 'RW',
      gamesPlayed: 1,
      goals: 0,
      assists: 3,
      points: 3
    }

    expect(store.lastUpdated).toBeNull()
    
    store.addOrUpdatePlayer(playerData)
    expect(store.lastUpdated).not.toBeNull()
  })
})
