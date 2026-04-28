import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useEliminatedTeamsStore } from '../eliminatedTeams'

describe('Eliminated Teams Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('initial state', () => {
    it('should start with an empty eliminated teams array', () => {
      const store = useEliminatedTeamsStore()
      expect(store.eliminatedTeams).toEqual([])
    })
  })

  describe('hydrateFromData', () => {
    it('should set eliminated teams from an array', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT', 'BUF'])
      expect(store.eliminatedTeams).toEqual(['MTL', 'OTT', 'BUF'])
    })

    it('should default to empty array when given null', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(null)
      expect(store.eliminatedTeams).toEqual([])
    })

    it('should default to empty array when given undefined', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(undefined)
      expect(store.eliminatedTeams).toEqual([])
    })

    it('should replace previous data on re-hydration', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT'])
      store.hydrateFromData(['EDM'])
      expect(store.eliminatedTeams).toEqual(['EDM'])
    })

    it('should handle an empty array', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL'])
      store.hydrateFromData([])
      expect(store.eliminatedTeams).toEqual([])
    })
  })

  describe('isTeamEliminated', () => {
    it('should return true for an eliminated team', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT', 'BUF'])
      expect(store.isTeamEliminated('MTL')).toBe(true)
    })

    it('should return false for a non-eliminated team', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT', 'BUF'])
      expect(store.isTeamEliminated('EDM')).toBe(false)
    })

    it('should return false for null', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL'])
      expect(store.isTeamEliminated(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL'])
      expect(store.isTeamEliminated(undefined)).toBe(false)
    })

    it('should perform case-insensitive check via uppercase conversion', () => {
      const store = useEliminatedTeamsStore()
      store.hydrateFromData(['MTL', 'OTT'])
      expect(store.isTeamEliminated('mtl')).toBe(true)
      expect(store.isTeamEliminated('Mtl')).toBe(true)
    })

    it('should return false when no teams are eliminated', () => {
      const store = useEliminatedTeamsStore()
      expect(store.isTeamEliminated('MTL')).toBe(false)
    })
  })
})
