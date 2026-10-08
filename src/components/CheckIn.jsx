import { useEffect, useState } from 'react'
import { getTodayCheckIn, submitCheckIn } from '../api.js'
import { useAuth } from '../auth/context.js'
import { MOODS, MOOD_COLORS } from '../moods.js'
import { Face } from './Faces.jsx'
import FollowUp from './Followup.jsx'

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
}

export default function CheckIn() {
  const { user } = useAuth()
  const employeeId = user.id // comes from /api/me (Teams SSO later)
  const [hello] = useState(greeting)
  const [selected, setSelected] = useState(null)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [status, setStatus] = useState('loading') // loading | ready | saving | error

  useEffect(() => {
    getTodayCheckIn(employeeId)
      .then(({ checkIn }) => {
        setSelected(checkIn?.mood ?? null) // already checked in today: don't re-prompt
        setStatus('ready')
      })
      .catch(() => setStatus('error'))
  }, [employeeId])

  async function choose(mood) {
    setStatus('saving')
    try {
      await submitCheckIn(employeeId, mood)
      setSelected(mood)
      setShowFollowUp(true)
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }

  return (
    <section className="card checkin">
      <p className="kicker">{hello}, {user.name.split(' ')[0]}</p>
      <h1>How are you feeling today?</h1>
      <p className="sub">One tap is all it takes.</p>

      <div className={`faces ${selected ? 'has-selection' : ''}`}>
        {MOODS.map((mood) => (
          <button
            key={mood}
            className={`mood-card ${selected === mood ? 'is-selected' : ''}`}
            style={{ '--mood': MOOD_COLORS[mood] }}
            onClick={() => choose(mood)}
            disabled={status === 'loading' || status === 'saving'}
            aria-pressed={selected === mood}
          >
            <div className="mood-face"><Face mood={mood} size="100%" /></div>
            <span>{mood}</span>
          </button>
        ))}
      </div>

      {status === 'error' && <p className="note warn">Couldn't reach the server. Try again in a moment.</p>}
      {selected && !showFollowUp && status !== 'error' && (
        <p className="note">You selected {selected}. Now on with your day.</p>
      )}
      {showFollowUp && <FollowUp key={selected} employeeId={employeeId} mood={selected} />}
    </section>
  )
}