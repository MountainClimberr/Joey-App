import 'dotenv/config'
import express from 'express'
import pg from 'pg'
import process from 'node:process'

const app = express()
const port = Number(process.env.PORT) || 3001
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })

app.use(express.json())

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