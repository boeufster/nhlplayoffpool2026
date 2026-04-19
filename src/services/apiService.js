// src/services/apiService.js

const API_BASE = '/api'

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  }
  const response = await fetch(url, config)
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  return response.json()
}

export const apiService = {
  // Pool data (bulk fetch)
  fetchPoolData: () => request('/pool-data'),

  // Participants
  getParticipants: () => request('/participants'),
  createParticipant: (email, name, entryFee) =>
    request('/participants', { method: 'POST', body: { email, name, entryFee } }),
  deleteParticipant: (email) =>
    request(`/participants?email=${encodeURIComponent(email)}`, { method: 'DELETE' }),

  // Entries
  getEntries: () => request('/entries'),
  createEntry: (email, participantName) =>
    request('/entries', { method: 'POST', body: { email, participantName } }),
  deleteEntry: (id) =>
    request(`/entries?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),

  // Entry players
  assignPlayers: (entryId, playerNames) =>
    request(`/entries/${encodeURIComponent(entryId)}/players`, {
      method: 'PUT',
      body: { playerNames }
    }),

  // Scores
  getScores: () => request('/scores'),
  updateScores: (players) =>
    request('/scores', { method: 'POST', body: { players } })
}
