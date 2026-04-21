import express from 'express'
import pg from 'pg'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'

dotenv.config({ path: '.env.local' })

const { Pool } = pg
const pool = new Pool({ connectionString: process.env.POSTGRES_URL })

const app = express()
app.use(express.json())

// --- API Routes ---

// Participants
app.get('/api/participants', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt" FROM participants ORDER BY created_at ASC'
  )
  res.json(rows)
})

app.post('/api/participants', async (req, res) => {
  const { email, name, entryFee } = req.body
  if (!email || !name) return res.status(400).json({ error: 'email and name required' })
  const fee = entryFee ?? 20
  try {
    await pool.query('INSERT INTO participants (email, name, entry_fee) VALUES ($1, $2, $3)', [email, name, fee])
    res.status(201).json({ email, name, entryFee: fee })
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Participant with this email already exists' })
    throw err
  }
})

app.delete('/api/participants', async (req, res) => {
  const { email } = req.query
  if (!email) return res.status(400).json({ error: 'email query param required' })
  await pool.query('DELETE FROM participants WHERE email = $1', [email])
  res.json({ deleted: email })
})

// Entries
app.get('/api/entries', async (req, res) => {
  const { rows: entries } = await pool.query(
    'SELECT id, email, participant_name AS "participantName", total_score AS "totalScore", created_at AS "createdAt", submitted_at AS "submittedAt" FROM entries ORDER BY created_at ASC'
  )
  const { rows: players } = await pool.query(
    'SELECT entry_id AS "entryId", player_name AS "playerName", position FROM entry_players ORDER BY position ASC'
  )
  const playersByEntry = {}
  for (const p of players) {
    if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
    playersByEntry[p.entryId].push(p.playerName)
  }
  res.json(entries.map(e => ({ ...e, playerNames: playersByEntry[e.id] || [], playerIds: playersByEntry[e.id] || [] })))
})

app.post('/api/entries', async (req, res) => {
  const { email, participantName } = req.body
  if (!email || !participantName) return res.status(400).json({ error: 'email and participantName required' })
  const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  await pool.query('INSERT INTO entries (id, email, participant_name) VALUES ($1, $2, $3)', [id, email, participantName])
  res.status(201).json({ id, email, participantName, totalScore: 0, playerNames: [] })
})

app.delete('/api/entries', async (req, res) => {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'id query param required' })
  await pool.query('DELETE FROM entries WHERE id = $1', [id])
  res.json({ deleted: id })
})

// Assign players (flat route)
app.post('/api/assign-players', async (req, res) => {
  const { entryId, playerNames } = req.body
  if (!entryId) return res.status(400).json({ error: 'entryId required' })
  if (!Array.isArray(playerNames) || playerNames.length !== 15) {
    return res.status(400).json({ error: 'Exactly 15 playerNames required' })
  }
  const { rows } = await pool.query('SELECT id FROM entries WHERE id = $1', [entryId])
  if (rows.length === 0) return res.status(404).json({ error: 'Entry not found' })

  await pool.query('DELETE FROM entry_players WHERE entry_id = $1', [entryId])
  for (let i = 0; i < playerNames.length; i++) {
    await pool.query('INSERT INTO entry_players (entry_id, player_name, position) VALUES ($1, $2, $3)', [entryId, playerNames[i].trim(), i + 1])
  }
  await pool.query('UPDATE entries SET submitted_at = NOW() WHERE id = $1', [entryId])
  res.json({ entryId, playerNames, submittedAt: new Date().toISOString() })
})

// Assign players (dynamic route - kept for backward compat)
app.put('/api/entries/:id/players', async (req, res) => {
  const { id } = req.params
  const { playerNames } = req.body
  if (!Array.isArray(playerNames) || playerNames.length !== 15) {
    return res.status(400).json({ error: 'Exactly 15 playerNames required' })
  }
  const { rows } = await pool.query('SELECT id FROM entries WHERE id = $1', [id])
  if (rows.length === 0) return res.status(404).json({ error: 'Entry not found' })

  await pool.query('DELETE FROM entry_players WHERE entry_id = $1', [id])
  for (let i = 0; i < playerNames.length; i++) {
    await pool.query('INSERT INTO entry_players (entry_id, player_name, position) VALUES ($1, $2, $3)', [id, playerNames[i].trim(), i + 1])
  }
  await pool.query('UPDATE entries SET submitted_at = NOW() WHERE id = $1', [id])
  res.json({ entryId: id, playerNames, submittedAt: new Date().toISOString() })
})

