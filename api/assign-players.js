import { sql } from '@vercel/postgres'

/**
 * Parses a raw player string to extract the player name and optional team code.
 * Inlined here because Vercel serverless functions don't bundle from src/.
 *
 * @param {string} raw - e.g. "Connor McDavid EDM"
 * @returns {{ playerName: string, team: string | null }}
 */
function parsePlayerNameAndTeam(raw) {
  const trimmed = raw.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    const lastToken = parts[parts.length - 1]
    if (/^[A-Z]{2,4}$/.test(lastToken)) {
      return { playerName: parts.slice(0, -1).join(' '), team: lastToken }
    }
  }
  return { playerName: trimmed, team: null }
}

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
    const { playerName, team } = parsePlayerNameAndTeam(playerNames[i])
    await sql`
      INSERT INTO entry_players (entry_id, player_name, position, team)
      VALUES (${entryId}, ${playerName}, ${i + 1}, ${team})
    `
  }
  await sql`UPDATE entries SET submitted_at = NOW() WHERE id = ${entryId}`

  return res.json({ entryId, playerNames, submittedAt: new Date().toISOString() })
}
