export function serverIndexTemplate(): string {
  return `import { Elysia } from 'elysia'
import { cors } from '@elysia/cors'
import { staticPlugin } from '@elysia/static'
import { config } from './config'
import { dbPlugin } from './plugins/db'
import { loggerPlugin } from './plugins/logger'

const app = new Elysia()
  .use(cors())
  .use(dbPlugin)
  .use(loggerPlugin)

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

export function drizzleConfigTemplate(): string {
  return `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DB_PATH ?? 'server/data/todos.db',
  },
})
`
}

export function envTemplate(): string {
  return `PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
`
}

export function loggerPluginTemplate(): string {
  return `import logixlysia from 'logixlysia'
import { config } from '../config'

export const loggerPlugin = logixlysia({
  config: {
    preset: config.isProduction ? 'prod' : 'dev',
    ip: true,
    showStartupMessage: true,
    timestamp: {
      translateTime: 'yyyy-mm-dd HH:MM:ss.SSS',
    },
  },
})
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
`
}
