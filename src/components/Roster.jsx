import { useEffect, useState } from 'react'
import { getRoster, getEmployeeWeek } from '../api.js'
import { Face } from './Faces.jsx'

const GRAY = '#c3c9ca'

function PersonFace({ mood, size }) {
  return mood ? <Face mood={mood} size={size} /> : <Face mood="none" size={size} color={GRAY} />
}

function EmployeeWeek({ person, onBack }) {
  const [week, setWeek] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getEmployeeWeek(person.id).then(setWeek).catch(() => setError(true))
  }, [person.id])

  return (
    <section className="card">
      <button className="back" onClick={onBack}>← Back to team</button>
      <h1>{person.name}&rsquo;s progress</h1>
      {error && <p className="note warn">Couldn't load this week.</p>}
      {!week && !error && <p className="note">Loading…</p>}
      {week && (
        <div className="week">
          {week.map((d) => (
            <div className="week-day" key={d.label}>
              <PersonFace mood={d.mood} size={56} />
              <span className="note">{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default function Roster() {
  const [people, setPeople] = useState(null)
  const [error, setError] = useState(false)
  const [picked, setPicked] = useState(null)

  useEffect(() => {
    getRoster().then(setPeople).catch(() => setError(true))
  }, [])

  if (picked) return <EmployeeWeek person={picked} onBack={() => setPicked(null)} />
  if (error) return <section className="card"><p className="note warn">Couldn't load your team.</p></section>
  if (!people) return <section className="card"><p className="note">Loading…</p></section>

  const done = people.filter((p) => p.mood).length

  return (
    <section className="card">
      <h1>Your team today</h1>
      <p className="note">{done} of {people.length} checked in. Gray means not yet.</p>
      <div className="roster">
        {people.map((p) => (
          <button key={p.id} className={`person ${p.mood ? '' : 'pending'}`} onClick={() => setPicked(p)}>
            <PersonFace mood={p.mood} size={64} />
            <strong>{p.name}</strong>
            <small>{p.mood ?? 'not yet'}</small>
          </button>
        ))}
      </div>
    </section>
  )
}