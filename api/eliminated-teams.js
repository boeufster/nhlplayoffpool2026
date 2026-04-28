import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`SELECT team_code FROM eliminated_teams ORDER BY eliminated_at ASC`
    return res.json(rows.map(r => r.team_code))
  }

  if (req.method === 'POST') {
    const { teams } = req.body
    if (!Array.isArray(teams)) {
      return res.status(400).json({ error: 'teams array required' })
    }

    const valid = teams.every(t => typeof t === 'string' && /^[A-Z]{2,4}$/.test(t))
    if (!valid) {
      return res.status(400).json({ error: 'Each team must be 2-4 uppercase letters' })
    }

    await sql`DELETE FROM eliminated_teams`
    for (const team of teams) {
      await sql`INSERT INTO eliminated_teams (team_code) VALUES (${team}) ON CONFLICT DO NOTHING`
    }

    return res.json({ eliminatedTeams: teams })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
