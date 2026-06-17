<template>
  <section v-if="remainingTeams.length > 0" class="bracket-section">
    <h3 class="bracket-title">🏒 Final Four</h3>
    <div class="bracket" :class="{ 'bracket-2': remainingTeams.length === 2 }">
      <!-- Semifinal 1 -->
      <div v-if="matchups.length >= 1" class="matchup">
        <div class="team-slot" v-for="team in matchups[0]" :key="team.code">
          <span class="team-logo" :style="teamStyle(team.code)">{{ team.code }}</span>
          <span class="team-players">{{ team.playerCount }} player{{ team.playerCount !== 1 ? 's' : '' }} in pool</span>
        </div>
        <div class="vs-badge">VS</div>
      </div>

      <!-- Finals connector -->
      <div v-if="matchups.length === 2" class="finals-connector">
        <div class="connector-line"></div>
        <div class="finals-label">🏆</div>
        <div class="connector-line"></div>
      </div>

      <!-- Semifinal 2 -->
      <div v-if="matchups.length >= 2" class="matchup">
        <div class="team-slot" v-for="team in matchups[1]" :key="team.code">
          <span class="team-logo" :style="teamStyle(team.code)">{{ team.code }}</span>
          <span class="team-players">{{ team.playerCount }} player{{ team.playerCount !== 1 ? 's' : '' }} in pool</span>
        </div>
        <div class="vs-badge">VS</div>
      </div>
    </div>
  </section>
</template>

<script>
import { computed } from 'vue'
import { useEntriesStore } from '../stores/entries'
import { useEliminatedTeamsStore } from '../stores/eliminatedTeams'
import { teamColors } from '../utils/teamColors'

export default {
  name: 'FinalFourBracket',
  setup() {
    const entriesStore = useEntriesStore()
    const eliminatedTeamsStore = useEliminatedTeamsStore()

    // All known team codes from entries
    const allTeamCodes = computed(() => {
      const codes = new Set()
      for (const entry of entriesStore.entries) {
        if (entry.playerTeams) {
          for (const team of Object.values(entry.playerTeams)) {
            if (team) codes.add(team.toUpperCase())
          }
        }
      }
      return codes
    })

    // Teams still alive
    const remainingTeams = computed(() => {
      return [...allTeamCodes.value].filter(t => !eliminatedTeamsStore.isTeamEliminated(t))
    })

    // Count how many unique players across all entries are on each remaining team
    const teamPlayerCounts = computed(() => {
      const counts = {}
      for (const team of remainingTeams.value) {
        counts[team] = new Set()
      }
      for (const entry of entriesStore.entries) {
        if (!entry.playerTeams) continue
        for (const [playerName, team] of Object.entries(entry.playerTeams)) {
          if (team && counts[team.toUpperCase()]) {
            counts[team.toUpperCase()].add(playerName.toLowerCase())
          }
        }
      }
      const result = {}
      for (const [team, players] of Object.entries(counts)) {
        result[team] = players.size
      }
      return result
    })

    // Arrange into matchups (pairs)
    const matchups = computed(() => {
      const teams = remainingTeams.value.map(code => ({
        code,
        playerCount: teamPlayerCounts.value[code] || 0
      }))

      if (teams.length === 4) {
        return [[teams[0], teams[1]], [teams[2], teams[3]]]
      } else if (teams.length === 2) {
        return [[teams[0], teams[1]]]
      } else if (teams.length === 3) {
        return [[teams[0], teams[1]], [teams[2]]]
      }
      return [teams]
    })

    const teamStyle = (code) => {
      const colors = teamColors[code]
      if (!colors) return {}
      return { backgroundColor: colors.dark, color: colors.light }
    }

    return { remainingTeams, matchups, teamStyle }
  }
}
</script>

<style scoped>
.bracket-section {
  margin-top: 24px;
  padding: 20px;
  background: var(--bg-card);
  border: 2px solid var(--border-color);
  border-radius: 4px;
}

.bracket-title {
  margin: 0 0 16px 0;
  color: var(--text-heading);
  font-size: 1.4rem;
  font-weight: 700;
  text-align: center;
}

.bracket {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.matchup {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-highlight);
  border-radius: 6px;
  position: relative;
  min-width: 140px;
}

.team-slot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
}

.team-logo {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 3px;
  letter-spacing: 0.5px;
}

.team-players {
  font-size: 0.75rem;
  color: var(--text-secondary);
  white-space: nowrap;
}

.vs-badge {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.65rem;
  font-weight: 700;
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 2px 6px;
  border-radius: 3px;
  letter-spacing: 1px;
}

.finals-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.connector-line {
  width: 2px;
  height: 20px;
  background: var(--border-color);
}

.finals-label {
  font-size: 1.4rem;
}

@media (max-width: 768px) {
  .bracket {
    flex-direction: column;
    gap: 8px;
  }
  .finals-connector {
    flex-direction: row;
    gap: 8px;
  }
  .connector-line {
    width: 20px;
    height: 2px;
  }
  .matchup {
    min-width: 120px;
    padding: 10px 12px;
  }
}
</style>
