import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  const { playerNames } = req.body

  if (!id) return res.status(400).json({ error: 'Entry id required' })
  if (!Array.isArray(playerNames) || playerNames.length !== 15) {
    return res.status(400).json({ error: 'Exactly 15 playerNames required' })
  }

  // Verify entry exists
  const { rows } = await sql`SELECT id FROM entries WHERE id = ${id}`
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  // Replace all players in a transaction
  await sql`DELETE FROM entry_players WHERE entry_id = ${id}`
  for (let i = 0; i < playerNames.length; i++) {
    await sql`
      INSERT INTO entry_players (entry_id, player_name, position)
      VALUES (${id}, ${playerNames[i].trim()}, ${i + 1})
    `
  }
  await sql`UPDATE entries SET submitted_at = NOW() WHERE id = ${id}`

  return res.json({ entryId: id, playerNames, submittedAt: new Date().toISOString() })
}
