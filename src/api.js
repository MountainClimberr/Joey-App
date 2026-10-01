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
      name: role === 'hr' ? 'Dana (HR)' : 'Sandra',
      role,
    })
  }
  return http('/me')
}

// ---- HR roster ----
const MOCK_ROSTER = [
  { id: 'mock-e0', name: 'Carol', mood: 'uncomfortable' },
  { id: 'mock-e1', name: 'Sandra', mood: 'comfortable' },
  { id: 'mock-e2', name: 'Robert', mood: null },
  { id: 'mock-e3', name: 'Priya', mood: 'neutral' },
  { id: 'mock-e4', name: 'Marcus', mood: 'comfortable' },
  { id: 'mock-e5', name: 'Lena', mood: null },
]

export function getRoster() {
  if (USE_MOCK) return Promise.resolve(MOCK_ROSTER)
  return http('/roster')
}

export function getEmployeeWeek(employeeId) {
  if (USE_MOCK) {
    const today = (new Date().getDay() + 6) % 7 // Mon = 0
    const person = MOCK_ROSTER.find((p) => p.id === employeeId)
    const earlier = ['neutral', 'uncomfortable', 'uncomfortable', 'neutral', 'comfortable']
    const week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, i) => ({
      label,
      mood: i < today ? earlier[i] : i === today ? (person?.mood ?? null) : null,
    }))
    return Promise.resolve(week)
  }
  return http(`/roster/${encodeURIComponent(employeeId)}/week`)
}