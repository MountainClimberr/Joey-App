import { MOOD_COLORS } from '../moods.js'

const INK = '#0f3a42'

// mood: 'comfortable' | 'neutral' | 'uncomfortable' | 'none' (not checked in: gray, dashed)
export function Face({ mood, size = 96 }) {
  const pending = !MOOD_COLORS[mood]
  const line = INK
  const s = { fill: 'none', stroke: line, strokeWidth: 4, strokeLinecap: 'round', strokeLinejoin: 'round' }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={pending ? 'not checked in' : mood}>
      {pending ? (
        <circle cx="50" cy="50" r="45" fill="#eef2f3" stroke="#b3bfc2" strokeWidth="4" strokeDasharray="7 8" strokeLinecap="round" />
      ) : (
        <circle cx="50" cy="50" r="46" fill={MOOD_COLORS[mood]} />
      )}

      {mood === 'uncomfortable' && (
        <>
          <path d="M26 33 L42 38 M74 33 L58 38" {...s} />
          <circle cx="35" cy="48" r="4.5" fill={line} />
          <circle cx="65" cy="48" r="4.5" fill={line} />
          <path d="M33 73 Q50 58 67 73" {...s} />
        </>
      )}
      {mood === 'neutral' && (
        <>
          <circle cx="36" cy="42" r="4.5" fill={line} />
          <circle cx="64" cy="42" r="4.5" fill={line} />
          <path d="M36 66 H64" {...s} />
        </>
      )}
      {mood === 'comfortable' && (
        <>
          <path d="M28 46 Q35 35 42 46 M58 46 Q65 35 72 46" {...s} />
          <path d="M30 60 Q50 84 70 60" {...s} />
        </>
      )}
    </svg>
  )
}