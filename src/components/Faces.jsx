export function Face({ mood, size = 96, color = '#000' }) {
  const stroke = { fill: 'none', stroke: color, strokeWidth: 3, strokeLinecap: 'round' }

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={mood === 'none' ? 'not checked in' : mood}>
      <circle cx="50" cy="50" r="44" {...stroke} />
      {mood === 'uncomfortable' && (
        <>
          <path d="M28 36 L42 41 M72 36 L58 41" {...stroke} />
          <circle cx="36" cy="46" r="3" fill={color} />
          <circle cx="64" cy="46" r="3" fill={color} />
          <path d="M34 72 Q50 58 66 72" {...stroke} />
        </>
      )}
      {mood === 'neutral' && (
        <>
          <circle cx="36" cy="42" r="3" fill={color} />
          <circle cx="64" cy="42" r="3" fill={color} />
          <path d="M36 68 H64" {...stroke} />
        </>
      )}
      {mood === 'comfortable' && (
        <>
          <path d="M28 44 Q35 34 42 44 M58 44 Q65 34 72 44" {...stroke} />
          <path d="M34 60 H66 Q62 78 50 78 Q38 78 34 60 Z" {...stroke} />
        </>
      )}
    </svg>
  )
}