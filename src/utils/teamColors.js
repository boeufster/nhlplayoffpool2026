/**
 * NHL team colors — light color for text, dark color for background.
 * Format: { light: '#hex', dark: '#hex' }
 */
export const teamColors = {
  // Eastern Conference — Atlantic Division
  BOS: { light: '#FFB81C', dark: '#000000' },
  BUF: { light: '#FCB514', dark: '#002654' },
  DET: { light: '#FFFFFF', dark: '#CE1126' },
  FLA: { light: '#B9975B', dark: '#C8102E' },
  MTL: { light: '#192168', dark: '#AF1E2D' },
  OTT: { light: '#FFFFFF', dark: '#000000' },
  TBL: { light: '#FFFFFF', dark: '#002868' },
  TOR: { light: '#FFFFFF', dark: '#00205B' },

  // Eastern Conference — Metropolitan Division
  CAR: { light: '#FFFFFF', dark: '#CE1126' },
  CBJ: { light: '#CE1126', dark: '#002654' },
  NJD: { light: '#FFFFFF', dark: '#CE1126' },
  NYI: { light: '#F47A38', dark: '#00539B' },
  NYR: { light: '#CE1126', dark: '#0038A8' },
  PHI: { light: '#FFFFFF', dark: '#F74902' },
  PIT: { light: '#FCB514', dark: '#000000' },
  WSH: { light: '#FFFFFF', dark: '#041E42' },

  // Western Conference — Central Division
  CHI: { light: '#FFFFFF', dark: '#CF0A2C' },
  COL: { light: '#004785', dark: '#6F263D' },
  DAL: { light: '#FFFFFF', dark: '#006A4E' },
  MIN: { light: '#FFB81C', dark: '#154734' },
  NSH: { light: '#FFFFFF', dark: '#FFB81C' },
  STL: { light: '#FFB81C', dark: '#002F87' },
  UTA: { light: '#FFFFFF', dark: '#010101' },
  WPG: { light: '#FFFFFF', dark: '#041E42' },

  // Western Conference — Pacific Division
  ANA: { light: '#F47A38', dark: '#000000' },
  CGY: { light: '#F1BE48', dark: '#C8102E' },
  EDM: { light: '#FF4C00', dark: '#041E42' },
  LAK: { light: '#FFFFFF', dark: '#111111' },
  SJS: { light: '#EA7200', dark: '#006D75' },
  SEA: { light: '#99D9D9', dark: '#051C2C' },
  VAN: { light: '#00843D', dark: '#00205B' },
  VGK: { light: '#B4975A', dark: '#333F42' }
}

/**
 * Get inline style object for a team badge.
 * @param {string|null} teamCode
 * @param {boolean} eliminated
 * @returns {object} CSS style object
 */
export function getTeamBadgeStyle(teamCode, eliminated) {
  if (!teamCode) return {}
  if (eliminated) {
    return { background: '#888', color: '#ccc' }
  }
  const colors = teamColors[teamCode.toUpperCase()]
  if (!colors) return {}
  return { backgroundColor: colors.dark, color: colors.light }
}
