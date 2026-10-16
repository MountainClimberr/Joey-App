export const UNCOMFORTABLE_STREAK_THRESHOLD = 3

export function calculateUncomfortableStreak(checkIns) {
  let count = 0
  while (count < checkIns.length && checkIns[count].mood === 'uncomfortable') {
    count += 1
  }

  return {
    count,
    threshold: UNCOMFORTABLE_STREAK_THRESHOLD,
    flagged: count >= UNCOMFORTABLE_STREAK_THRESHOLD,
    thresholdCheckIn: count >= UNCOMFORTABLE_STREAK_THRESHOLD
      ? checkIns[count - UNCOMFORTABLE_STREAK_THRESHOLD]
      : null,
  }
}