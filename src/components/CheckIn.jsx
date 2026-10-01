import { useEffect, useState } from 'react'
import { getTodayCheckIn, submitCheckIn } from '../api.js'
import { Face } from './Faces.jsx'
import FollowUp from './Followup.jsx'

const MOODS = ['uncomfortable', 'neutral', 'comfortable']

// No login yet: each browser gets a random id. Swap for Teams SSO later.
function getEmployeeId() {
  let id = localStorage.getItem('joey-employee-id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('joey-employee-id', id)
  }
  return id
}

export default function CheckIn() {
  const [employeeId] = useState(getEmployeeId)
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
      <h1>How do you feel today?</h1>
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