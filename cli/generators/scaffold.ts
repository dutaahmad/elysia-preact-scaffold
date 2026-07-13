import { join } from 'path'
import { writeFileTree, writeJson, writeText, readJson, pathExists, readText } from '../utils/fs'
import { serverIndexTemplate, serverConfigTemplate, dbPluginTemplate } from '../templates/project'
import { schemaTemplate, typesTemplate, modelTemplate, serviceTemplate, routesTemplate, indexTemplate } from '../templates/module'

export async function scaffoldProject(targetDir: string, projectName: string): Promise<void> {
  const files: Record<string, string> = {}

  files['server/index.ts'] = serverIndexTemplate()
  files['server/config.ts'] = serverConfigTemplate()

  files['server/db/schema.ts'] = `export { todos } from '../modules/todos/schema'\n`
  files['server/db/model.ts'] = `import { todos } from '../modules/todos/schema'
import { spreads } from './utils'

export const db = {
  insert: spreads({ todos }, 'insert'),
  select: spreads({ todos }, 'select'),
} as const
`
  files['server/db/utils.ts'] = `import { Kind, type TObject } from '@sinclair/typebox'
import {
  createInsertSchema,
  createSelectSchema,
  BuildSchema,
} from 'drizzle-typebox'
import type { Table } from 'drizzle-orm'

type Spread<
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | undefined,
> =
  T extends TObject<infer Fields>
    ? { [K in keyof Fields]: Fields[K] }
    : T extends Table
      ? Mode extends 'select'
        ? BuildSchema<'select', T['_']['columns'], undefined>['properties']
        : Mode extends 'insert'
          ? BuildSchema<'insert', T['_']['columns'], undefined>['properties']
          : {}
      : {}

export const spread = <
  T extends TObject | Table,
  Mode extends 'select' | 'insert' | undefined,
>(
  schema: T,
  mode?: Mode,
): Spread<T, Mode> => {
  const newSchema: Record<string, unknown> = {}
  let table

  switch (mode) {
    case 'insert':
    case 'select':
      if (Kind in schema) {
        table = schema
        break
      }
      table =
        mode === 'insert'
          ? createInsertSchema(schema)
          : createSelectSchema(schema)
      break
    default:
      if (!(Kind in schema)) throw new Error('Expect a schema')
      table = schema
  }

  for (const key of Object.keys(table.properties))
    newSchema[key] = table.properties[key]

  return newSchema as any
}

export const spreads = <
  T extends Record<string, TObject | Table>,
  Mode extends 'select' | 'insert' | undefined,
>(
  models: T,
  mode?: Mode,
): { [K in keyof T]: Spread<T[K], Mode> } => {
  const newSchema: Record<string, unknown> = {}
  const keys = Object.keys(models)
  for (const key of keys) newSchema[key] = spread(models[key], mode)
  return newSchema as any
}
`

  files['server/plugins/db.ts'] = dbPluginTemplate()

  const todoFields = [
    { name: 'title', type: 'string' as const, required: true },
    { name: 'completed', type: 'boolean' as const, required: false, default: false },
  ]
  files['server/modules/todos/schema.ts'] = schemaTemplate('todos', todoFields)
  files['server/modules/todos/types.ts'] = typesTemplate('todos')
  files['server/modules/todos/model.ts'] = modelTemplate('todos', todoFields)
  files['server/modules/todos/service.ts'] = serviceTemplate('todos')
  files['server/modules/todos/routes.ts'] = routesTemplate('todos')
  files['server/modules/todos/index.ts'] = indexTemplate('todos')

  files['drizzle.config.ts'] = `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DB_PATH ?? 'server/data/todos.db',
  },
})
`

  files['.env'] = `PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
`

  await writeFileTree(targetDir, files)

  const viteConfigPath = join(targetDir, 'vite.config.ts')
  if (pathExists(viteConfigPath)) {
    let viteContent = await readText(viteConfigPath)
    if (!viteContent.includes('proxy')) {
      viteContent = viteContent.replace(
        /(plugins:\s*\[.*?\],)/,
        `$1
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },`,
      )
      await writeText(viteConfigPath, viteContent)
    }
    console.log('  \u2713 Updated vite.config.ts')
  }

  const pkgPath = join(targetDir, 'package.json')
  let pkg: Record<string, unknown>

  if (pathExists(pkgPath)) {
    pkg = await readJson(pkgPath)
  } else {
    pkg = {
      name: projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }
  }

  pkg.scripts = {
    dev: `concurrently -n "vite,elysia" -c "cyan,green" "vite" "bun run --watch server/index.ts"`,
    'dev:fe': 'vite',
    'dev:be': 'bun run --watch server/index.ts',
    build: 'vite build',
    preview: 'NODE_ENV=production bun run server/index.ts',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit push',
    'db:studio': 'drizzle-kit studio',
    ...(pkg.scripts as Record<string, string> || {}),
  }

  const deps: Record<string, string> = {
    '@elysia/cors': '^1.4.2',
    '@elysia/static': '^1.4.11',
    'drizzle-orm': '^0.45.2',
    'drizzle-typebox': '^0.3.3',
    elysia: '^1.4.29',
  }
  pkg.dependencies = { ...deps, ...(pkg.dependencies as Record<string, string> || {}) }

  const devDeps: Record<string, string> = {
    '@libsql/client': '^0.17.4',
    'drizzle-kit': '^0.31.10',
    '@types/bun': '^1.3.14',
    concurrently: '^10.0.3',
  }
  pkg.devDependencies = { ...(pkg.devDependencies as Record<string, string> || {}), ...devDeps }

  await writeJson(pkgPath, pkg)
  console.log('  \u2713 Updated package.json')

  console.log('\nRunning bun install...')
  const install = Bun.spawnSync(['bun', 'install'], { cwd: targetDir })
  if (install.exitCode === 0) {
    console.log('  \u2713 Dependencies installed')
  } else {
    console.error('  \u2717 bun install failed:', install.stderr.toString())
  }

  console.log('\nRunning database migration...')
  const migrate = Bun.spawnSync(['bunx', 'drizzle-kit', 'push'], { cwd: targetDir })
  if (migrate.exitCode === 0) {
    console.log('  \u2713 Database tables created')
  } else {
    const stderr = migrate.stderr.toString()
    if (stderr.includes('no such table') || stderr.includes('already exists')) {
      console.log('  \u2192 Database already set up')
    } else {
      console.error('  \u2717 Migration failed:', stderr)
    }
  }

  console.log(`\nProject scaffolded at ${targetDir}`)
  console.log('Run: bun run dev')
}
