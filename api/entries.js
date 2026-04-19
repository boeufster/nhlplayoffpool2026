import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch entries
    const { rows: entries } = await sql`
      SELECT id, email, participant_name AS "participantName",
             total_score AS "totalScore",
             created_at AS "createdAt", submitted_at AS "submittedAt"
      FROM entries ORDER BY created_at ASC
    `
    // Fetch all entry_players in one query
    const { rows: players } = await sql`
      SELECT entry_id AS "entryId", player_name AS "playerName", position
      FROM entry_players ORDER BY position ASC
    `
    // Group players by entry
    const playersByEntry = {}
    for (const p of players) {
      if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
      playersByEntry[p.entryId].push(p.playerName)
    }
    // Attach to entries
    const result = entries.map(e => ({
      ...e,
      playerNames: playersByEntry[e.id] || [],
      playerIds: playersByEntry[e.id] || []
    }))
    return res.json(result)
  }

  if (req.method === 'POST') {
    const { email, participantName } = req.body
    if (!email || !participantName) {
      return res.status(400).json({ error: 'email and participantName required' })
    }
    const id = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await sql`
      INSERT INTO entries (id, email, participant_name)
      VALUES (${id}, ${email}, ${participantName})
    `
    return res.status(201).json({ id, email, participantName, totalScore: 0, playerNames: [] })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id query param required' })
    await sql`DELETE FROM entries WHERE id = ${id}`
    return res.json({ deleted: id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
