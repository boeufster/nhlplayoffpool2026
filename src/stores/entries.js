import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref([])

  const hydrateFromData = (entriesArray) => {
    entries.value = entriesArray
  }

  const createEntry = (email, participantName) => {
    const id = `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const entry = {
      id,
      email,
      participantName,
      playerIds: [],
      totalScore: 0,
      createdAt: new Date().toISOString()
    }
    entries.value.push(entry)
    return entry
  }

  const removeEntry = (entryId) => {
    entries.value = entries.value.filter(e => e.id !== entryId)
  }

  const getEntry = (entryId) => {
    return entries.value.find(e => e.id === entryId)
  }

  const updateEntryScore = (entryId, points) => {
    const entry = getEntry(entryId)
    if (entry) {
      entry.totalScore += points
    }
  }

  const setEntryPlayers = (entryId, playerIds) => {
    const entry = getEntry(entryId)
    if (entry) {
      entry.playerIds = playerIds
      entry.submittedAt = new Date().toISOString()
    }
  }

  const setEntryPlayerNames = (entryId, playerNames) => {
    const entry = getEntry(entryId)
    if (entry) {
      entry.playerNames = playerNames
      entry.submittedAt = new Date().toISOString()
    }
  }

  return {
    entries,
    hydrateFromData,
    createEntry,
    removeEntry,
    getEntry,
    updateEntryScore,
    setEntryPlayers,
    setEntryPlayerNames
  }
})
