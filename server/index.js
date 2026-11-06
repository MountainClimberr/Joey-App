import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import process from 'node:process'
import { generateAgentResponse } from './agent/agent.js'
import { filterEscalation } from './agent/filter.js'
import { calculateUncomfortableStreak } from './streak.js'

const app = express()
const port = Number(process.env.PORT) || 3001
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const validMoods = new Set(['comfortable', 'neutral', 'uncomfortable'])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const maxAgentMessageLength = 4000
const escalationReply = 'Thank you for telling me. This is important, and you deserve support from a person. If you are in immediate danger, contact local emergency services now. I have recorded an alert for your support team.'

app.use(express.json())

const validAwayKinds = new Set(['vacation', 'sick'])

function isValidDay(value) {
  return typeof value === 'string'
    && /^\d{4}-\d{2}-\d{2}$/.test(value)
    && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value
}

// An away period counts today if it has started, hasn't passed its end date, and
// the person hasn't tapped "I'm back". HR's roster/week queries should reuse this.
const ACTIVE_AWAY_SQL = `starts_on <= CURRENT_DATE
  AND (ends_on IS NULL OR ends_on >= CURRENT_DATE)
  AND ended_at IS NULL`

function formatAway(row) {
  return { id: row.id, kind: row.kind, startsOn: row.starts_on, endsOn: row.ends_on }
}


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

async function getUncomfortableStreak(queryable, employeeId) {
  const { rows } = await queryable.query(
    `SELECT id, mood, checked_in_on
     FROM check_ins
     WHERE employee_id = $1
     ORDER BY checked_in_on DESC, created_at DESC`,
    [employeeId],
  )
  return calculateUncomfortableStreak(rows)
}

function formatStreak(streak) {
  return {
    count: streak.count,
    threshold: streak.threshold,
    flagged: streak.flagged,
  }
}

app.post('/api/checkins', async (request, response) => {
  const { employeeId, mood } = request.body ?? {}
  if (!isValidEmployeeId(employeeId) || !validMoods.has(mood)) {
    response.status(400).json({ error: 'A valid employeeId and mood are required' })
    return
  }

  let client
  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const { rows: employees } = await client.query(
      'SELECT id FROM employees WHERE id = $1 FOR UPDATE',
      [employeeId],
    )
    if (!employees.length) {
      await client.query('ROLLBACK')
      response.status(404).json({ error: 'Employee not found' })
      return
    }

    const { rows } = await client.query(
      `INSERT INTO check_ins (employee_id, mood)
       VALUES ($1, $2)
       ON CONFLICT (employee_id, checked_in_on)
       DO UPDATE SET mood = EXCLUDED.mood
       RETURNING id, employee_id, mood, checked_in_on, created_at`,
      [employeeId, mood],
    )

    const streak = await getUncomfortableStreak(client, employeeId)
    if (streak.flagged) {
      const details = {
        threshold: streak.threshold,
        countAtDetection: streak.count,
        thresholdCheckInId: streak.thresholdCheckIn.id,
        thresholdReachedOn: streak.thresholdCheckIn.checked_in_on,
      }
      await client.query(
        `INSERT INTO alerts (employee_id, alert_type, severity, details)
         SELECT $1, 'uncomfortable_streak', 'high', $2::jsonb
         WHERE NOT EXISTS (
           SELECT 1 FROM alerts
           WHERE employee_id = $1
             AND alert_type = 'uncomfortable_streak'
             AND details->>'thresholdCheckInId' = $3
         )`,
        [employeeId, JSON.stringify(details), streak.thresholdCheckIn.id],
      )
    }

    await client.query('COMMIT')
    response.status(201).json({ ...formatCheckIn(rows[0]), streak: formatStreak(streak) })
  } catch (error) {
    if (client) await client.query('ROLLBACK').catch(() => {})
    if (error.code === '23503') {
      response.status(404).json({ error: 'Employee not found' })
      return
    }
    response.status(500).json({ error: 'Could not save check-in' })
  } finally {
    client?.release()
  }
})