// Scores
app.get('/api/scores', async (req, res) => {
  const { rows } = await pool.query('SELECT id, player_name AS "playerName", points, created_at AS "createdAt" FROM scoring_events ORDER BY created_at DESC')
  res.json(rows)
})

app.post('/api/scores', async (req, res) => {
  const { players } = req.body
  if (!Array.isArray(players) || players.length === 0) return res.status(400).json({ error: 'players array required' })

  const results = []
  for (let { playerName, points } of players) {
    playerName = playerName ? playerName.replace(/[^\x20-\x7E\u00C0-\u024F]/g, '').trim() : playerName
    if (!playerName || typeof points !== 'number') {
      results.push({ playerName, success: false, reason: 'Invalid data' })
      continue
    }
    const id = `score-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await pool.query('DELETE FROM scoring_events WHERE player_name = $1', [playerName])
    await pool.query('INSERT INTO scoring_events (id, player_name, points) VALUES ($1, $2, $3)', [id, playerName, points])

    const { rows: affected } = await pool.query(
      'SELECT DISTINCT e.id FROM entries e JOIN entry_players ep ON ep.entry_id = e.id WHERE LOWER(ep.player_name) = LOWER($1)', [playerName]
    )
    for (const entry of affected) {
      const { rows: scoreRows } = await pool.query(
        'SELECT COALESCE(SUM(se.points), 0) AS total FROM entry_players ep JOIN scoring_events se ON LOWER(se.player_name) = LOWER(ep.player_name) WHERE ep.entry_id = $1', [entry.id]
      )
      await pool.query('UPDATE entries SET total_score = $1 WHERE id = $2', [scoreRows[0]?.total ?? 0, entry.id])
    }

    const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await pool.query('INSERT INTO scoring_update_logs (id, player_name, points, entries_affected, success) VALUES ($1, $2, $3, $4, $5)', [logId, playerName, points, affected.length, true])
    results.push({ playerName, points, entriesAffected: affected.length, success: true })
  }
  res.json({ results })
})

// Pool data (bulk fetch)
app.get('/api/pool-data', async (req, res) => {
  const [participantsResult, entriesResult, playersResult, scoresResult, logsResult] = await Promise.all([
    pool.query('SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt" FROM participants ORDER BY created_at ASC'),
    pool.query('SELECT id, email, participant_name AS "participantName", total_score AS "totalScore", created_at AS "createdAt", submitted_at AS "submittedAt" FROM entries ORDER BY created_at ASC'),
    pool.query('SELECT entry_id AS "entryId", player_name AS "playerName", position FROM entry_players ORDER BY position ASC'),
    pool.query('SELECT id, player_name AS "playerName", points, created_at AS "createdAt" FROM scoring_events ORDER BY created_at DESC'),
    pool.query('SELECT id, player_name AS "playerName", points, entries_affected AS "entriesAffected", success, reason, created_at AS "createdAt" FROM scoring_update_logs ORDER BY created_at DESC')
  ])
  const playersByEntry = {}
  for (const p of playersResult.rows) {
    if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
    playersByEntry[p.entryId].push(p.playerName)
  }
  const entries = entriesResult.rows.map(e => ({ ...e, playerNames: playersByEntry[e.id] || [], playerIds: playersByEntry[e.id] || [] }))
  res.json({ participants: participantsResult.rows, entries, scoringEvents: scoresResult.rows, scoringUpdateLogs: logsResult.rows, lastUpdated: new Date().toISOString() })
})

// Proxy everything else to Vite
app.use('/', createProxyMiddleware({ target: 'http://localhost:5173', changeOrigin: true, ws: true }))

app.listen(3000, () => console.log('Dev server running at http://localhost:3000'))
