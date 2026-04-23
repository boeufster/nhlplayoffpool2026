<template>
  <div id="app" class="app">
    <header class="header">
      <div class="header-top">
        <h1>Stevey's NHL Playoff Pool</h1>
        <span class="version">Built: {{ buildTime }}</span>
        <select v-model="currentTheme" @change="switchTheme" class="theme-select">
          <option v-for="(theme, key) in themes" :key="key" :value="key">{{ theme.name }}</option>
        </select>
      </div>
      <nav class="nav">
        <button @click="currentView = 'standings'" :class="{ active: currentView === 'standings' }">
          Standings
        </button>
        <button @click="currentView = 'teams'" :class="{ active: currentView === 'teams' }">
          Teams
        </button>
        <button @click="currentView = 'admin'" :class="{ active: currentView === 'admin' }">
          Admin
        </button>
      </nav>
    </header>
    <div v-if="tickerMessages.length > 0" class="ticker-bar">
      <div class="ticker-content">
        <span v-for="(msg, i) in tickerMessages" :key="msg.id">
          {{ msg.message }}<span v-if="i < tickerMessages.length - 1" class="ticker-sep"> 🏒 </span>
        </span>
      </div>
    </div>
    <main class="main">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import StandingsView from './views/StandingsView.vue'
import TeamsView from './views/TeamsView.vue'
import AdminView from './views/AdminView.vue'
import { themes, applyTheme, getStoredTheme } from './themes'
import { apiService } from './services/apiService'

export default {
  name: 'App',
  components: { StandingsView, TeamsView, AdminView },
  setup() {
    const currentView = ref('standings')
    const currentTheme = ref(getStoredTheme())
    const tickerMessages = ref([])

    const currentComponent = computed(() => {
      if (currentView.value === 'standings') return StandingsView
      if (currentView.value === 'teams') return TeamsView
      return AdminView
    })

    const switchTheme = () => {
      applyTheme(currentTheme.value)
    }

    const buildTime = new Date(__BUILD_TIME__).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit'
    })

    onMounted(async () => {
      try {
        tickerMessages.value = await apiService.getTickerMessages()
      } catch (e) {
        /* ticker is non-critical */
      }
    })

    return { currentView, currentComponent, currentTheme, themes, switchTheme, buildTime, tickerMessages }
  }
}
</script>

<style scoped>
.app {
  font-family: var(--font-family);
  max-width: 1200px;
  margin: 0 auto;
  background: var(--bg-app);
  color: var(--text-primary);
  min-height: 100vh;
}

.header {
  background: var(--bg-header);
  padding: 16px 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.version {
  color: var(--text-nav);
  font-size: 0.75rem;
  opacity: 0.7;
}

.header h1 {
  margin: 0;
  font-size: 1.6rem;
  color: var(--text-header);
  font-weight: 700;
  letter-spacing: 1px;
}

.theme-select {
  padding: 4px 8px;
  background: transparent;
  color: var(--text-nav);
  border: 1px solid var(--border-header);
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  font-family: var(--font-family);
}

.theme-select option {
  background: var(--bg-header);
  color: var(--text-header);
}

.nav {
  display: flex;
  gap: 0;
}

.nav button {
  padding: 10px 24px;
  font-size: 0.85rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-nav);
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 3px solid transparent;
  transition: all 0.2s;
  font-family: var(--font-family);
}

.nav button:hover {
  color: var(--text-nav-active);
}

.nav button.active {
  color: var(--text-nav-active);
  border-bottom-color: var(--nav-active-border);
}

.main {
  padding: 24px;
  background: var(--bg-content);
  min-height: 60vh;
}

@media (max-width: 768px) {
  .header { padding: 12px 16px; }
  .header-top { flex-wrap: wrap; }
  .header h1 { font-size: 1.1rem; }
  .version { font-size: 0.65rem; }
  .nav button { padding: 8px 14px; font-size: 0.75rem; }
  .main { padding: 16px; }
}

.ticker-bar {
  background: var(--bg-header);
  overflow: hidden;
  white-space: nowrap;
  border-bottom: 1px solid var(--border-header);
}

.ticker-content {
  display: inline-block;
  padding: 6px 0;
  color: var(--text-heading);
  font-size: 0.85rem;
  font-weight: 600;
  animation: ticker-scroll 20s linear infinite;
}

.ticker-sep {
  margin: 0 16px;
}

@keyframes ticker-scroll {
  0% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}
</style>
