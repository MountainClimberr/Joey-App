export const MOODS = ['uncomfortable', 'neutral', 'comfortable']

// Moods have no color of their own. The faces (frown / flat / smile) carry the meaning,
// so every mood uses the same soft neutral for faces, cards, borders and hover glows.
const NEUTRAL = '#b8cdd1'

export const MOOD_COLORS = {
  comfortable: NEUTRAL,
  neutral: NEUTRAL,
  uncomfortable: NEUTRAL,
}

// Insights charts only: light-to-dark neutral shades so stacked segments can be told apart.
export const MOOD_SHADES = {
  comfortable: '#dbe7ea',
  neutral: '#b8cdd1',
  uncomfortable: '#8fabb1',
}