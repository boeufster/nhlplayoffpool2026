import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Fetch all data in parallel
  const [participantsResult, entriesResult, playersResult, scoresResult, logsResult, eliminatedTeamsResult] =
    await Promise.all([
      sql`SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt"
          FROM participants ORDER BY created_at ASC`,
      sql`SELECT id, email, participant_name AS "participantName",
                 total_score AS "totalScore",
                 created_at AS "createdAt", submitted_at AS "submittedAt"
          FROM entries ORDER BY created_at ASC`,
      sql`SELECT entry_id AS "entryId", player_name AS "playerName", position, team
          FROM entry_players ORDER BY position ASC`,
      sql`SELECT id, player_name AS "playerName", points, team, created_at AS "createdAt"
          FROM scoring_events ORDER BY created_at DESC`,
      sql`SELECT id, player_name AS "playerName", points,
                 entries_affected AS "entriesAffected", success, reason,
                 created_at AS "createdAt"
          FROM scoring_update_logs ORDER BY created_at DESC`,
      sql`SELECT team_code AS "teamCode" FROM eliminated_teams ORDER BY eliminated_at ASC`
    ])

  // Group players by entry and build playerTeams map
  const playersByEntry = {}
  const playerTeamsByEntry = {}
  for (const p of playersResult.rows) {
    if (!playersByEntry[p.entryId]) playersByEntry[p.entryId] = []
    playersByEntry[p.entryId].push(p.playerName)

    if (!playerTeamsByEntry[p.entryId]) playerTeamsByEntry[p.entryId] = {}
    playerTeamsByEntry[p.entryId][p.playerName.toLowerCase()] = p.team || null
  }

  // Build eliminated teams array
  const eliminatedTeams = eliminatedTeamsResult.rows.map(r => r.teamCode)

  // Attach players to entries
  const entries = entriesResult.rows.map(e => ({
    ...e,
    playerNames: playersByEntry[e.id] || [],
    playerIds: playersByEntry[e.id] || [],
    playerTeams: playerTeamsByEntry[e.id] || {}
  }))

  return res.json({
    participants: participantsResult.rows,
    entries,
    eliminatedTeams,
    scoringEvents: scoresResult.rows,
    scoringUpdateLogs: logsResult.rows,
    lastUpdated: new Date().toISOString()
  })
}
