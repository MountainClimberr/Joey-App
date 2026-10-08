import { useEffect, useState } from 'react'
import { getInsights } from '../api.js'
import { Face } from './Faces.jsx'
import { MOOD_COLORS } from '../moods.js'

const ROWS = ['comfortable', 'neutral', 'uncomfortable'].map((mood) => ({ mood, color: MOOD_COLORS[mood] }))

export default function Insights() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    getInsights(28).then(setData).catch(() => setError(true))
  }, [])

  if (error) return <section className="card"><p className="note warn">Couldn't load insights.</p></section>
  if (!data) return <section className="card"><p className="note">Loading…</p></section>

  if (data.suppressed) {
    return (
      <section className="card">
        <h1>Team Insights</h1>
        <p className="note">
          Not enough check-ins yet ({data.participants} of {data.minGroup} people). Results appear once enough
          people have contributed, so no one can be singled out.
        </p>
      </section>
    )
  }

  const total = Object.values(data.totals).reduce((a, b) => a + b, 0) || 1
  const maxDay = Math.max(...data.perDay.map((d) => d.comfortable + d.neutral + d.uncomfortable), 1)

  return (
    <section className="card">
      <h1>Team Insights</h1>
      <p className="note">
        The aggregate picture over the last {data.days} days, from {data.participants} people. Patterns and
        trends, not individual monitoring.
      </p>

      <div className="bars">
        {ROWS.map(({ mood, color }) => {
          const pct = Math.round((data.totals[mood] / total) * 100)
          return (
            <div className="bar-row" key={mood}>
              <Face mood={mood} size={44} />
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
              </div>
              <span className="pct">{pct}%</span>
            </div>
          )
        })}
      </div>

      <h2>Day by day</h2>
      <div className="daily" role="img" aria-label="Daily check-ins by mood">
        {data.perDay.map((d) => (
          <div className="day" key={d.day} title={d.day}>
            {ROWS.map(({ mood, color }) => (
              <div key={mood} style={{ height: `${(d[mood] / maxDay) * 100}%`, background: color }} />
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}