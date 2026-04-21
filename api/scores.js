import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT id, player_name AS "playerName", points, created_at AS "createdAt"
      FROM scoring_events ORDER BY created_at DESC
    `
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const { players } = req.body
    if (!Array.isArray(players) || players.length === 0) {
      return res.status(400).json({ error: 'players array required' })
    }

    const results = []
    for (let { playerName, points } of players) {
      // Strip invisible/non-printable characters from player names
      playerName = playerName ? playerName.replace(/[^\x20-\x7E\u00C0-\u024F]/g, '').trim() : playerName
      if (!playerName || typeof points !== 'number') {
        results.push({ playerName, success: false, reason: 'Invalid data' })
        continue
      }

      const id = `score-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`

      // Upsert: delete old record for this player, insert new
      await sql`DELETE FROM scoring_events WHERE player_name = ${playerName}`
      await sql`
        INSERT INTO scoring_events (id, player_name, points)
        VALUES (${id}, ${playerName}, ${points})
      `

      // Count affected entries (entries that have this player)
      const { rows: affected } = await sql`
        SELECT DISTINCT e.id
        FROM entries e
        JOIN entry_players ep ON ep.entry_id = e.id
        WHERE LOWER(ep.player_name) = LOWER(${playerName})
      `

      // Recalculate total_score for affected entries
      for (const entry of affected) {
        const { rows: scoreRows } = await sql`
          SELECT COALESCE(SUM(se.points), 0) AS total
          FROM entry_players ep
          JOIN scoring_events se ON LOWER(se.player_name) = LOWER(ep.player_name)
          WHERE ep.entry_id = ${entry.id}
        `
        const newTotal = scoreRows[0]?.total ?? 0
        await sql`UPDATE entries SET total_score = ${newTotal} WHERE id = ${entry.id}`
      }

      // Log the update
      const logId = `log-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
      await sql`
        INSERT INTO scoring_update_logs (id, player_name, points, entries_affected, success)
        VALUES (${logId}, ${playerName}, ${points}, ${affected.length}, true)
      `

      results.push({
        playerName,
        points,
        entriesAffected: affected.length,
        success: true
      })
    }

    return res.json({ results })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
