import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEliminatedTeamsStore = defineStore('eliminatedTeams', () => {
  const eliminatedTeams = ref([])

  const hydrateFromData = (teamsArray) => {
    eliminatedTeams.value = teamsArray || []
  }

  const isTeamEliminated = (teamCode) => {
    if (!teamCode) return false
    return eliminatedTeams.value.includes(teamCode.toUpperCase())
  }

  return {
    eliminatedTeams,
    hydrateFromData,
    isTeamEliminated
  }
})
