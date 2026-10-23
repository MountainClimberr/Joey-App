import { useEffect, useState } from 'react'
import { getRoster, getEmployeeWeek } from '../api.js'
import { MOODS, MOOD_COLORS } from '../moods.js'
import { Face } from './Faces.jsx'
import { AWAY_LABELS, prettyDay } from '../away.js'

const GRAY = '#c3ccce'
const colorFor = (mood) => (mood ? MOOD_COLORS[mood] : GRAY)

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
      <p className="note">This week. Gray means no check-in; a pause mark means they were away.</p>
      {error && <p className="note warn">Couldn't load this week.</p>}
      {!week && !error && <p className="note">Loading…</p>}
      {week && (
        <div className="week">
          {week.map((d) => (
            <div
              key={d.label}
              className={`week-day ${d.away ? 'away' : d.mood ? '' : 'pending'}`}
              style={{ '--mood': colorFor(d.mood) }}
            >
              <Face mood={d.away ? 'away' : (d.mood ?? 'none')} size={72} />
              <span>{d.label}</span>
              <small>{d.away ? (AWAY_LABELS[d.awayKind] ?? 'away').toLowerCase() : (d.mood ?? 'no check-in')}</small>
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

  const away = people.filter((p) => p.away)
  const expected = people.length - away.length // people who are away aren't expected to check in
  const done = people.filter((p) => p.mood).length
  const pct = Math.round((done / (expected || 1)) * 100)

  return (
    <section className="card">
      <h1>Your team today</h1>
      <p className="note">Click anyone to see their week. Gray means not checked in yet; a pause mark means they're away.</p>

      <div className="stats">
        <div className="stat-main">
          <strong>{done}<small> / {expected}</small></strong>
          <span>checked in today</span>
          <div className="meter"><i style={{ width: `${pct}%` }} /></div>
        </div>
        {[...MOODS].reverse().map((mood) => (
          <div className="stat" key={mood} style={{ '--mood': MOOD_COLORS[mood] }}>
            <Face mood={mood} size={36} />
            <strong>{people.filter((p) => p.mood === mood).length}</strong>
            <span>{mood}</span>
          </div>
        ))}
        <div className="stat away-stat">
          <Face mood="away" size={36} />
          <strong>{away.length}</strong>
          <span>away</span>
        </div>
      </div>

      <div className="roster">
        {people.map((p) => (
          <button
            key={p.id}
            className={`person ${p.away ? 'away' : p.mood ? '' : 'pending'}`}
            style={{ '--mood': colorFor(p.mood) }}
            onClick={() => setPicked(p)}
          >
            <Face mood={p.away ? 'away' : (p.mood ?? 'none')} size={84} />
            <strong>{p.name}</strong>
            <span className="pill">{p.away ? AWAY_LABELS[p.away.kind] : (p.mood ?? 'not yet')}</span>
            {p.away && (
              <small className="away-until">{p.away.endsOn ? `back ${prettyDay(p.away.endsOn)}` : 'return date not set'}</small>
            )}
          </button>
        ))}
      </div>
    </section>
  )
}