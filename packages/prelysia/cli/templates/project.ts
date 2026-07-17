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

export function envExampleTemplate(): string {
  return `# Server
PORT=3000

# Database (SQLite file path, relative to project root)
DB_PATH=server/data/app.db

# Environment
NODE_ENV=development
`
}

export function envLocalTemplate(): string {
  return `PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
`
}

export function gitignoreTemplate(): string {
  return `node_modules
dist
.env
*.db
*.db-wal
*.db-shm
drizzle/
*.local
.DS_Store
`
}

export function indexHtmlTemplate(projectName: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
    <script>
      (function () {
        var theme = localStorage.getItem('stisla-theme')
        if (!theme) theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        document.documentElement.dataset.theme = theme
      })()
    </script>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
}

export function viteConfigTemplate(): string {
  return `import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [tailwindcss(), preact()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
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
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { config } from '../config'

mkdirSync(dirname(config.dbPath), { recursive: true })
const sqlite = new Database(config.dbPath)
sqlite.exec('PRAGMA journal_mode = WAL')

export const dbPlugin = new Elysia({ name: 'db' })
  .decorate('db', drizzle(sqlite))
  .as('global')
`
}
