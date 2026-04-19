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

    const sortedEntries = computed(() => {
      // Build player → points map from scoring events (case-insensitive)
      const playerPointsMap = new Map()
      for (const event of scoresStore.scoringEvents) {
        if (event.playerName) {
          playerPointsMap.set(event.playerName.toLowerCase(), event.points)
        }
      }

      return [...entriesStore.entries]
        .map(entry => {
          let calculatedScore = 0
          const players = entry.playerNames || entry.playerIds || []
          for (const playerName of players) {
            calculatedScore += playerPointsMap.get(String(playerName).toLowerCase()) || 0
          }
          return { ...entry, calculatedScore }
        })
        .sort((a, b) => {
          const nameA = (a.participantName || '').toLowerCase()
          const nameB = (b.participantName || '').toLowerCase()
          return nameA.localeCompare(nameB)
        })
    })

    return { sortedEntries }
  }
}
</script>

<style scoped>
.teams-view {
  padding: 20px;
}

.teams-view h2 {
  margin-top: 0;
  color: #00d4ff;
  font-size: 2rem;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
  margin-bottom: 30px;
}

.empty-state {
  text-align: center;
  padding: 60px 40px;
  color: #888;
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 2px dashed #2a2f4a;
  border-radius: 8px;
  font-size: 1.1rem;
}

.entries-grid {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.entry-card {
  background: linear-gradient(135deg, #1a1f3a 0%, #252a45 100%);
  border: 2px solid #2a2f4a;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.entry-card:hover {
  border-color: #00d4ff;
  box-shadow: 0 8px 32px rgba(0, 212, 255, 0.15);
}

.entry-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.participant-name {
  margin: 0;
  color: #00d4ff;
  font-size: 1.3rem;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
}

.entry-score {
  font-weight: 700;
  color: #c41e3a;
  font-size: 1.1rem;
  background: rgba(196, 30, 58, 0.15);
  padding: 4px 12px;
  border-radius: 4px;
  border: 1px solid rgba(196, 30, 58, 0.3);
}

.entry-id {
  color: #888;
  font-size: 0.85rem;
  margin: 0 0 12px 0;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.player-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  background: rgba(0, 212, 255, 0.05);
  border-left: 3px solid #2a2f4a;
  border-radius: 0 4px 4px 0;
  transition: all 0.2s ease;
}

.player-row:hover {
  background: rgba(0, 212, 255, 0.1);
  border-left-color: #00d4ff;
}

.player-number {
  font-weight: 700;
  color: #00d4ff;
  min-width: 28px;
  text-align: right;
  font-size: 0.85rem;
}

.player-name {
  color: #e0e0e0;
  font-size: 0.95rem;
}

.no-players {
  color: #888;
  font-style: italic;
  padding: 10px;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}
</style>
