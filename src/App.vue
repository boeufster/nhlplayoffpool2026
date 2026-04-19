<template>
  <div id="app" class="app">
    <header class="header">
      <h1>Stevey's NHL Playoff Pool</h1>
      <nav class="nav">
        <button @click="currentView = 'standings'" :class="{ active: currentView === 'standings' }">
          Standings
        </button>
        <button @click="currentView = 'player-selector'" :class="{ active: currentView === 'player-selector' }">
          Player Selection
        </button>
        <button @click="currentView = 'admin'" :class="{ active: currentView === 'admin' }">
          Admin
        </button>
      </nav>
    </header>
    <main class="main">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import StandingsView from './views/StandingsView.vue'
import PlayerSelectorView from './views/PlayerSelectorView.vue'
import AdminView from './views/AdminView.vue'

export default {
  name: 'App',
  components: {
    StandingsView,
    PlayerSelectorView,
    AdminView
  },
  setup() {
    const currentView = ref('standings')

    const currentComponent = computed(() => {
      if (currentView.value === 'standings') return StandingsView
      if (currentView.value === 'player-selector') return PlayerSelectorView
      return AdminView
    })

    return {
      currentView,
      currentComponent
    }
  }
}
</script>

<style scoped>
.app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  border-bottom: 2px solid #333;
  margin-bottom: 30px;
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 2.5rem;
}

.nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.nav button {
  padding: 10px 20px;
  font-size: 1rem;
  border: 2px solid #333;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav button:hover {
  background: #f0f0f0;
}

.nav button.active {
  background: #333;
  color: white;
}

.main {
  min-height: 60vh;
}
</style>
