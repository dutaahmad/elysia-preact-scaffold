export function serverIndexTemplate(): string {
  return `import { Elysia } from 'elysia'
import { cors } from '@elysia/cors'
import { staticPlugin } from '@elysia/static'
import { config } from './config'
import { dbPlugin } from './plugins/db'

const app = new Elysia()
  .use(cors())
  .use(dbPlugin)

if (config.isProduction) {
  app.use(
    await staticPlugin({
      prefix: '/',
      assets: 'dist',
      indexHTML: true,
    }),
  )
}

app.listen(config.port, ({ hostname, port }) => {
  console.log(\`Server running at http://\${hostname}:\${port}\`)
})
`
}

export function serverConfigTemplate(): string {
  return `export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || 'server/data/todos.db',
  isProduction: process.env.NODE_ENV === 'production',
}
`
}

export function dbPluginTemplate(): string {
  return `import { Elysia } from 'elysia'
import { Database } from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { config } from '../config'

const sqlite = new Database(config.dbPath)
sqlite.exec('PRAGMA journal_mode = WAL')

export const dbPlugin = new Elysia({ name: 'db' })
  .decorate('db', drizzle(sqlite))
  .as('global')

declare module 'elysia' {
  interface ElysiaContext {
    db: BunSQLiteDatabase
  }
}
`
}
