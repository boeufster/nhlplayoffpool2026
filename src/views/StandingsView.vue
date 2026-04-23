<template>
  <div class="standings-view">
    <!-- Confetti overlay -->
    <div v-if="showConfetti" class="confetti-container">
      <div
        v-for="i in 30"
        :key="i"
        class="confetti-piece"
        :style="{
          left: Math.random() * 100 + '%',
          backgroundColor: confettiColors[i % confettiColors.length],
          animationDelay: Math.random() * 2 + 's',
          animationDuration: (2 + Math.random() * 2) + 's'
        }"
      ></div>
    </div>

    <h2>Standings</h2>
    <p v-if="lastUpdated" class="last-updated">Stats updated: {{ lastUpdated }}</p>
    <div v-if="entries.length === 0" class="empty-state">
      <p>No entries yet</p>
    </div>
    <table v-else class="standings-table">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Participant</th>
          <th class="hide-mobile">Entry ID</th>
          <th class="points-header">Points</th>
          <th class="hide-mobile">Gap</th>
          <th>Prize</th>
        </tr>
      </thead>
      <TransitionGroup name="standings" tag="tbody">
        <tr v-for="(entry, index) in sortedEntries" :key="entry.id">
          <td>{{ index + 1 }}</td>
          <td>{{ entry.participantName }}</td>
          <td class="hide-mobile">{{ entry.id }}</td>
          <td class="points-cell">{{ entry.calculatedScore }}</td>
          <td class="gap-cell hide-mobile">{{ index === 0 ? '—' : entry.calculatedScore - sortedEntries[0].calculatedScore }}</td>
          <td class="prize-cell">{{ getPrize(index) }}</td>
        </tr>
      </TransitionGroup>
    </table>

    <!-- MVP Player Card -->
    <div v-if="mvpPlayer" class="mvp-card">
      <div class="mvp-label">🏆 MVP Player</div>
      <div class="mvp-name">{{ mvpPlayer.playerName }}</div>
      <div class="mvp-points">{{ mvpPlayer.points }} pts</div>
    </div>

    <!-- Dark Horse Card -->
    <div v-if="darkHorse" class="darkhorse-card">
      <div class="darkhorse-label">🐴 Dark Horse</div>
      <div class="darkhorse-name">{{ darkHorse.playerName }}</div>
      <div class="darkhorse-meta">{{ darkHorse.points }} pts · in {{ darkHorse.entryCount }} {{ darkHorse.entryCount === 1 ? 'entry' : 'entries' }}</div>
    </div>

    <!-- Biggest Bust Card -->
    <div v-if="biggestBust" class="bust-card">
      <div class="bust-label">💩 Biggest Bust</div>
      <div class="bust-name">{{ biggestBust.playerName }}</div>
      <div class="bust-meta">{{ biggestBust.points }} pts · picked by {{ biggestBust.entryCount }} entries</div>
    </div>

    <!-- Latest Player Stats Section -->
    <section class="player-stats-section">
      <h3>Latest Player Stats</h3>
      <div v-if="latestPlayerStats.length === 0" class="no-data">
        No player stats recorded yet
      </div>
      <table v-else class="player-stats-table">
        <thead>
          <tr>
            <th>Player Name</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(stat, idx) in latestPlayerStats" :key="idx">
            <td>{{ stat.playerName }}</td>
            <td>{{ stat.points }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'

export default {
  name: 'StandingsView',
  setup() {
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    const showConfetti = ref(false)
    const confettiColors = ['#c8102e', '#ffffff', '#003087', '#ffd700']

    const entries = computed(() => entriesStore.entries)

    const sortedEntries = computed(() => {
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }

      const entriesWithScores = entries.value.map(entry => {
        let calculatedScore = 0
        const players = entry.playerNames || entry.playerIds || []
        for (const playerName of players) {
          const key = String(playerName).toLowerCase()
          calculatedScore += playerPointsMap.get(key) || 0
        }
        return { ...entry, calculatedScore }
      })

      return entriesWithScores.sort((a, b) => {
        if (b.calculatedScore !== a.calculatedScore) {
          return b.calculatedScore - a.calculatedScore
        }
        return new Date(a.createdAt) - new Date(b.createdAt)
      })
    })

    const mvpPlayer = computed(() => {
      if (scoresStore.scoringEvents.length === 0) return null
      let best = null
      for (const event of scoresStore.scoringEvents) {
        if (!best || event.points > best.points) {
          best = event
        }
      }
      return best
    })

    const latestPlayerStats = computed(() => {
      return [...scoresStore.scoringEvents].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return (a.playerName || '').localeCompare(b.playerName || '')
      })
    })

    const getPrize = (index) => {
      if (index === 0) return '$85'
      if (index === 1) return '$40'
      if (index === 2) return '$15'
      return ''
    }

    const lastUpdated = computed(() => {
      if (scoresStore.scoringEvents.length === 0) return null
      const dates = scoresStore.scoringEvents
        .map(e => e.createdAt)
        .filter(Boolean)
        .map(d => new Date(d))
      if (dates.length === 0) return null
      const latest = new Date(Math.max(...dates))
      return latest.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
    })

    onMounted(() => {
      if (entries.value.length > 0) {
        showConfetti.value = true
        setTimeout(() => { showConfetti.value = false }, 3000)
      }
    })

    // Also trigger if entries load after mount
    watch(entries, (val) => {
      if (val.length > 0 && !showConfetti.value) {
        showConfetti.value = true
        setTimeout(() => { showConfetti.value = false }, 3000)
      }
    }, { once: true })

    const darkHorse = computed(() => {
      if (scoresStore.scoringEvents.length === 0 || entries.value.length === 0) return null
      const playerEntryCount = new Map()
      for (const entry of entries.value) {
        const players = entry.playerNames || entry.playerIds || []
        for (const p of players) {
          const key = String(p).toLowerCase()
          playerEntryCount.set(key, (playerEntryCount.get(key) || 0) + 1)
        }
      }
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }
      let best = null
      for (const [name, count] of playerEntryCount) {
        if (count > 2) continue
        const pts = playerPointsMap.get(name) || 0
        if (pts === 0) continue
        if (!best || pts > best.points) {
          const original = scoresStore.scoringEvents.find(e => e.playerName && e.playerName.toLowerCase() === name)
          best = { playerName: original ? original.playerName : name, points: pts, entryCount: count }
        }
      }
      return best
    })

    const biggestBust = computed(() => {
      if (scoresStore.scoringEvents.length === 0 || entries.value.length === 0) return null
      const playerEntryCount = new Map()
      for (const entry of entries.value) {
        const players = entry.playerNames || entry.playerIds || []
        for (const p of players) {
          const key = String(p).toLowerCase()
          playerEntryCount.set(key, (playerEntryCount.get(key) || 0) + 1)
        }
      }
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }
      let worst = null
      for (const [name, count] of playerEntryCount) {
        if (count < 3) continue
        const pts = playerPointsMap.get(name) || 0
        if (!worst || pts < worst.points || (pts === worst.points && count > worst.entryCount)) {
          const original = scoresStore.scoringEvents.find(e => e.playerName && e.playerName.toLowerCase() === name)
          worst = { playerName: original ? original.playerName : name, points: pts, entryCount: count }
        }
      }
      return worst
    })

    return {
      entries,
      sortedEntries,
      latestPlayerStats,
      mvpPlayer,
      darkHorse,
      biggestBust,
      lastUpdated,
      getPrize,
      showConfetti,
      confettiColors
    }
  }
}
</script>

