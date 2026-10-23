export const AWAY_LABELS = { vacation: 'Vacation', sick: 'Out sick' }

export const prettyDay = (day) =>
  new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
