import { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { config } from '../config'

const sqlite = new Database(config.dbPath)
sqlite.exec('PRAGMA journal_mode = WAL')

export const dbPlugin = new Elysia({ name: 'db' })
  .decorate('db', drizzle(sqlite))
  .as('global')
