import { defineStore } from 'pinia'
import { ref } from 'vue'
import axios from 'axios'

export const useNhlApiStore = defineStore('nhlApi', () => {
  const isConnected = ref(false)
  const lastPollTime = ref(null)
  const lastErrorTime = ref(null)
  const lastErrorMessage = ref(null)
  const pollInterval = 5 * 60 * 1000 // 5 minutes
  const responseCache = ref({})
  const cacheTTL = 5 * 60 * 1000 // 5 minutes
  const apiLogs = ref([])
  const maxLogs = 100 // Keep last 100 logs
  const retryAttempts = ref(0)
  const maxRetryAttempts = 5
  const retryBackoffMs = ref(1000) // Start at 1 second

  const API_BASE = 'https://statsapi.web.nhl.com/api/v1'
  const REQUEST_TIMEOUT = 30000 // 30 seconds

  const logApiInteraction = (action, details, status = 'info') => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      status
    }
    apiLogs.value.push(logEntry)
    
    // Keep only last 100 logs
    if (apiLogs.value.length > maxLogs) {
      apiLogs.value.shift()
    }

    // Also log to console
    const logLevel = status === 'error' ? 'error' : status === 'warning' ? 'warn' : 'log'
    console[logLevel](`[NHL API ${status.toUpperCase()}] ${action}:`, details)
  }

  const getCachedResponse = (key) => {
    const cached = responseCache.value[key]
    if (!cached) return null

    const now = Date.now()
    if (now - cached.timestamp > cacheTTL) {
      delete responseCache.value[key]
      logApiInteraction('Cache Expiration', { key, age: now - cached.timestamp }, 'info')
      return null
    }

    logApiInteraction('Cache Hit', { key }, 'info')
    return cached.data
  }

  const setCachedResponse = (key, data) => {
    responseCache.value[key] = {
      data,
      timestamp: Date.now()
    }
    logApiInteraction('Cache Set', { key }, 'info')
  }

  const fetchPlayers = async () => {
    const cacheKey = 'players'
    const cached = getCachedResponse(cacheKey)
    if (cached) return cached

    logApiInteraction('Fetch Players', { endpoint: `${API_BASE}/teams` }, 'info')

    try {
      const players = []
      
      // Fetch all teams
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const teams = teamsResponse.data.teams
      
      logApiInteraction('Fetch Teams Success', { teamCount: teams.length }, 'info')

      // Fetch roster for each team
      for (const team of teams) {
        try {
          const rosterResponse = await axios.get(`${API_BASE}/teams/${team.id}/roster`, { timeout: REQUEST_TIMEOUT })
          const roster = rosterResponse.data.roster

          roster.forEach(player => {
            players.push({
              id: player.person.id,
              name: player.person.fullName,
              position: player.position.code,
              team: team.abbreviation
            })
          })
        } catch (error) {
          logApiInteraction('Fetch Roster Error', { 
            teamId: team.id,
            teamName: team.name,
            error: error.message 
          }, 'warning')
        }
      }

      isConnected.value = true
      lastPollTime.value = new Date().toISOString()
      retryAttempts.value = 0
      retryBackoffMs.value = 1000
      
      logApiInteraction('Fetch Players Success', { playerCount: players.length }, 'info')
      setCachedResponse(cacheKey, players)
      return players
    } catch (error) {
      handleApiError('Fetch Players', error)
      logApiInteraction('Fetch Players Failed', { 
        error: error.message,
        status: error.response?.status,
        code: error.code,
        note: 'Falling back to mock data. This may indicate DNS resolution issues with statsapi.web.nhl.com'
      }, 'error')
      return []
    }
  }

  const fetchScoringEvents = async () => {
    logApiInteraction('Fetch Scoring Events', { endpoint: `${API_BASE}/schedule` }, 'info')

    try {
      // Fetch live games
      const gamesResponse = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      const events = []

      for (const game of gamesResponse.data.dates[0]?.games || []) {
        if (game.status.abstractGameState === 'Live' || game.status.abstractGameState === 'Final') {
          try {
            const gameResponse = await axios.get(`${API_BASE}/game/${game.gamePk}/feed/live`, { timeout: REQUEST_TIMEOUT })
            const plays = gameResponse.data.liveData.plays

            plays.forEach(play => {
              if (play.result.eventTypeId === 'GOAL') {
                events.push({
                  playerId: play.result.scorer.player.id,
                  eventType: 'goal',
                  timestamp: play.about.dateTime
                })
              } else if (play.result.eventTypeId === 'ASSIST') {
                if (play.result.assists) {
                  play.result.assists.forEach(assist => {
                    events.push({
                      playerId: assist.player.id,
                      eventType: 'assist',
                      timestamp: play.about.dateTime
                    })
                  })
                }
              }
            })

            // Check for wins and shutouts
            if (game.status.abstractGameState === 'Final') {
              const teams = gameResponse.data.gameData.teams
              const liveData = gameResponse.data.liveData

              // Determine winning team
              const homeScore = liveData.linescore.teams.home.goals
              const awayScore = liveData.linescore.teams.away.goals

              if (homeScore > awayScore) {
                // Home team won
                const homeGoalie = liveData.boxscore.teams.home.goalies[0]
                if (homeGoalie) {
                  events.push({
                    playerId: homeGoalie,
                    eventType: 'win',
                    timestamp: game.endTime
                  })

                  // Check for shutout
                  if (awayScore === 0) {
                    events.push({
                      playerId: homeGoalie,
                      eventType: 'shutout',
                      timestamp: game.endTime
                    })
                  }
                }
              } else if (awayScore > homeScore) {
                // Away team won
                const awayGoalie = liveData.boxscore.teams.away.goalies[0]
                if (awayGoalie) {
                  events.push({
                    playerId: awayGoalie,
                    eventType: 'win',
                    timestamp: game.endTime
                  })

                  // Check for shutout
                  if (homeScore === 0) {
                    events.push({
                      playerId: awayGoalie,
                      eventType: 'shutout',
                      timestamp: game.endTime
                    })
                  }
                }
              }
            }
          } catch (error) {
            logApiInteraction('Fetch Game Feed Error', { 
              gamePk: game.gamePk, 
              error: error.message,
              status: error.response?.status 
            }, 'warning')
          }
        }
      }

      isConnected.value = true
      lastPollTime.value = new Date().toISOString()
      retryAttempts.value = 0
      retryBackoffMs.value = 1000
      logApiInteraction('Fetch Scoring Events Success', { eventCount: events.length }, 'info')
      return events
    } catch (error) {
      handleApiError('Fetch Scoring Events', error)
      return []
    }
  }

  const handleApiError = (action, error) => {
    const status = error.response?.status
    const message = error.message

    lastErrorTime.value = new Date().toISOString()
    lastErrorMessage.value = message
    isConnected.value = false

    // Handle different error types
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      logApiInteraction(action, { 
        error: 'Request Timeout', 
        timeout: REQUEST_TIMEOUT 
      }, 'error')
    } else if (status === 429) {
      // Rate limiting - implement exponential backoff
      logApiInteraction(action, { 
        error: 'Rate Limited (429)',
        retryAttempts: retryAttempts.value,
        nextRetryMs: retryBackoffMs.value
      }, 'warning')
      
      if (retryAttempts.value < maxRetryAttempts) {
        retryAttempts.value++
        retryBackoffMs.value = Math.min(retryBackoffMs.value * 2, 5 * 60 * 1000) // Max 5 minutes
      }
    } else if (status === 400 || status === 404) {
      logApiInteraction(action, { 
        error: 'Invalid Response',
        status,
        message
      }, 'error')
    } else if (status >= 500) {
      logApiInteraction(action, { 
        error: 'Server Error',
        status,
        message
      }, 'error')
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      logApiInteraction(action, { 
        error: 'Connection Failure',
        code: error.code
      }, 'error')
    } else {
      logApiInteraction(action, { 
        error: message,
        status,
        code: error.code
      }, 'error')
    }
  }

  const startPolling = (callback) => {
    logApiInteraction('Start Polling', { interval: pollInterval }, 'info')

    // Initial fetch
    fetchScoringEvents().then(events => {
      events.forEach(event => callback(event))
    })

    // Set up interval
    const intervalId = setInterval(() => {
      fetchScoringEvents().then(events => {
        events.forEach(event => callback(event))
      })
    }, pollInterval)

    return intervalId
  }

  const getApiLogs = () => {
    return apiLogs.value
  }

  const clearApiLogs = () => {
    apiLogs.value = []
    logApiInteraction('Logs Cleared', {}, 'info')
  }

  return {
    isConnected,
    lastPollTime,
    lastErrorTime,
    lastErrorMessage,
    fetchPlayers,
    fetchScoringEvents,
    startPolling,
    getApiLogs,
    clearApiLogs,
    getCachedResponse,
    setCachedResponse
  }
})
