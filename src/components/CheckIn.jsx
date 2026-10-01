import { useEffect, useState } from 'react'
import { getTodayCheckIn, submitCheckIn } from '../api.js'
import { useAuth } from '../auth/context.js'
import { Face } from './Faces.jsx'
import FollowUp from './Followup.jsx'

const MOODS = ['uncomfortable', 'neutral', 'comfortable']

export default function CheckIn() {
  const { user } = useAuth()
  const employeeId = user.id // comes from /api/me (Teams SSO later)
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
      <h1>How do you feel today, {user.name}?</h1>
      <div className="faces">
        {MOODS.map((mood) => (
          <button
            key={mood}
            className={`face-btn ${selected === mood ? 'is-selected' : ''}`}
            onClick={() => choose(mood)}
            disabled={status === 'loading' || status === 'saving'}
            aria-pressed={selected === mood}
          >
            <Face mood={mood} />
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