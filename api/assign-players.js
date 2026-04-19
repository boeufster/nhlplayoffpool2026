import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { entryId, playerNames } = req.body

  if (!entryId) return res.status(400).json({ error: 'entryId required' })
  if (!Array.isArray(playerNames) || playerNames.length !== 15) {
    return res.status(400).json({ error: 'Exactly 15 playerNames required' })
  }

  // Verify entry exists
  const { rows } = await sql`SELECT id FROM entries WHERE id = ${entryId}`
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Entry not found' })
  }

  // Replace all players
  await sql`DELETE FROM entry_players WHERE entry_id = ${entryId}`
  for (let i = 0; i < playerNames.length; i++) {
    await sql`
      INSERT INTO entry_players (entry_id, player_name, position)
      VALUES (${entryId}, ${playerNames[i].trim()}, ${i + 1})
    `
  }
  await sql`UPDATE entries SET submitted_at = NOW() WHERE id = ${entryId}`

  return res.json({ entryId, playerNames, submittedAt: new Date().toISOString() })
}
