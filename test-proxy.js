import axios from 'axios'

// Test the proxy endpoint
async function testProxy() {
  try {
    console.log('Testing NHL API proxy...')
    
    // This simulates what the app will do
    const response = await axios.get('http://localhost:5173/api/nhl-proxy?endpoint=teams', {
      timeout: 10000
    })
    
    console.log('✅ Proxy works!')
    console.log(`Teams returned: ${response.data.teams.length}`)
    
    if (response.data.teams.length > 0) {
      console.log(`First team: ${response.data.teams[0].name}`)
    }
  } catch (error) {
    console.error('❌ Proxy test failed:', error.message)
    process.exit(1)
  }
}

testProxy()
