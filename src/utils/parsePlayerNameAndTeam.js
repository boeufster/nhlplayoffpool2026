/**
 * Parses a raw player string to extract the player name and optional team code.
 *
 * If the last space-separated token is 2-4 uppercase letters, it is treated as
 * the team code. Otherwise the full trimmed string is the player name with no team.
 *
 * @param {string} raw - e.g. "Connor McDavid EDM"
 * @returns {{ playerName: string, team: string | null }}
 */
export function parsePlayerNameAndTeam(raw) {
  const trimmed = raw.trim()
  const parts = trimmed.split(/\s+/)
  if (parts.length >= 2) {
    const lastToken = parts[parts.length - 1]
    if (/^[A-Z]{2,4}$/.test(lastToken)) {
      return { playerName: parts.slice(0, -1).join(' '), team: lastToken }
    }
  }
  return { playerName: trimmed, team: null }
}