<style scoped>
.standings-view { padding: 0; position: relative; }
.standings-view h2 { margin: 0 0 4px 0; color: var(--text-heading); font-size: 1.8rem; font-weight: 700; }
.last-updated { color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 16px 0; }
.empty-state { text-align: center; padding: 60px 40px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 4px; }
.standings-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
.standings-table th { background: var(--bg-card) !important; color: var(--text-secondary) !important; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color) !important; font-size: 0.75rem; }
.standings-table th:last-child { background: var(--bg-card) !important; }
.standings-table td { padding: 12px; border-bottom: 1px solid var(--border-light) !important; color: var(--text-primary); font-size: 0.9rem; }
.standings-table td:last-child { font-weight: 700; }
.points-cell { background: var(--bg-highlight) !important; font-weight: 700; font-size: 1.05rem; }
.points-header { background: var(--bg-highlight) !important; color: var(--text-primary) !important; }
.gap-cell { color: var(--text-secondary); font-weight: 600; font-size: 0.85rem; }
.prize-cell { color: var(--success-color); font-weight: 600; }
.standings-table tbody tr:hover { background: var(--bg-row-hover) !important; }
.standings-table tbody tr:nth-child(even) { background: var(--bg-row-even); }

/* MVP Card */
.mvp-card { margin-top: 24px; padding: 20px; background: var(--bg-card); border: 2px solid var(--text-heading); border-radius: 4px; text-align: center; }
.mvp-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; }
.mvp-name { font-size: 1.4rem; font-weight: 700; color: var(--text-heading); }
.mvp-points { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin-top: 4px; }

