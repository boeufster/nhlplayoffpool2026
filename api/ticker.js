import { sql } from '@vercel/postgres'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { rows } = await sql`SELECT id, message, created_at AS "createdAt" FROM ticker_messages ORDER BY created_at DESC`
    return res.json(rows)
  }

  if (req.method === 'POST') {
    const { message } = req.body
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' })
    }
    const id = `ticker-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    await sql`INSERT INTO ticker_messages (id, message) VALUES (${id}, ${message.trim()})`
    return res.status(201).json({ id, message: message.trim() })
  }

  if (req.method === 'DELETE') {
    const { id } = req.query
    if (!id) return res.status(400).json({ error: 'id query param required' })
    await sql`DELETE FROM ticker_messages WHERE id = ${id}`
    return res.json({ deleted: id })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
