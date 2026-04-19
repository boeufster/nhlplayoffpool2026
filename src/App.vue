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
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 100%);
  color: #e0e0e0;
  min-height: 100vh;
}

.header {
  border-bottom: 4px solid #c41e3a;
  margin-bottom: 30px;
  padding-bottom: 20px;
  position: relative;
  overflow: hidden;
  background: linear-gradient(90deg, rgba(196, 30, 58, 0.1) 0%, transparent 50%, rgba(0, 212, 255, 0.1) 100%);
  border-radius: 8px;
}

.header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #c41e3a, #00d4ff, #c41e3a);
  animation: shimmer 3s infinite;
}



@keyframes shimmer {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.3); }
  50% { box-shadow: 0 0 40px rgba(0, 212, 255, 0.6); }
}

@keyframes slide-in {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

.header h1 {
  margin: 0 0 20px 0;
  font-size: 2.8rem;
  color: #00d4ff;
  text-shadow: 
    0 0 10px rgba(0, 212, 255, 0.5),
    0 0 20px rgba(196, 30, 58, 0.3),
    0 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  font-weight: 800;
}

.nav {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.nav button {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid #00d4ff;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  color: #e0e0e0;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: inset 0 0 10px rgba(0, 212, 255, 0.05);
}

.nav button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.3), transparent);
  transition: left 0.5s;
}

.nav button::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(90deg, #00d4ff, #c41e3a);
  transition: width 0.3s ease;
}

.nav button:hover {
  background: linear-gradient(135deg, #2a2f4a 0%, #3a3f5a 100%);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3), inset 0 0 10px rgba(0, 212, 255, 0.1);
  transform: translateY(-2px);
}

.nav button:hover::before {
  left: 100%;
}

.nav button:hover::after {
  width: 100%;
}

.nav button.active {
  background: linear-gradient(135deg, #c41e3a 0%, #a01830 100%);
  color: white;
  border-color: #ff6b6b;
  box-shadow: 
    0 0 20px rgba(196, 30, 58, 0.6),
    inset 0 0 10px rgba(255, 107, 107, 0.2),
    0 4px 15px rgba(196, 30, 58, 0.4);
  transform: translateY(-2px);
}

.nav button.active::after {
  width: 100%;
  background: #ff6b6b;
}

.main {
  min-height: 60vh;
  animation: fadeIn 0.5s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
