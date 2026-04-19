<template>
  <div class="teams-view">
    <h2>Teams</h2>
    <div v-if="sortedEntries.length === 0" class="empty-state">
      <p>No entries yet</p>
    </div>
    <div v-else class="entries-grid">
      <div v-for="entry in sortedEntries" :key="entry.id" class="entry-card">
        <div class="entry-header">
          <h3 class="participant-name">{{ entry.participantName }}</h3>
          <span class="entry-score">{{ entry.calculatedScore }} pts</span>
        </div>
        <p class="entry-id">Entry: {{ entry.id }}</p>
        <div v-if="entry.playerNames && entry.playerNames.length > 0" class="players-list">
          <div v-for="(player, idx) in entry.playerNames" :key="idx" class="player-row">
            <span class="player-number">{{ idx + 1 }}.</span>
            <span class="player-name">{{ player }}</span>
            <span class="player-pts">{{ getPlayerPoints(player) }}</span>
          </div>
        </div>
        <div v-else class="no-players">No players assigned</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useScoresStore } from '../stores/scores'

export default {
  name: 'TeamsView',
  setup() {
    const entriesStore = useEntriesStore()
    const scoresStore = useScoresStore()

    const playerPointsMap = computed(() => {
      const map = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          map.set(event.playerName.toLowerCase(), event.points)
        }
      }
      return map
    })

    const getPlayerPoints = (playerName) => {
      return playerPointsMap.value.get(String(playerName).toLowerCase()) || 0
    }

    const sortedEntries = computed(() => {
      return [...entriesStore.entries]
        .map(entry => {
          let calculatedScore = 0
          const players = entry.playerNames || entry.playerIds || []
          for (const playerName of players) {
            calculatedScore += getPlayerPoints(playerName)
          }
          return { ...entry, calculatedScore }
        })
        .sort((a, b) => {
          const nameA = (a.participantName || '').toLowerCase()
          const nameB = (b.participantName || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })
    })

    return { sortedEntries, getPlayerPoints }
  }
}
</script>

<style scoped>
.teams-view { padding: 0; }
.teams-view h2 { margin: 0 0 20px 0; color: var(--text-heading); font-size: 1.8rem; font-weight: 700; }
.empty-state { text-align: center; padding: 60px 40px; color: var(--text-secondary); border: 1px dashed var(--border-color); border-radius: 4px; }
.entries-grid { display: flex; flex-direction: column; gap: 16px; }
.entry-card { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 16px 20px; transition: box-shadow 0.2s; }
.entry-card:hover { box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); background: var(--bg-card-hover); }
.entry-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.participant-name { margin: 0; color: var(--text-heading); font-size: 1.1rem; font-weight: 700; }
.entry-score { font-weight: 700; color: var(--text-primary); font-size: 1rem; background: var(--bg-highlight); padding: 4px 12px; border-radius: 3px; }
.entry-id { color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 10px 0; }
.players-list { display: flex; flex-direction: column; gap: 0; }
.player-row { display: flex; align-items: center; gap: 10px; padding: 6px 8px; border-bottom: 1px solid var(--border-light); transition: background 0.15s; }
.player-row:last-child { border-bottom: none; }
.player-row:hover { background: var(--bg-row-hover); }
.player-number { font-weight: 600; color: var(--text-secondary); min-width: 24px; text-align: right; font-size: 0.8rem; }
.player-name { color: var(--text-primary); font-size: 0.9rem; flex: 1; }
.player-pts { font-weight: 700; color: var(--text-primary); font-size: 0.85rem; min-width: 30px; text-align: right; background: var(--bg-highlight); padding: 2px 8px; border-radius: 3px; }
.no-players { color: var(--text-secondary); font-style: italic; padding: 10px; text-align: center; }
</style>
