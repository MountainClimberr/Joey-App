import { useState } from 'react'

const initials = (name = '') =>
  name
    .replace(/\(.*?\)/g, '') // "Dana (HR)" -> "Dana"
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || '?'

// Staff photo with a graceful fallback: if there's no photo yet (or the file fails
// to load) we show the person's initials, so a missing picture never breaks a card.
export default function Avatar({ name, photo, size = 40, className = '' }) {
  const [failed, setFailed] = useState(false)
  const showPhoto = photo && !failed

  return (
    <span
      className={`photo ${showPhoto ? '' : 'photo-fallback'} ${className}`}
      style={{ '--size': typeof size === 'number' ? `${size}px` : size }}
    >
      {showPhoto ? (
        <img src={photo} alt={name} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={name}>{initials(name)}</span>
      )}
    </span>
  )
}