app.get('/api/checkins/streak', async (request, response) => {
  const { employeeId } = request.query
  if (!isValidEmployeeId(employeeId)) {
    response.status(400).json({ error: 'A valid employeeId is required' })
    return
  }

  try {
    const streak = await getUncomfortableStreak(pool, employeeId)
    response.json({ streak: formatStreak(streak) })
  } catch {
    response.status(500).json({ error: 'Could not retrieve check-in streak' })
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

app.post('/api/agent/messages', async (request, response) => {
  const { employeeId, message, conversationId } = request.body ?? {}
  const text = typeof message === 'string' ? message.trim() : ''
  if (!isValidEmployeeId(employeeId)
    || !text
    || text.length > maxAgentMessageLength
    || (conversationId != null && !isValidEmployeeId(conversationId))) {
    response.status(400).json({ error: 'A valid employeeId, message, and optional conversationId are required' })
    return
  }

  // Classify safety signals before this message can be sent to the model.
  const escalation = filterEscalation(text)
  let client
  let activeConversationId
  let firstName
  let recentMoods
  let history

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    const { rows: employees } = await client.query(
      'SELECT id, display_name FROM employees WHERE id = $1',
      [employeeId],
    )
    if (!employees.length) {
      await client.query('ROLLBACK')
      response.status(404).json({ error: 'Employee not found' })
      return
    }
    firstName = employees[0].display_name?.trim().split(/\s+/)[0] || 'there'

    // Continue only this employee's active bot chat; new chats require today's uncomfortable check-in.
    if (conversationId) {
      const { rows: conversations } = await client.query(
        `SELECT id FROM conversations
         WHERE id = $1 AND employee_id = $2 AND channel = 'bot' AND status = 'active'
         FOR UPDATE`,
        [conversationId, employeeId],
      )
      if (!conversations.length) {
        await client.query('ROLLBACK')
        response.status(404).json({ error: 'Active conversation not found' })
        return
      }
      activeConversationId = conversations[0].id
    } else {
      const { rows: checkIns } = await client.query(
        `SELECT id FROM check_ins
         WHERE employee_id = $1 AND checked_in_on = CURRENT_DATE AND mood = 'uncomfortable'`,
        [employeeId],
      )
      if (!checkIns.length) {
        await client.query('ROLLBACK')
        response.status(409).json({ error: 'An uncomfortable check-in is required to start a conversation' })
        return
      }
      const { rows: conversations } = await client.query(
        `INSERT INTO conversations (employee_id, check_in_id, channel, status)
         VALUES ($1, $2, 'bot', 'active')
         RETURNING id`,
        [employeeId, checkIns[0].id],
      )
      activeConversationId = conversations[0].id
    }

    await client.query(
      `INSERT INTO messages (conversation_id, sender_type, body)
       VALUES ($1, 'employee', $2)`,
      [activeConversationId, text],
    )

    // Escalations are recorded and answered locally; they never reach the LLM.
    if (escalation.flagged) {
      await client.query(
        `INSERT INTO alerts (employee_id, conversation_id, alert_type, severity, details)
         VALUES ($1, $2, 'message_escalation', $3, $4::jsonb)`,
        [employeeId, activeConversationId, escalation.severity, JSON.stringify({
          category: escalation.category,
          reason: escalation.reason,
        })],
      )
      await client.query(
        `INSERT INTO messages (conversation_id, sender_type, body)
         VALUES ($1, 'assistant', $2)`,
        [activeConversationId, escalationReply],
      )
      await client.query(
        'UPDATE conversations SET updated_at = now() WHERE id = $1',
        [activeConversationId],
      )
      await client.query('COMMIT')
      response.json({
        conversationId: activeConversationId,
        response: escalationReply,
        escalation: { flagged: true, category: escalation.category, severity: escalation.severity },
      })
      return
    }

    // Send only recent mood context and a bounded conversation history to the agent.
    const [{ rows: moodRows }, { rows: messageRows }] = await Promise.all([
      client.query(
        `SELECT mood FROM (
           SELECT mood, checked_in_on FROM check_ins
           WHERE employee_id = $1
           ORDER BY checked_in_on DESC LIMIT 5
         ) recent ORDER BY checked_in_on ASC`,
        [employeeId],
      ),
      client.query(
        `SELECT sender_type, body FROM (
           SELECT sender_type, body, created_at, id FROM messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC, id DESC LIMIT 20
         ) recent ORDER BY created_at ASC, id ASC`,
        [activeConversationId],
      ),
    ])
    recentMoods = moodRows.map((row) => row.mood)
    history = messageRows.map((row) => ({
      role: row.sender_type === 'assistant' ? 'assistant' : 'user',
      content: row.body,
    }))
    await client.query('COMMIT')
  } catch {
    if (client) await client.query('ROLLBACK').catch(() => {})
    response.status(500).json({ error: 'Could not save your message' })
    return
  } finally {
    client?.release()
  }

  // Call the model after releasing the database client, then persist its reply.
  let agentReply
  try {
    agentReply = await generateAgentResponse({ firstName, recentMoods, messages: history })
    if (typeof agentReply !== 'string' || !agentReply.trim()) throw new Error('Empty agent response')
    agentReply = agentReply.trim()
  } catch {
    response.status(502).json({ error: 'Joey could not respond right now', conversationId: activeConversationId })
    return
  }

  try {
    await pool.query(
      `INSERT INTO messages (conversation_id, sender_type, body)
       VALUES ($1, 'assistant', $2)`,
      [activeConversationId, agentReply],
    )
    await pool.query(
      'UPDATE conversations SET updated_at = now() WHERE id = $1',
      [activeConversationId],
    )
  } catch {
    response.status(500).json({ error: 'Could not save Joey’s response', conversationId: activeConversationId })
    return
  }

  response.json({
    conversationId: activeConversationId,
    response: agentReply,
    escalation: { flagged: false },
  })
})

app.post('/api/away', async (request, response) => {
  const { employeeId, kind, startsOn, endsOn } = request.body ?? {}
  if (!isValidEmployeeId(employeeId) || !validAwayKinds.has(kind)) {
    response.status(400).json({ error: 'A valid employeeId and kind (vacation or sick) are required' })
    return
  }
  if ((startsOn != null && !isValidDay(startsOn)) || (endsOn != null && !isValidDay(endsOn))) {
    response.status(400).json({ error: 'Dates must look like YYYY-MM-DD' })
    return
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO away_periods (employee_id, kind, starts_on, ends_on)
       VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4::date)
       RETURNING id, kind, starts_on::text, ends_on::text`,
      [employeeId, kind, startsOn ?? null, endsOn ?? null],
    )
    response.status(201).json({ away: formatAway(rows[0]) })
  } catch (error) {
    if (error.code === '23503') {
      response.status(404).json({ error: 'Employee not found' })
      return
    }
    if (error.code === '23514') {
      response.status(400).json({ error: 'The end date can\'t be before the start date' })
      return
    }
    response.status(500).json({ error: 'Could not save away status' })
  }
})

app.post('/api/away/end', async (request, response) => {
  const { employeeId } = request.body ?? {}
  if (!isValidEmployeeId(employeeId)) {
    response.status(400).json({ error: 'A valid employeeId is required' })
    return
  }

  try {
    const { rowCount } = await pool.query(
      `UPDATE away_periods SET ended_at = now()
       WHERE employee_id = $1 AND ${ACTIVE_AWAY_SQL}`,
      [employeeId],
    )
    response.json({ ended: rowCount })
  } catch {
    response.status(500).json({ error: 'Could not end away status' })
  }
})

app.get('/api/away/current', async (request, response) => {
  const { employeeId } = request.query
  if (!isValidEmployeeId(employeeId)) {
    response.status(400).json({ error: 'A valid employeeId is required' })
    return
  }

  try {
    const { rows } = await pool.query(
      `SELECT id, kind, starts_on::text, ends_on::text
       FROM away_periods
       WHERE employee_id = $1 AND ${ACTIVE_AWAY_SQL}
       ORDER BY created_at DESC
       LIMIT 1`,
      [employeeId],
    )
    response.json({ away: rows[0] ? formatAway(rows[0]) : null })
  } catch {
    response.status(500).json({ error: 'Could not retrieve away status' })
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