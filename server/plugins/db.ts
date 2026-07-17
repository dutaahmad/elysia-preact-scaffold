import { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { config } from '../config'

mkdirSync(dirname(config.dbPath), { recursive: true })
const sqlite = new Database(config.dbPath)
sqlite.exec('PRAGMA journal_mode = WAL')

export const dbPlugin = new Elysia({ name: 'db' })
  .decorate('db', drizzle(sqlite))
  .as('global')
