import { useState } from 'react'
import { setAway, endAway } from '../api.js'
import { AWAY_LABELS, prettyDay } from '../away.js'

const KINDS = [
  { key: 'vacation', label: 'On vacation' },
  { key: 'sick', label: 'Out sick' },
]

const localToday = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Shown on the check-in screen when someone taps "Out sick or on vacation?"
export function AwayForm({ employeeId, onSaved, onCancel }) {
  const [kind, setKind] = useState('vacation')
  const [startsOn, setStartsOn] = useState(localToday)
  const [endsOn, setEndsOn] = useState('')
  const [status, setStatus] = useState('idle') // idle | saving | error

  const badRange = endsOn && endsOn < startsOn

  async function save() {
    setStatus('saving')
    try {
      const { away } = await setAway(employeeId, kind, { startsOn, endsOn: endsOn || undefined })
      onSaved(away)
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="away-form">
      <h2>Taking some time away?</h2>
      <p className="note">No check-ins needed while you're away. Your team will see that you're out.</p>

      <div className="away-kinds">
        {KINDS.map((k) => (
          <button
            key={k.key}
            className={kind === k.key ? 'is-selected' : ''}
            aria-pressed={kind === k.key}
            onClick={() => setKind(k.key)}
          >
            {k.label}
          </button>
        ))}
      </div>

      <div className="away-dates">
        <label>
          From
          <input type="date" value={startsOn} onChange={(e) => setStartsOn(e.target.value)} />
        </label>
        <label>
          Until (optional)
          <input type="date" value={endsOn} min={startsOn} onChange={(e) => setEndsOn(e.target.value)} />
        </label>
      </div>
      <p className="note away-hint">Not sure when you'll be back? Leave "until" empty and tap "I'm back" when you return.</p>

      {badRange && <p className="note warn">The end date can't be before the start date.</p>}
      {status === 'error' && <p className="note warn">Couldn't save that. Try again in a moment.</p>}

      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button className="primary" onClick={save} disabled={!startsOn || badRange || status === 'saving'}>
          Set me as away
        </button>
      </div>
    </div>
  )
}

// Replaces the mood picker while someone is away.
export function AwayNotice({ employeeId, away, onBack }) {
  const [status, setStatus] = useState('idle') // idle | saving | error

  async function back() {
    setStatus('saving')
    try {
      await endAway(employeeId)
      onBack()
    } catch {
      setStatus('error')
    }
  }

  const sick = away.kind === 'sick'
  return (
    <section className="card checkin away-notice">
      <p className="kicker">{AWAY_LABELS[away.kind]}</p>
      <h1>{sick ? 'Take care of yourself.' : 'Enjoy your time off.'}</h1>
      <p className="sub">
        No check-in needed. You're set as away
        {away.endsOn ? ` until ${prettyDay(away.endsOn)}` : ' until you tell me you\'re back'}.
      </p>
      {status === 'error' && <p className="note warn">Couldn't update that. Try again in a moment.</p>}
      <div className="actions">
        <button className="primary" onClick={back} disabled={status === 'saving'}>
          I'm back, let's check in
        </button>
      </div>
    </section>
  )
}
