import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useParticipantsStore = defineStore('participants', () => {
  const participants = ref([])

  const addParticipant = (email, name, entryFee) => {
    if (participants.value.some(p => p.email === email)) {
      throw new Error('Participant with this email already exists')
    }
    participants.value.push({
      email,
      name,
      entryFee,
      createdAt: new Date().toISOString()
    })
    saveToStorage()
  }

  const removeParticipant = (email) => {
    participants.value = participants.value.filter(p => p.email !== email)
    saveToStorage()
  }

  const getParticipant = (email) => {
    return participants.value.find(p => p.email === email)
  }

  const saveToStorage = () => {
    try {
      if (typeof localStorage !== 'undefined' && localStorage) {
        localStorage.setItem('participants', JSON.stringify(participants.value))
      }
    } catch (error) {
      console.error('Error saving participants to storage:', error)
    }
  }

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem('participants')
      if (stored && typeof stored === 'string' && stored.length > 0) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          participants.value = parsed
        }
      }
    } catch (error) {
      console.error('Error loading participants from storage:', error)
      try {
        localStorage.removeItem('participants')
      } catch (e) {
        console.error('Error clearing corrupted participants:', e)
      }
      participants.value = []
    }
  }

  return {
    participants,
    addParticipant,
    removeParticipant,
    getParticipant,
    loadFromStorage
  }
})
