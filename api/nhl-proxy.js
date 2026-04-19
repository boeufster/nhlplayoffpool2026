import axios from 'axios'

const NHL_API_BASE = 'https://statsapi.web.nhl.com/api/v1'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    const { endpoint } = req.query

    if (!endpoint) {
      return res.status(400).json({ error: 'Missing endpoint parameter' })
    }

    const url = `${NHL_API_BASE}/${endpoint}`
    const response = await axios.get(url, { timeout: 30000 })

    res.status(200).json(response.data)
  } catch (error) {
    console.error('NHL API Proxy Error:', error.message)
    res.status(error.response?.status || 500).json({
      error: error.message,
      status: error.response?.status
    })
  }
}