/* Confetti */
.confetti-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 9999; overflow: hidden; }
.confetti-piece { position: absolute; top: -10px; width: 10px; height: 10px; opacity: 0.85; animation: confetti-fall linear forwards; }
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}

.player-stats-section { margin-top: 40px; padding: 0; border: none; background: none; }
.player-stats-section h3 { margin: 0 0 16px 0; color: var(--text-heading); font-size: 1.4rem; font-weight: 700; }
.no-data { padding: 30px; text-align: center; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 4px; }
.player-stats-table { width: 100%; border-collapse: collapse; background: var(--bg-card); }
.player-stats-table th { background: var(--bg-card) !important; color: var(--text-secondary) !important; padding: 10px 12px; text-align: left; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid var(--border-color) !important; font-size: 0.75rem; }
.player-stats-table th:last-child { background: var(--bg-highlight) !important; }
.player-stats-table td { padding: 10px 12px; border-bottom: 1px solid var(--border-light) !important; color: var(--text-primary); }
.player-stats-table td:last-child { background: var(--bg-highlight); font-weight: 700; }
.player-stats-table tbody tr:hover { background: var(--bg-row-hover) !important; }
.player-stats-table tbody tr:nth-child(even) { background: var(--bg-row-even); }

/* Standings Transition Animations */
.standings-move { transition: transform 0.5s ease; }
.standings-enter-active, .standings-leave-active { transition: all 0.5s ease; }
.standings-enter-from { opacity: 0; transform: translateX(-30px); }
.standings-leave-to { opacity: 0; transform: translateX(30px); }

/* Dark Horse Card */
.darkhorse-card { margin-top: 16px; padding: 20px; background: var(--bg-card); border: 2px solid var(--text-heading); border-radius: 4px; text-align: center; }
.darkhorse-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; }
.darkhorse-name { font-size: 1.4rem; font-weight: 700; color: var(--text-heading); }
.darkhorse-meta { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }

/* Biggest Bust Card */
.bust-card { margin-top: 16px; padding: 20px; background: var(--bg-card); border: 2px solid var(--border-color); border-radius: 4px; text-align: center; }
.bust-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 6px; font-weight: 600; }
.bust-name { font-size: 1.4rem; font-weight: 700; color: var(--text-heading); }
.bust-meta { font-size: 0.85rem; color: var(--text-secondary); margin-top: 4px; }

@media (max-width: 768px) {
  .standings-table th, .standings-table td { padding: 8px 6px; font-size: 0.8rem; }
  .hide-mobile { display: none; }
  .points-cell { font-size: 0.9rem; }
  .standings-view h2 { font-size: 1.4rem; }
  .player-stats-section h3 { font-size: 1.1rem; }
  .player-stats-table th, .player-stats-table td { padding: 8px 6px; font-size: 0.8rem; }
  .mvp-card { padding: 14px; }
  .mvp-name { font-size: 1.1rem; }
  .darkhorse-card { padding: 14px; }
  .darkhorse-name { font-size: 1.1rem; }
  .bust-card { padding: 14px; }
  .bust-name { font-size: 1.1rem; }
}
</style>
