import { describe, it, expect } from 'vitest'
import { parsePlayerNameAndTeam } from '../parsePlayerNameAndTeam.js'

describe('parsePlayerNameAndTeam', () => {
  it('extracts team code from a name ending with 3-letter uppercase token', () => {
    const result = parsePlayerNameAndTeam('Connor McDavid EDM')
    expect(result).toEqual({ playerName: 'Connor McDavid', team: 'EDM' })
  })

  it('extracts team code from a name ending with 2-letter uppercase token', () => {
    const result = parsePlayerNameAndTeam('Player Name AB')
    expect(result).toEqual({ playerName: 'Player Name', team: 'AB' })
  })

  it('extracts team code from a name ending with 4-letter uppercase token', () => {
    const result = parsePlayerNameAndTeam('Auston Matthews ABCD')
    expect(result).toEqual({ playerName: 'Auston Matthews', team: 'ABCD' })
  })

  it('returns null team when no valid team suffix exists', () => {
    const result = parsePlayerNameAndTeam('Sidney Crosby')
    expect(result).toEqual({ playerName: 'Sidney Crosby', team: null })
  })

  it('returns null team for a single token input', () => {
    const result = parsePlayerNameAndTeam('Ovechkin')
    expect(result).toEqual({ playerName: 'Ovechkin', team: null })
  })

  it('returns null team when last token has lowercase letters', () => {
    const result = parsePlayerNameAndTeam('Player Name Edm')
    expect(result).toEqual({ playerName: 'Player Name Edm', team: null })
  })

  it('returns null team when last token is longer than 4 uppercase letters', () => {
    const result = parsePlayerNameAndTeam('Player Name ABCDE')
    expect(result).toEqual({ playerName: 'Player Name ABCDE', team: null })
  })

  it('returns null team when last token is a single uppercase letter', () => {
    const result = parsePlayerNameAndTeam('Player Name A')
    expect(result).toEqual({ playerName: 'Player Name A', team: null })
  })

  it('trims leading and trailing whitespace before processing', () => {
    const result = parsePlayerNameAndTeam('  Connor McDavid EDM  ')
    expect(result).toEqual({ playerName: 'Connor McDavid', team: 'EDM' })
  })

  it('handles multiple internal spaces by collapsing them', () => {
    const result = parsePlayerNameAndTeam('Connor   McDavid   EDM')
    expect(result).toEqual({ playerName: 'Connor McDavid', team: 'EDM' })
  })

  it('produces a non-empty playerName for any non-empty input', () => {
    const result = parsePlayerNameAndTeam('X')
    expect(result.playerName).toBe('X')
    expect(result.playerName.length).toBeGreaterThan(0)
  })
})
