<template>
  <div id="app" class="app">
    <header class="header">
      <div class="header-top">
        <h1>Stevey's NHL Playoff Pool</h1>
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
    <main class="main">
      <component :is="currentComponent" />
    </main>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import StandingsView from './views/StandingsView.vue'
import TeamsView from './views/TeamsView.vue'
import AdminView from './views/AdminView.vue'
import { themes, applyTheme, getStoredTheme } from './themes'

export default {
  name: 'App',
  components: { StandingsView, TeamsView, AdminView },
  setup() {
    const currentView = ref('standings')
    const currentTheme = ref(getStoredTheme())

    const currentComponent = computed(() => {
      if (currentView.value === 'standings') return StandingsView
      if (currentView.value === 'teams') return TeamsView
      return AdminView
    })

    const switchTheme = () => {
      applyTheme(currentTheme.value)
    }

    return { currentView, currentComponent, currentTheme, themes, switchTheme }
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
</style>
