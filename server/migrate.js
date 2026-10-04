import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const migrationsDirectory = fileURLToPath(new URL('./migrations/', import.meta.url))

async function migrate() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL must be set')
  }

  const client = await pool.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `)

    const files = (await readdir(migrationsDirectory))
      .filter((filename) => filename.endsWith('.sql'))
      .sort()
    const { rows } = await client.query('SELECT filename FROM schema_migrations')
    const applied = new Set(rows.map((row) => row.filename))

    for (const filename of files) {
      if (applied.has(filename)) continue

      const sql = await readFile(new URL(`./migrations/${filename}`, import.meta.url), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename])
        await client.query('COMMIT')
        console.log(`Applied migration ${filename}`)
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      }
    }
  } finally {
    client.release()
  }
}

try {
  await migrate()
} catch (error) {
  console.error(`Migration failed: ${error.code ?? error.message}`)
  process.exitCode = 1
} finally {
  await pool.end()
}