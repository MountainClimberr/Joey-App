import { useEffect, useMemo, useState } from 'react'
import { getMyHistory } from '../api.js'
import { useAuth } from '../auth/context.js'
import { MOODS } from '../moods.js'
import { Face } from './Faces.jsx'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const parse = (day) => new Date(`${day}T00:00:00`)
const fmt = (day, opts) => parse(day).toLocaleDateString(undefined, opts)
const monthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6

// Weekdays in a row with a check-in, ending today (or the last weekday if today isn't done yet).
function currentStreak(byDay) {
  const d = new Date()
  if (!byDay[ymd(d)]) d.setDate(d.getDate() - 1)
  let streak = 0
  for (let guard = 0; guard < 400; guard++) {
    if (isWeekend(d)) { d.setDate(d.getDate() - 1); continue }
    if (!byDay[ymd(d)]) break
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

function countMoods(entries) {
  return Object.fromEntries(MOODS.map((m) => [m, entries.filter((e) => e.mood === m).length]))
}

// Monday-first grid of the month: null for padding before the 1st.
function monthGrid(first) {
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const pad = (first.getDay() + 6) % 7
  return [...Array(pad).fill(null), ...Array.from({ length: days }, (_, i) => new Date(first.getFullYear(), first.getMonth(), i + 1))]
}

function DayDetail({ entry, day }) {
  const title = fmt(day, { weekday: 'long', month: 'long', day: 'numeric' })
  if (!entry) {
    return (
      <div className="day-detail">
        <h3>{title}</h3>
        <p className="note">No check-in that day.</p>
      </div>
    )
  }
  return (
    <div className="day-detail">
      <Face mood={entry.mood} size={56} />
      <div>
        <h3>{title}</h3>
        <p className="day-mood">You felt {entry.mood}</p>
        {entry.tags?.length > 0 && (
          <div className="tag-list">{entry.tags.map((t) => <span key={t}>{t}</span>)}</div>
        )}
        {entry.note && <blockquote>{entry.note}</blockquote>}
        {!entry.tags?.length && !entry.note && <p className="note">No tags or note that day.</p>}
      </div>
    </div>
  )
}

export default function MyCheckins() {
  const { user } = useAuth()
  const [history, setHistory] = useState(null)
  const [error, setError] = useState(false)
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [picked, setPicked] = useState(null) // 'YYYY-MM-DD'

  useEffect(() => {
    getMyHistory(user.id).then(setHistory).catch(() => setError(true))
  }, [user.id])

  const byDay = useMemo(() => Object.fromEntries((history ?? []).map((e) => [e.day, e])), [history])

  if (error) return <section className="card"><p className="note warn">Couldn't load your check-ins.</p></section>
  if (!history) return <section className="card"><p className="note">Loading…</p></section>

  const today = ymd(new Date())
  const first = history[0]
  const firstMonth = first ? new Date(parse(first.day).getFullYear(), parse(first.day).getMonth(), 1) : month
  const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const shift = (n) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setPicked(null) }

  const overall = countMoods(history)
  const mostOften = history.length ? MOODS.reduce((a, b) => (overall[b] > overall[a] ? b : a)) : null
  const streak = currentStreak(byDay)

  const inMonth = history.filter((e) => e.day.startsWith(monthKey(month)))
  const monthMoods = countMoods(inMonth)
  const monthName = month.toLocaleDateString(undefined, { month: 'long' })

  // Which tags came up this month, and how they felt on those days.
  const tagStats = {}
  for (const e of inMonth) {
    for (const t of e.tags ?? []) {
      tagStats[t] ??= { tag: t, days: 0, ...Object.fromEntries(MOODS.map((m) => [m, 0])) }
      tagStats[t].days += 1
      tagStats[t][e.mood] += 1
    }
  }
  const topTags = Object.values(tagStats).sort((a, b) => b.days - a.days || a.tag.localeCompare(b.tag))
  const maxTagDays = Math.max(1, ...topTags.map((t) => t.days))

  return (
    <section className="card my-checkins">
      <h1>My check-ins</h1>
      <p className="note">A look back at how you've been. Your tags and private notes are just for you.</p>

      {history.length === 0 ? (
        <p className="empty-history">No check-ins yet. Once you check in, your days will show up here.</p>
      ) : (
        <>
          <div className="history-stats">
            <div>
              <strong>{history.length}</strong>
              <span>check-ins since {fmt(first.day, { month: 'short', day: 'numeric' })}</span>
            </div>
            <div>
              <strong>{streak} {streak === 1 ? 'day' : 'days'}</strong>
              <span>current streak (weekdays)</span>
            </div>
            <div className="most-often">
              <Face mood={mostOften} size={40} />
              <span>Most often you felt <b>{mostOften}</b></span>
            </div>
          </div>

          <div className="month-head">
            <button onClick={() => shift(-1)} disabled={month <= firstMonth} aria-label="Previous month">‹</button>
            <h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
            <button onClick={() => shift(1)} disabled={month >= thisMonth} aria-label="Next month">›</button>
          </div>

          <div className="calendar" role="group" aria-label={`Check-ins in ${monthName}`}>
            {WEEKDAYS.map((w) => <div key={w} className="cal-weekday" aria-hidden="true">{w}</div>)}
            {monthGrid(month).map((d, i) => {
              if (!d) return <div key={`pad-${i}`} />
              const day = ymd(d)
              const entry = byDay[day]
              const future = day > today
              return (
                <button
                  key={day}
                  className={`cal-day${entry ? ' has-entry' : ''}${isWeekend(d) ? ' weekend' : ''}${day === today ? ' today' : ''}${picked === day ? ' picked' : ''}`}
                  disabled={future}
                  onClick={() => setPicked(picked === day ? null : day)}
                  aria-label={`${fmt(day, { weekday: 'long', month: 'long', day: 'numeric' })}: ${entry ? entry.mood : 'no check-in'}`}
                >
                  <span className="cal-num">{d.getDate()}</span>
                  {entry && <span className="cal-face"><Face mood={entry.mood} size="100%" /></span>}
                </button>
              )
            })}
          </div>

          {picked && <DayDetail day={picked} entry={byDay[picked]} />}

          <p className="month-line">
            {inMonth.length
              ? <>In {monthName} you checked in <b>{inMonth.length} {inMonth.length === 1 ? 'time' : 'times'}</b>: {MOODS.slice().reverse().filter((m) => monthMoods[m]).map((m) => `${monthMoods[m]} ${m}`).join(', ')}.</>
              : <>No check-ins in {monthName}.</>}
          </p>

          <h2>What came up in {monthName}</h2>
          {topTags.length === 0 ? (
            <p className="note">No tags this month. When you check in, you can add what's affecting you.</p>
          ) : (
            <ul className="tag-stats">
              {topTags.map((t) => (
                <li key={t.tag}>
                  <span className="tag-name">{t.tag}</span>
                  <span className="tag-bar" aria-hidden="true"><i style={{ width: `${(t.days / maxTagDays) * 100}%` }} /></span>
                  <span className="tag-days">{t.days} {t.days === 1 ? 'day' : 'days'}</span>
                  <span className="tag-moods" aria-label={MOODS.filter((m) => t[m]).map((m) => `${t[m]} ${m}`).join(', ')}>
                    {MOODS.slice().reverse().filter((m) => t[m]).map((m) => (
                      <span key={m}><Face mood={m} size={20} />{t[m]}</span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
