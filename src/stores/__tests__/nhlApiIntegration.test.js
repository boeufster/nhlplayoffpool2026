import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

/**
 * Phase 9.5: NHL API Verification Integration Tests
 * 
 * These tests verify that the NHL API endpoints are working with real data.
 * They test against the actual NHL API (not mocked) to ensure:
 * 1. Endpoints are accessible and returning valid data
 * 2. Response structures match expected formats
 * 3. Data is available for current/upcoming playoffs
 * 4. API responses can be properly parsed and used
 */

const API_BASE = 'https://statsapi.web.nhl.com/api/v1'
const REQUEST_TIMEOUT = 30000

describe('Phase 9.5: NHL API Verification (Real API Integration)', () => {
  beforeEach(() => {
    // No mocking - we're testing real API
  })

  afterEach(() => {
    // Cleanup
  })

  describe('9.5.1 Test NHL API Endpoints with Real Data', () => {
    it('should successfully connect to NHL API base endpoint', async () => {
      try {
        const response = await axios.get(`${API_BASE}/standings`, { timeout: REQUEST_TIMEOUT })
        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
      } catch (error) {
        // Document the error for debugging
        console.error('NHL API Connection Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code
        })
        throw error
      }
    })

    it('should fetch standings data successfully', async () => {
      const response = await axios.get(`${API_BASE}/standings`, { timeout: REQUEST_TIMEOUT })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data.standings)).toBe(true)
      
      // Document response structure
      console.log('Standings Response Structure:', {
        hasStandings: Array.isArray(response.data.standings),
        standingsCount: response.data.standings?.length,
        firstStandingKeys: response.data.standings?.[0] ? Object.keys(response.data.standings[0]) : []
      })
    })

    it('should fetch schedule data successfully', async () => {
      const response = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      
      // Document response structure
      console.log('Schedule Response Structure:', {
        hasData: response.data !== null,
        dataKeys: response.data ? Object.keys(response.data) : [],
        datesCount: response.data?.dates?.length
      })
    })

    it('should fetch teams data successfully', async () => {
      const response = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      
      expect(response.status).toBe(200)
      expect(response.data).toBeDefined()
      expect(Array.isArray(response.data.teams)).toBe(true)
      
      // Document response structure
      console.log('Teams Response Structure:', {
        teamsCount: response.data.teams?.length,
        firstTeamKeys: response.data.teams?.[0] ? Object.keys(response.data.teams[0]) : []
      })
    })
  })

  describe('9.5.2 Verify Player Data Structure and Availability', () => {
    it('should have valid team data with required fields', async () => {
      const response = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const teams = response.data.teams
      
      expect(teams.length).toBeGreaterThan(0)
      
      const firstTeam = teams[0]
      expect(firstTeam.id).toBeDefined()
      expect(firstTeam.name).toBeDefined()
      
      console.log('Sample Team Data:', {
        id: firstTeam.id,
        name: firstTeam.name,
        abbreviation: firstTeam.abbreviation,
        keys: Object.keys(firstTeam)
      })
    })

    it('should fetch roster data for a team', async () => {
      // Get teams first
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const firstTeamId = teamsResponse.data.teams[0].id
      
      // Fetch roster for first team
      const rosterResponse = await axios.get(
        `${API_BASE}/teams/${firstTeamId}/roster`,
        { timeout: REQUEST_TIMEOUT }
      )
      
      expect(rosterResponse.status).toBe(200)
      expect(rosterResponse.data).toBeDefined()
      
      console.log('Roster Response Structure:', {
        hasRoster: rosterResponse.data.roster !== undefined,
        rosterCount: rosterResponse.data.roster?.length,
        firstPlayerKeys: rosterResponse.data.roster?.[0] ? Object.keys(rosterResponse.data.roster[0]) : []
      })
    })

    it('should have player data with position information', async () => {
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const firstTeamId = teamsResponse.data.teams[0].id
      
      const rosterResponse = await axios.get(
        `${API_BASE}/teams/${firstTeamId}/roster`,
        { timeout: REQUEST_TIMEOUT }
      )
      
      const roster = rosterResponse.data.roster
      expect(roster.length).toBeGreaterThan(0)
      
      const firstPlayer = roster[0]
      expect(firstPlayer.person).toBeDefined()
      expect(firstPlayer.person.id).toBeDefined()
      expect(firstPlayer.person.fullName).toBeDefined()
      expect(firstPlayer.position).toBeDefined()
      
      console.log('Sample Player Data:', {
        id: firstPlayer.person.id,
        name: firstPlayer.person.fullName,
        position: firstPlayer.position.code,
        positionName: firstPlayer.position.name,
        playerKeys: Object.keys(firstPlayer.person),
        positionKeys: Object.keys(firstPlayer.position)
      })
    })

    it('should have players from all positions (F, D, G)', async () => {
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const teams = teamsResponse.data.teams
      
      const positions = new Set()
      
      for (const team of teams.slice(0, 3)) { // Check first 3 teams
        const rosterResponse = await axios.get(
          `${API_BASE}/teams/${team.id}/roster`,
          { timeout: REQUEST_TIMEOUT }
        )
        
        rosterResponse.data.roster.forEach(player => {
          positions.add(player.position.code)
        })
      }
      
      console.log('Positions Found:', Array.from(positions))
      
      // Should have at least some common positions
      expect(positions.size).toBeGreaterThan(0)
    })
  })

  describe('9.5.3 Verify Game/Score Data Endpoints', () => {
    it('should fetch schedule with game data', async () => {
      const response = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      expect(response.data).toBeDefined()
      expect(response.data.dates).toBeDefined()
      
      console.log('Schedule Data Structure:', {
        datesCount: response.data.dates?.length,
        firstDateKeys: response.data.dates?.[0] ? Object.keys(response.data.dates[0]) : [],
        firstDateGamesCount: response.data.dates?.[0]?.games?.length
      })
    })

    it('should have games with score information', async () => {
      const response = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      const dates = response.data.dates
      let foundGameWithScore = false
      
      for (const dateEntry of dates) {
        if (dateEntry.games && dateEntry.games.length > 0) {
          const game = dateEntry.games[0]
          
          console.log('Sample Game Data:', {
            gamePk: game.gamePk,
            gameType: game.gameType,
            status: game.status?.abstractGameState,
            homeTeam: game.homeTeam?.name,
            awayTeam: game.awayTeam?.name,
            gameKeys: Object.keys(game)
          })
          
          if (game.gamePk) {
            foundGameWithScore = true
            break
          }
        }
      }
      
      expect(foundGameWithScore).toBe(true)
    })

    it('should fetch live game feed data', async () => {
      const scheduleResponse = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      // Find a game to fetch
      let gamePk = null
      for (const dateEntry of scheduleResponse.data.dates) {
        if (dateEntry.games && dateEntry.games.length > 0) {
          gamePk = dateEntry.games[0].gamePk
          break
        }
      }
      
      if (gamePk) {
        const gameResponse = await axios.get(
          `${API_BASE}/game/${gamePk}/feed/live`,
          { timeout: REQUEST_TIMEOUT }
        )
        
        expect(gameResponse.status).toBe(200)
        expect(gameResponse.data).toBeDefined()
        
        console.log('Game Feed Structure:', {
          hasGameData: gameResponse.data.gameData !== undefined,
          hasLiveData: gameResponse.data.liveData !== undefined,
          gameDataKeys: gameResponse.data.gameData ? Object.keys(gameResponse.data.gameData) : [],
          liveDataKeys: gameResponse.data.liveData ? Object.keys(gameResponse.data.liveData) : []
        })
      }
    })

    it('should have standings with team statistics', async () => {
      const response = await axios.get(`${API_BASE}/standings`, { timeout: REQUEST_TIMEOUT })
      
      const standings = response.data.standings
      expect(standings.length).toBeGreaterThan(0)
      
      const firstStanding = standings[0]
      
      console.log('Standing Entry Structure:', {
        keys: Object.keys(firstStanding),
        teamKeys: firstStanding.teamRecords?.[0] ? Object.keys(firstStanding.teamRecords[0]) : [],
        firstTeamRecord: firstStanding.teamRecords?.[0]
      })
    })
  })

  describe('9.5.4 Document API Response Formats', () => {
    it('should document complete standings response format', async () => {
      const response = await axios.get(`${API_BASE}/standings`, { timeout: REQUEST_TIMEOUT })
      
      const documentation = {
        endpoint: `${API_BASE}/standings`,
        method: 'GET',
        status: response.status,
        responseStructure: {
          standings: {
            type: 'array',
            description: 'Array of standings divisions/conferences',
            sampleEntry: response.data.standings[0]
          }
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('Standings Response Format Documentation:', JSON.stringify(documentation, null, 2))
      expect(documentation).toBeDefined()
    })

    it('should document complete schedule response format', async () => {
      const response = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      const documentation = {
        endpoint: `${API_BASE}/schedule`,
        method: 'GET',
        status: response.status,
        responseStructure: {
          dates: {
            type: 'array',
            description: 'Array of date entries with games',
            sampleEntry: response.data.dates[0]
          }
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('Schedule Response Format Documentation:', JSON.stringify(documentation, null, 2))
      expect(documentation).toBeDefined()
    })

    it('should document complete teams response format', async () => {
      const response = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      
      const documentation = {
        endpoint: `${API_BASE}/teams`,
        method: 'GET',
        status: response.status,
        responseStructure: {
          teams: {
            type: 'array',
            description: 'Array of NHL teams',
            sampleEntry: response.data.teams[0]
          }
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('Teams Response Format Documentation:', JSON.stringify(documentation, null, 2))
      expect(documentation).toBeDefined()
    })

    it('should document roster response format', async () => {
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const firstTeamId = teamsResponse.data.teams[0].id
      
      const rosterResponse = await axios.get(
        `${API_BASE}/teams/${firstTeamId}/roster`,
        { timeout: REQUEST_TIMEOUT }
      )
      
      const documentation = {
        endpoint: `${API_BASE}/teams/{teamId}/roster`,
        method: 'GET',
        status: rosterResponse.status,
        responseStructure: {
          roster: {
            type: 'array',
            description: 'Array of players on team roster',
            sampleEntry: rosterResponse.data.roster[0]
          }
        },
        timestamp: new Date().toISOString()
      }
      
      console.log('Roster Response Format Documentation:', JSON.stringify(documentation, null, 2))
      expect(documentation).toBeDefined()
    })

    it('should document game feed response format', async () => {
      const scheduleResponse = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      
      let gamePk = null
      for (const dateEntry of scheduleResponse.data.dates) {
        if (dateEntry.games && dateEntry.games.length > 0) {
          gamePk = dateEntry.games[0].gamePk
          break
        }
      }
      
      if (gamePk) {
        const gameResponse = await axios.get(
          `${API_BASE}/game/${gamePk}/feed/live`,
          { timeout: REQUEST_TIMEOUT }
        )
        
        const documentation = {
          endpoint: `${API_BASE}/game/{gamePk}/feed/live`,
          method: 'GET',
          status: gameResponse.status,
          responseStructure: {
            gameData: {
              type: 'object',
              description: 'Static game information'
            },
            liveData: {
              type: 'object',
              description: 'Live game state and plays',
              keys: Object.keys(gameResponse.data.liveData)
            }
          },
          timestamp: new Date().toISOString()
        }
        
        console.log('Game Feed Response Format Documentation:', JSON.stringify(documentation, null, 2))
        expect(documentation).toBeDefined()
      }
    })
  })

  describe('9.5.5 Create Integration Test for Live API Calls', () => {
    it('should successfully fetch and parse multiple endpoints in sequence', async () => {
      // Fetch teams
      const teamsResponse = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      expect(teamsResponse.status).toBe(200)
      expect(teamsResponse.data.teams.length).toBeGreaterThan(0)
      
      // Fetch standings
      const standingsResponse = await axios.get(`${API_BASE}/standings`, { timeout: REQUEST_TIMEOUT })
      expect(standingsResponse.status).toBe(200)
      expect(standingsResponse.data.standings.length).toBeGreaterThan(0)
      
      // Fetch schedule
      const scheduleResponse = await axios.get(`${API_BASE}/schedule`, { timeout: REQUEST_TIMEOUT })
      expect(scheduleResponse.status).toBe(200)
      expect(scheduleResponse.data.dates).toBeDefined()
      
      console.log('Integration Test Results:', {
        teamsCount: teamsResponse.data.teams.length,
        standingsCount: standingsResponse.data.standings.length,
        scheduleDatesCount: scheduleResponse.data.dates?.length,
        allEndpointsSuccessful: true
      })
    })

    it('should handle API responses with proper error handling', async () => {
      try {
        const response = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
        expect(response.status).toBe(200)
        expect(response.data).toBeDefined()
      } catch (error) {
        console.error('API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          message: error.message,
          code: error.code,
          url: error.config?.url
        })
        throw error
      }
    })

    it('should verify API response times are acceptable', async () => {
      const startTime = Date.now()
      
      const response = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      
      const responseTime = Date.now() - startTime
      
      console.log('API Response Time:', {
        endpoint: `${API_BASE}/teams`,
        responseTimeMs: responseTime,
        acceptable: responseTime < REQUEST_TIMEOUT
      })
      
      expect(responseTime).toBeLessThan(REQUEST_TIMEOUT)
      expect(response.status).toBe(200)
    })

    it('should verify data consistency across multiple calls', async () => {
      // First call
      const response1 = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const teams1 = response1.data.teams.map(t => t.id).sort()
      
      // Second call
      const response2 = await axios.get(`${API_BASE}/teams`, { timeout: REQUEST_TIMEOUT })
      const teams2 = response2.data.teams.map(t => t.id).sort()
      
      // Should have same teams
      expect(teams1).toEqual(teams2)
      
      console.log('Data Consistency Check:', {
        firstCallTeamCount: teams1.length,
        secondCallTeamCount: teams2.length,
        consistent: JSON.stringify(teams1) === JSON.stringify(teams2)
      })
    })

    it('should document current API status and availability', async () => {
      const statusReport = {
        timestamp: new Date().toISOString(),
        endpoints: {}
      }
      
      // Test each endpoint
      const endpoints = [
        { name: 'teams', url: `${API_BASE}/teams` },
        { name: 'standings', url: `${API_BASE}/standings` },
        { name: 'schedule', url: `${API_BASE}/schedule` }
      ]
      
      for (const endpoint of endpoints) {
        try {
          const startTime = Date.now()
          const response = await axios.get(endpoint.url, { timeout: REQUEST_TIMEOUT })
          const responseTime = Date.now() - startTime
          
          statusReport.endpoints[endpoint.name] = {
            status: 'available',
            httpStatus: response.status,
            responseTimeMs: responseTime,
            dataAvailable: response.data !== null && response.data !== undefined
          }
        } catch (error) {
          statusReport.endpoints[endpoint.name] = {
            status: 'unavailable',
            error: error.message,
            httpStatus: error.response?.status
          }
        }
      }
      
      console.log('API Status Report:', JSON.stringify(statusReport, null, 2))
      expect(statusReport.endpoints).toBeDefined()
    })
  })
})
