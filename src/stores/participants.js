import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useParticipantsStore = defineStore('participants', () => {
  const participants = ref([])

  const hydrateFromData = (participantsArray) => {
    participants.value = participantsArray
  }

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
  }

  const removeParticipant = (email) => {
    participants.value = participants.value.filter(p => p.email !== email)
  }

  const getParticipant = (email) => {
    return participants.value.find(p => p.email === email)
  }

  return {
    participants,
    hydrateFromData,
    addParticipant,
    removeParticipant,
    getParticipant
  }
})
