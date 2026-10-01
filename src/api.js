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