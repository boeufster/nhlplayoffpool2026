import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`
      SELECT email, name, entry_fee AS "entryFee", created_at AS "createdAt"
      FROM participants ORDER BY created_at ASC
    `
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const { email, name, entryFee } = req.body
    if (!email || !name) return res.status(400).json({ error: 'email and name required' })
    const fee = entryFee ?? 20
    await sql`
      INSERT INTO participants (email, name, entry_fee)
      VALUES (${email}, ${name}, ${fee})
    `
    return res.status(201).json({ email, name, entryFee: fee })
  }

  if (req.method === 'DELETE') {
    const { email } = req.query
    if (!email) return res.status(400).json({ error: 'email query param required' })
    await sql`DELETE FROM participants WHERE email = ${email}`
    return res.json({ deleted: email })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
