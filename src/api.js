const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'
const isoDay = (offset = 0) => new Date(Date.now() - offset * 86_400_000).toISOString().slice(0, 10)

async function http(path, options = {}) {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API ${res.status}`)
  return res.json()
}

// ---- mock data ----
const mockRead = () => JSON.parse(localStorage.getItem('joey-mock') || '{}')
const mockWrite = (data) => localStorage.setItem('joey-mock', JSON.stringify(data))

function mockInsights(days) {
  const perDay = []
  const totals = { comfortable: 0, neutral: 0, uncomfortable: 0 }
  for (let i = days - 1; i >= 0; i--) {
    const row = { day: isoDay(i), comfortable: 5 + ((i * 7) % 4), neutral: 3 + ((i * 5) % 3), uncomfortable: (i * 3) % 3 }
    for (const k of Object.keys(totals)) totals[k] += row[k]
    perDay.push(row)
  }
  return { suppressed: false, days, participants: 12, totals, perDay }
}

// ---- exported calls ----
export function getTodayCheckIn(employeeId) {
  if (USE_MOCK) return Promise.resolve({ checkIn: mockRead()[isoDay()] ?? null })
  return http(`/checkins/today?employeeId=${encodeURIComponent(employeeId)}`)
}

export function submitCheckIn(employeeId, mood) {
  if (USE_MOCK) {
    const store = mockRead()
    store[isoDay()] = { day: isoDay(), mood }
    mockWrite(store)
    return Promise.resolve(store[isoDay()])
  }
  return http('/checkins', { method: 'POST', body: JSON.stringify({ employeeId, mood }) })
}

export function getInsights(days = 28) {
  if (USE_MOCK) return Promise.resolve(mockInsights(days))
  return http(`/insights?days=${days}`)
}

export function submitFollowUp(employeeId, kind, data = {}) {
  if (USE_MOCK) return Promise.resolve({ ok: true })
  return http('/followups', { method: 'POST', body: JSON.stringify({ employeeId, kind, ...data }) })
}

export function getMe() {
  if (USE_MOCK) {
    const role = localStorage.getItem('joey-mock-role') || 'employee'
    return Promise.resolve({
      id: role === 'hr' ? 'mock-hr' : 'mock-employee',
      name: role === 'hr' ? BOSS.name : STAFF[0].name,
      photo: role === 'hr' ? BOSS.photo : STAFF[0].photo,
      role,
    })
  }
  return http('/me')
}

// ---- away mode (vacation / sick) ----
const localDay = (offset = 0) => {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const awayIsActive = (a) =>
  a && !a.endedAt && a.startsOn <= localDay() && (!a.endsOn || a.endsOn >= localDay())

export function getAway(employeeId) {
  if (USE_MOCK) {
    const a = JSON.parse(localStorage.getItem('joey-mock-away') || 'null')
    return Promise.resolve({ away: awayIsActive(a) ? a : null })
  }
  return http(`/away/current?employeeId=${encodeURIComponent(employeeId)}`)
}

// kind: 'vacation' | 'sick'. startsOn defaults to today; endsOn is optional (open-ended).
export function setAway(employeeId, kind, { startsOn, endsOn } = {}) {
  if (USE_MOCK) {
    const a = { id: 'mock-away', kind, startsOn: startsOn || localDay(), endsOn: endsOn || null }
    localStorage.setItem('joey-mock-away', JSON.stringify(a))
    return Promise.resolve({ away: a })
  }
  return http('/away', { method: 'POST', body: JSON.stringify({ employeeId, kind, startsOn, endsOn }) })
}

export function endAway(employeeId) {
  if (USE_MOCK) {
    localStorage.removeItem('joey-mock-away')
    return Promise.resolve({ ended: 1 })
  }
  return http('/away/end', { method: 'POST', body: JSON.stringify({ employeeId }) })
}

// ---- HR roster ----
// The team. Photos live in public/team/ (600x600 web-sized crops); anyone without
// a photo shows their initials instead.
const STAFF = [
  { name: 'Alex', photo: '/team/alex.jpg' },
  { name: 'Angie', photo: '/team/angie.jpg' },
  { name: 'Colton', photo: '/team/colton.jpg' },
  { name: 'Dawnetta', photo: '/team/dawnetta.jpg' },
  { name: 'Derek', photo: '/team/derek.jpg' },
  { name: 'Dona', photo: '/team/dona.jpg' },
  { name: 'Eldon', photo: '/team/eldon.jpg' },
  { name: 'Gordon', photo: '/team/gordon.jpg' },
  { name: 'Halley', photo: '/team/halley.jpg' },
  { name: 'Henry', photo: '/team/henry.jpg' },
  { name: 'Hurlow', photo: '/team/hurlow.jpg' },
  { name: 'Jen', photo: '/team/jen.jpg' },
  { name: 'John', photo: '/team/john.jpg' },
  { name: 'Laura', photo: '/team/laura.jpg' },
  { name: 'Mike', photo: '/team/mike.jpg' },
  { name: 'Stacey', photo: '/team/stacey.jpg' },
]

// Claire is the boss: she uses the HR view (Team + Team Insights), so she isn't on the roster.
const BOSS = { name: 'Claire', photo: '/team/claire.jpg' }

// Demo-only statuses so the roster shows a realistic mix of moods, away and not-yet.
const DEMO_MOODS = ['comfortable', 'neutral', 'comfortable', 'uncomfortable', null, 'comfortable']
const DEMO_AWAY = {
  6: { kind: 'vacation', endsOn: localDay(4) },
  13: { kind: 'sick', endsOn: null },
}

const MOCK_ROSTER = STAFF.map((person, i) => ({
  id: `mock-e${i}`,
  ...person,
  mood: DEMO_AWAY[i] ? null : DEMO_MOODS[i % DEMO_MOODS.length],
  ...(DEMO_AWAY[i] && { away: DEMO_AWAY[i] }),
}))

export function getRoster() {
  if (USE_MOCK) return Promise.resolve(MOCK_ROSTER)
  return http('/roster')
}

export function getEmployeeWeek(employeeId) {
  if (USE_MOCK) {
    const today = (new Date().getDay() + 6) % 7 // Mon = 0
    const person = MOCK_ROSTER.find((p) => p.id === employeeId)
    const earlier = ['neutral', 'uncomfortable', 'uncomfortable', 'neutral', 'comfortable']
    const onStreak = MOCK_ALERTS.some((a) => a.employeeId === employeeId && a.type === 'uncomfortable_streak')
    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, i) => {
      const away = Boolean(person?.away) && i >= today - 1
      const past = onStreak ? (i >= today - 2 ? 'uncomfortable' : 'neutral') : earlier[i] // match their alert
      return {
        label,
        away,
        awayKind: away ? person.away.kind : null,
        mood: away ? null : i < today ? past : i === today ? (person?.mood ?? null) : null,
      }
    })
    return Promise.resolve(week)
  }
  return http(`/roster/${encodeURIComponent(employeeId)}/week`)
}
// ---- needs attention (HR) ----
// Alerts are created by the server: 'uncomfortable_streak' after 3 uncomfortable
// check-ins in a row, 'message_escalation' when Joey's chat spots a message a person
// should follow up on. HR sees the open ones and marks them as handled.
//
// Server routes this expects (not built yet):
//   GET  /api/alerts                 -> open alerts, newest first:
//        [{ id, employeeId, name, photo, type, severity, createdAt, details }]
//   POST /api/alerts/:id/acknowledge -> marks one as handled (status = 'acknowledged')
const personFor = (index) => ({ employeeId: MOCK_ROSTER[index].id, name: MOCK_ROSTER[index].name, photo: MOCK_ROSTER[index].photo })
const hoursAgo = (h) => new Date(Date.now() - h * 3_600_000).toISOString()

const MOCK_ALERTS = [
  { id: 'mock-a1', ...personFor(9), type: 'uncomfortable_streak', severity: 'high', createdAt: hoursAgo(2), details: { countAtDetection: 3 } },
  { id: 'mock-a2', ...personFor(3), type: 'uncomfortable_streak', severity: 'high', createdAt: hoursAgo(5), details: { countAtDetection: 3 } },
]
const mockHandled = new Set() // demo only: resets when the page reloads

export function getAlerts() {
  if (USE_MOCK) return Promise.resolve(MOCK_ALERTS.filter((a) => !mockHandled.has(a.id)))
  return http('/alerts')
}

export function acknowledgeAlert(alertId) {
  if (USE_MOCK) {
    mockHandled.add(alertId)
    return Promise.resolve({ ok: true })
  }
  return http(`/alerts/${encodeURIComponent(alertId)}/acknowledge`, { method: 'POST' })
}
