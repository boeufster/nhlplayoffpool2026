import axios from 'axios'

async function getFirstRealPlayer() {
  try {
    console.log('Fetching real NHL player data...\n')
    
    // This is what the app will do through the proxy
    const response = await axios.get('https://statsapi.web.nhl.com/api/v1/teams/1/roster', {
      timeout: 10000
    })
    
    const firstPlayer = response.data.roster[0]
    
    console.log('✅ SUCCESS! Here is a real NHL player:\n')
    console.log(`Name: ${firstPlayer.person.fullName}`)
    console.log(`Position: ${firstPlayer.position.code} (${firstPlayer.position.name})`)
    console.log(`Jersey: #${firstPlayer.jerseyNumber}`)
    console.log(`Team: New Jersey Devils`)
    console.log(`\nThis is REAL data from the NHL API, not fake data.`)
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

getFirstRealPlayer()
