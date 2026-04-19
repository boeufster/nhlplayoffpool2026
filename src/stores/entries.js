import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useEntriesStore = defineStore('entries', () => {
  const entries = ref([])

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
    saveToStorage()
    return entry
  }

  const removeEntry = (entryId) => {
    entries.value = entries.value.filter(e => e.id !== entryId)
    saveToStorage()
  }

  const getEntry = (entryId) => {
    return entries.value.find(e => e.id === entryId)
  }

  const updateEntryScore = (entryId, points) => {
    const entry = getEntry(entryId)
    if (entry) {
      entry.totalScore += points
      saveToStorage()
    }
  }

  const setEntryPlayers = (entryId, playerIds) => {
    const entry = getEntry(entryId)
    if (entry) {
      entry.playerIds = playerIds
      entry.submittedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  const saveToStorage = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('entries', JSON.stringify(entries.value))
      }
    } catch (error) {
      console.error('Error saving entries to storage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('entries')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          entries.value = parsed
        }
      }
    } catch (error) {
      console.error('Error loading entries from storage:', error)
      try {
        localStorage.removeItem('entries')
      } catch (e) {
        console.error('Error clearing corrupted entries:', e)
      }
      entries.value = []
    }
  }

  return {
    entries,
    createEntry,
    removeEntry,
    getEntry,
    updateEntryScore,
    setEntryPlayers,
    loadFromStorage
  }
})
