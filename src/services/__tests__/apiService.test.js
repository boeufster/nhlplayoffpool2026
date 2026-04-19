import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiService } from '../apiService'

describe('apiService', () => {
  let fetchMock

  beforeEach(() => {
    fetchMock = vi.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const mockOkResponse = (data) => {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data)
    })
  }

  const mockErrorResponse = (status, errorBody) => {
    return Promise.resolve({
      ok: false,
      status,
      statusText: `HTTP ${status}`,
      json: () => Promise.resolve(errorBody)
    })
  }

  describe('fetchPoolData', () => {
    it('should call GET /api/pool-data', async () => {
      const poolData = { participants: [], entries: [], scoringEvents: [], lastUpdated: '2025-01-01T00:00:00Z' }
      fetchMock.mockReturnValue(mockOkResponse(poolData))

      const result = await apiService.fetchPoolData()

      expect(fetchMock).toHaveBeenCalledWith('/api/pool-data', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      }))
      expect(result).toEqual(poolData)
    })
  })

  describe('Participants API', () => {
    it('should call GET /api/participants', async () => {
      fetchMock.mockReturnValue(mockOkResponse([]))
      await apiService.getParticipants()
      expect(fetchMock).toHaveBeenCalledWith('/api/participants', expect.objectContaining({
        headers: { 'Content-Type': 'application/json' }
      }))
    })

    it('should call POST /api/participants with correct body', async () => {
      fetchMock.mockReturnValue(mockOkResponse({ email: 'a@b.com', name: 'Alice', entryFee: 20 }))

      await apiService.createParticipant('a@b.com', 'Alice', 20)

      expect(fetchMock).toHaveBeenCalledWith('/api/participants', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'a@b.com', name: 'Alice', entryFee: 20 })
      }))
    })

    it('should call DELETE /api/participants with email query param', async () => {
      fetchMock.mockReturnValue(mockOkResponse({ deleted: 'a@b.com' }))

      await apiService.deleteParticipant('a@b.com')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/participants?email=a%40b.com',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Entries API', () => {
    it('should call GET /api/entries', async () => {
      fetchMock.mockReturnValue(mockOkResponse([]))
      await apiService.getEntries()
      expect(fetchMock).toHaveBeenCalledWith('/api/entries', expect.any(Object))
    })

    it('should call POST /api/entries with correct body', async () => {
      fetchMock.mockReturnValue(mockOkResponse({ id: 'entry-1' }))

      await apiService.createEntry('a@b.com', 'Alice')

      expect(fetchMock).toHaveBeenCalledWith('/api/entries', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ email: 'a@b.com', participantName: 'Alice' })
      }))
    })

    it('should call DELETE /api/entries with id query param', async () => {
      fetchMock.mockReturnValue(mockOkResponse({ deleted: 'entry-1' }))

      await apiService.deleteEntry('entry-1')

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/entries?id=entry-1',
        expect.objectContaining({ method: 'DELETE' })
      )
    })
  })

  describe('Player Assignment API', () => {
    it('should call PUT /api/entries/:id/players with playerNames body', async () => {
      const playerNames = Array.from({ length: 15 }, (_, i) => `Player ${i + 1}`)
      fetchMock.mockReturnValue(mockOkResponse({ entryId: 'entry-1', playerNames }))

      await apiService.assignPlayers('entry-1', playerNames)

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/entries/entry-1/players',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ playerNames })
        })
      )
    })
  })

  describe('Scores API', () => {
    it('should call GET /api/scores', async () => {
      fetchMock.mockReturnValue(mockOkResponse([]))
      await apiService.getScores()
      expect(fetchMock).toHaveBeenCalledWith('/api/scores', expect.any(Object))
    })

    it('should call POST /api/scores with players array', async () => {
      const players = [{ playerName: 'Player A', points: 5 }]
      fetchMock.mockReturnValue(mockOkResponse({ results: [] }))

      await apiService.updateScores(players)

      expect(fetchMock).toHaveBeenCalledWith('/api/scores', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ players })
      }))
    })
  })

  describe('Error Handling', () => {
    it('should throw Error with server error message on non-OK response', async () => {
      fetchMock.mockReturnValue(mockErrorResponse(400, { error: 'email and name required' }))

      await expect(apiService.createParticipant('', '', 0)).rejects.toThrow('email and name required')
    })

    it('should throw Error with HTTP status when response body has no error field', async () => {
      fetchMock.mockReturnValue(Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('no json'))
      }))

      await expect(apiService.fetchPoolData()).rejects.toThrow('Internal Server Error')
    })
  })
})
