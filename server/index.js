import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import process from 'node:process'

const app = express()
const port = Number(process.env.PORT) || 3001
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const validMoods = new Set(['comfortable', 'neutral', 'uncomfortable'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

app.use(express.json())

function isValidEmployeeId(employeeId) {
  return typeof employeeId === 'string' && uuidPattern.test(employeeId)
}

function formatCheckIn(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    mood: row.mood,
    day: row.checked_in_on,
    createdAt: row.created_at,
  }
}

app.post('/api/checkins', async (request, response) => {
  const { employeeId, mood } = request.body ?? {}
  if (!isValidEmployeeId(employeeId) || !validMoods.has(mood)) {
    response.status(400).json({ error: 'A valid employeeId and mood are required' })
    return
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO check_ins (employee_id, mood)
       VALUES ($1, $2)
       ON CONFLICT (employee_id, checked_in_on)
       DO UPDATE SET mood = EXCLUDED.mood
       RETURNING id, employee_id, mood, checked_in_on, created_at`,
      [employeeId, mood],
    )
    response.status(201).json(formatCheckIn(rows[0]))
  } catch (error) {
    if (error.code === '23503') {
      response.status(404).json({ error: 'Employee not found' })
      return
    }
    response.status(500).json({ error: 'Could not save check-in' })
  }
})

app.get('/api/checkins/today', async (request, response) => {
  const { employeeId } = request.query
  if (!isValidEmployeeId(employeeId)) {
    response.status(400).json({ error: 'A valid employeeId is required' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, employee_id, mood, checked_in_on, created_at
       FROM check_ins
       WHERE employee_id = $1 AND checked_in_on = CURRENT_DATE`,
      [employeeId],
    )
    response.json({ checkIn: rows[0] ? formatCheckIn(rows[0]) : null })
  } catch {
    response.status(500).json({ error: 'Could not retrieve check-in' })
  }
})

app.get('/api/checkins', async (request, response) => {
  const { employeeId } = request.query
  if (!isValidEmployeeId(employeeId)) {
    response.status(400).json({ error: 'A valid employeeId is required' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, employee_id, mood, checked_in_on, created_at
       FROM check_ins
       WHERE employee_id = $1
       ORDER BY checked_in_on DESC, created_at DESC`,
      [employeeId],
    )
    response.json({ checkIns: rows.map(formatCheckIn) })
  } catch {
    response.status(500).json({ error: 'Could not retrieve check-in history' })
  }
})

app.get('/api/health', async (_request, response) => {
  try {
    await pool.query('SELECT 1')
    response.json({ status: 'ok', database: 'connected' })
  } catch {
    response.status(503).json({ status: 'unavailable', database: 'disconnected' })
  }
})

async function startServer() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL must be set')
    process.exitCode = 1
    return
  }

  try {
    await pool.query('SELECT 1')
    app.listen(port, () => {
      console.log(`API server listening on port ${port}`)
    })
  } catch (error) {
    console.error(`Database connection failed (${error.code ?? 'unknown error'})`)
    await pool.end()
    process.exitCode = 1
  }
}

startServer()