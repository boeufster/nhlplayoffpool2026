<template>
  <div class="teams-view">
    <h2>Teams</h2>
    <p v-if="lastUpdated" class="last-updated">Stats updated: {{ lastUpdated }}</p>

    <!-- Player Overlap Matrix (desktop) -->
    <section v-if="sortedEntries.length > 1" class="overlap-section hide-mobile">
      <h3>Player Overlap</h3>
      <div class="overlap-table-wrap">
        <table class="overlap-table">
          <thead>
            <tr>
              <th></th>
              <th v-for="entry in sortedEntries" :key="'oh-' + entry.id">{{ shortName(entry.participantName) }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(rowEntry, ri) in sortedEntries" :key="'or-' + rowEntry.id">
              <td class="overlap-row-label">{{ shortName(rowEntry.participantName) }}</td>
              <td
                v-for="(colEntry, ci) in sortedEntries"
                :key="'oc-' + colEntry.id"
                :class="{ 'overlap-diag': ri === ci, 'overlap-high': ri !== ci && overlapMatrix[ri][ci] >= 5 }"
              >{{ overlapMatrix[ri][ci] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Player Overlap List (mobile) -->
    <section v-if="sortedEntries.length > 1" class="overlap-mobile show-mobile-only">
      <h3>Player Overlap</h3>
      <div v-for="pair in overlapPairs" :key="pair.key" class="overlap-pair" :class="{ 'overlap-pair-high': pair.count >= 5 }">
        <span class="overlap-pair-names">{{ pair.nameA }} vs {{ pair.nameB }}</span>
        <span class="overlap-pair-count">{{ pair.count }}</span>
      </div>
    </section>

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
            <span v-if="isHotStreak(player)" class="hot-streak">🔥</span>
            <div class="player-bar-wrap">
              <div class="player-bar" :style="{ width: getPlayerPct(player, entry.calculatedScore) + '%' }"></div>
            </div>
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

    const getPlayerPct = (playerName, teamTotal) => {
      if (!teamTotal || teamTotal <= 0) return 0
      const pts = getPlayerPoints(playerName)
      return Math.round((pts / teamTotal) * 100)
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

    const topScorerNames = computed(() => {
      const events = scoresStore.scoringEvents.filter(e => e.playerName && e.points > 0)
      if (events.length === 0) return new Set()
      const sorted = [...events].sort((a, b) => b.points - a.points)
      const topScore = sorted[0].points
      return new Set(sorted.filter(e => e.points >= topScore - 1).map(e => e.playerName.toLowerCase()))
    })

    const isHotStreak = (playerName) => {
      return topScorerNames.value.has(String(playerName).toLowerCase())
    }

    const shortName = (name) => {
      if (!name) return ''
      const parts = name.trim().split(/\s+/)
      if (parts.length <= 1 || name.length <= 10) return name
      return parts[0] + ' ' + parts[parts.length - 1][0] + '.'
    }

    const overlapMatrix = computed(() => {
      const entries = sortedEntries.value
      const matrix = []
      for (let i = 0; i < entries.length; i++) {
        const row = []
        const playersI = new Set((entries[i].playerNames || []).map(p => String(p).toLowerCase()))
        for (let j = 0; j < entries.length; j++) {
          if (i === j) {
            row.push(playersI.size || 15)
          } else {
            const playersJ = (entries[j].playerNames || []).map(p => String(p).toLowerCase())
            let count = 0
            for (const p of playersJ) {
              if (playersI.has(p)) count++
            }
            row.push(count)
          }
        }
        matrix.push(row)
      }
      return matrix
    })

    const overlapPairs = computed(() => {
      const entries = sortedEntries.value
      const pairs = []
      for (let i = 0; i < entries.length; i++) {
        const playersI = new Set((entries[i].playerNames || []).map(p => String(p).toLowerCase()))
        for (let j = i + 1; j < entries.length; j++) {
          let count = 0
          for (const p of (entries[j].playerNames || [])) {
            if (playersI.has(String(p).toLowerCase())) count++
          }
          pairs.push({
            key: entries[i].id + '-' + entries[j].id,
            nameA: shortName(entries[i].participantName),
            nameB: shortName(entries[j].participantName),
            count
          })
        }
      }
      return pairs.sort((a, b) => b.count - a.count)
    })

    return { sortedEntries, getPlayerPoints, getPlayerPct, lastUpdated, isHotStreak, shortName, overlapMatrix, overlapPairs }
  }
}
</script>

<style scoped>
.teams-view { padding: 0; }
.teams-view h2 { margin: 0 0 4px 0; color: var(--text-heading); font-size: 1.8rem; font-weight: 700; }
.last-updated { color: var(--text-secondary); font-size: 0.8rem; margin: 0 0 16px 0; }
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
.player-name { color: var(--text-primary); font-size: 0.9rem; flex: 1; min-width: 0; }
.player-bar-wrap { width: 480px; height: 10px; background: var(--border-light); border-radius: 5px; overflow: hidden; flex-shrink: 0; }
.player-bar { height: 100%; background: var(--text-heading); border-radius: 5px; transition: width 0.3s ease; min-width: 0; }
.player-pts { font-weight: 700; color: var(--text-primary); font-size: 0.85rem; min-width: 30px; text-align: right; background: var(--bg-highlight); padding: 2px 8px; border-radius: 3px; flex-shrink: 0; }
.no-players { color: var(--text-secondary); font-style: italic; padding: 10px; text-align: center; }

@media (max-width: 768px) {
  .player-bar-wrap { display: none; }
  .entry-header { flex-wrap: wrap; gap: 4px; }
  .participant-name { font-size: 1rem; }
  .entry-id { font-size: 0.7rem; }
  .player-row { gap: 6px; padding: 4px 6px; }
  .player-name { font-size: 0.8rem; }
  .player-pts { font-size: 0.8rem; padding: 2px 6px; min-width: 24px; }
  .player-number { min-width: 20px; font-size: 0.75rem; }
  .entry-card { padding: 12px 14px; }
  .hide-mobile { display: none; }
}

.show-mobile-only { display: none; }
@media (max-width: 768px) {
  .show-mobile-only { display: block; }
}

/* Mobile Overlap List */
.overlap-mobile { margin-bottom: 20px; }
.overlap-mobile h3 { margin: 0 0 10px 0; color: var(--text-heading); font-size: 1.1rem; font-weight: 700; }
.overlap-pair { display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; border-bottom: 1px solid var(--border-light); }
.overlap-pair:last-child { border-bottom: none; }
.overlap-pair-names { color: var(--text-primary); font-size: 0.85rem; }
.overlap-pair-count { font-weight: 700; color: var(--text-secondary); font-size: 0.85rem; min-width: 24px; text-align: right; }
.overlap-pair-high .overlap-pair-count { color: var(--text-heading); }
.overlap-pair-high { background: var(--bg-highlight); }

/* Hot Streak Badge */
.hot-streak { display: inline-block; margin-left: 4px; animation: pulse-fire 1.5s ease-in-out infinite; }
@keyframes pulse-fire {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.15); }
}

/* Player Overlap Matrix */
.overlap-section { margin-bottom: 24px; margin-top: 0; }
.overlap-section h3 { margin: 0 0 12px 0; color: var(--text-heading); font-size: 1.2rem; font-weight: 700; }
.overlap-table-wrap { overflow-x: auto; }
.overlap-table { border-collapse: collapse; background: var(--bg-card); width: 100%; }
.overlap-table th { background: var(--bg-card); color: var(--text-secondary); padding: 8px 10px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; border-bottom: 2px solid var(--border-color); white-space: nowrap; }
.overlap-table td { padding: 8px 10px; border-bottom: 1px solid var(--border-light); color: var(--text-primary); text-align: center; font-size: 0.85rem; font-weight: 600; }
.overlap-row-label { text-align: left !important; color: var(--text-secondary); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.3px; white-space: nowrap; }
.overlap-diag { background: var(--bg-highlight); color: var(--text-secondary); }
.overlap-high { background: var(--bg-highlight); color: var(--text-heading); font-weight: 700; }
.overlap-table tbody tr:hover { background: var(--bg-row-hover); }
</style>
