import { useCallback, useEffect, useRef, useState } from 'react'
import { acknowledgeAlert, getAlerts } from '../api.js'
import Avatar from './Avatar.jsx'

const MESSAGES = {
  uncomfortable_streak: (a) => `Has felt uncomfortable ${a.details?.countAtDetection ?? 3} days in a row`,
  message_escalation: () => 'Joey flagged a chat message for a person to follow up',
}
const describe = (alert) => (MESSAGES[alert.type] ?? (() => 'May need a check-in'))(alert)

function when(iso) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000)
  if (minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

// HR only: a bell in the top bar listing people who may need a check-in.
// onViewPerson(person) opens that person's week on the Team page.
export default function NeedsAttention({ onViewPerson }) {
  const [alerts, setAlerts] = useState(null) // null = loading or unavailable
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(false)
  const box = useRef(null)

  const load = useCallback(() => getAlerts().then(setAlerts).catch(() => setAlerts(null)), [])
  useEffect(() => { load() }, [load])

  // Close when clicking elsewhere or pressing Escape.
  useEffect(() => {
    if (!open) return
    const onClick = (e) => { if (!box.current?.contains(e.target)) setOpen(false) }
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!alerts) return null // the server doesn't offer alerts yet: no bell rather than a broken one

  async function handled(alert) {
    setBusy(alert.id)
    setError(false)
    try {
      await acknowledgeAlert(alert.id)
      setAlerts((list) => list.filter((a) => a.id !== alert.id))
    } catch {
      setError(true)
    } finally {
      setBusy(null)
    }
  }

  const count = alerts.length
  return (
    <div className="attention" ref={box}>
      <button
        className="bell"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={count ? `Needs attention: ${count}` : 'Needs attention: nothing right now'}
      >
        <BellIcon />
        {count > 0 && <span className="bell-count">{count}</span>}
      </button>

      {open && (
        <div className="attention-panel" role="dialog" aria-label="Needs attention">
          <h2>Needs attention</h2>
          {count === 0 ? (
            <p className="note">Nothing needs your attention right now.</p>
          ) : (
            <ul>
              {alerts.map((a) => (
                <li key={a.id}>
                  <Avatar name={a.name} photo={a.photo} size={48} />
                  <div className="attention-text">
                    <strong>{a.name}</strong>
                    <span>{describe(a)}</span>
                    <small>{when(a.createdAt)}</small>
                    <div className="attention-actions">
                      <button onClick={() => { setOpen(false); onViewPerson({ id: a.employeeId, name: a.name, photo: a.photo }) }}>
                        View week
                      </button>
                      <button onClick={() => handled(a)} disabled={busy === a.id}>
                        Mark as handled
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && <p className="note warn">Couldn't update that. Try again in a moment.</p>}
          <p className="attention-foot">Only HR sees this list. Nothing is sent to the person; reach out to them yourself.</p>
        </div>
      )}
    </div>
  )
}
