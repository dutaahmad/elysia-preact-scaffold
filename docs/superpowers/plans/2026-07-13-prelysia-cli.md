# prelysia CLI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `prelysia`, a CLI tool with `init` (full project scaffold) and `feat` (modular module generator) commands

**Architecture:** Single entry point using Commander.js for arg parsing, with thin command handlers delegating to generators. Templates are TypeScript template literal functions — no separate template files. File updates (re-exports, plugin registration) done via pattern-matched insertion into existing files.

**Tech Stack:** Bun runtime, Commander.js, `@inquirer/prompts`, TypeScript template literals

## Global Constraints

- All code in `cli/` directory
- No runtime deps outside `commander` and `@inquirer/prompts`
- Templates are TypeScript template literal functions, not files
- Feature names must be kebab-case (converted if needed)
- Module files follow exact 6-file pattern: schema, types, model, service, routes, index
- Generated code must match this repo's existing conventions (verbatimModuleSyntax, drizzle-typebox, .as('global'), etc.)

---

### Task 1: Set up CLI directory structure and dependencies

**Files:**
- Create: `cli/` directory structure

- [ ] **Step 1: Create directory skeleton**

```bash
mkdir -p cli/commands cli/generators cli/templates cli/utils
```

- [ ] **Step 2: Install dependencies**

```bash
bun add commander @inquirer/prompts
bun add -d @types/node
```

- [ ] **Step 3: Verify installation**

Run: `bun ls`
Expected: `commander` and `@inquirer/prompts` listed in dependencies

- [ ] **Step 4: Commit**

```bash
git add cli/ bun.lock package.json
git commit -m "chore: scaffold cli directory and install commander + @inquirer/prompts"
```

---

### Task 2: Build name utility

**Files:**
- Create: `cli/utils/name.ts`

**Interfaces:**
- Produces: `toPascalCase(kebab: string): string`, `toKebabCase(name: string): string`, `toCamelCase(kebab: string): string`

- [ ] **Step 1: Write the utility**

```typescript
// cli/utils/name.ts

export function toPascalCase(kebab: string): string {
  return kebab
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function toCamelCase(kebab: string): string {
  const pascal = toPascalCase(kebab)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toKebabCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[_\s]+/g, '-')
    .toLowerCase()
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/utils/name.ts
git commit -m "feat(cli): add name case conversion utilities"
```

---

### Task 3: Build file-system utility

**Files:**
- Create: `cli/utils/fs.ts`

**Interfaces:**
- Produces: `writeFileTree(basePath: string, files: Record<string, string>): Promise<void>` — creates directories and writes files
  - `insertAfterMarker(filePath: string, marker: string, content: string): Promise<void>` — appends content after a line containing `marker`
  - `readJson(filePath: string): Promise<object>` — reads and parses JSON
  - `writeJson(filePath: string, data: object): Promise<void>` — writes pretty-printed JSON

- [ ] **Step 1: Write the utility**

```typescript
// cli/utils/fs.ts
import { existsSync, mkdirSync } from 'fs'
import { readFile, writeFile, readdir as fsReaddir } from 'fs/promises'
import { dirname, join } from 'path'

export function ensureDir(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export async function writeFileTree(
  basePath: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(basePath, relativePath)
    ensureDir(fullPath)
    await writeFile(fullPath, content, 'utf-8')
  }
}

export function pathExists(filePath: string): boolean {
  return existsSync(filePath)
}

export async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function writeJson(filePath: string, data: Record<string, unknown>): Promise<void> {
  ensureDir(filePath)
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8')
}

export async function listDir(dirPath: string): Promise<string[]> {
  return fsReaddir(dirPath)
}

export async function writeText(filePath: string, content: string): Promise<void> {
  ensureDir(filePath)
  await writeFile(filePath, content, 'utf-8')
}

export async function updateProjectFile(
  filePath: string,
  marker: string,
  newLine: string,
): Promise<boolean> {
  const content = await readText(filePath)
  const lines = content.split('\n')
  const markerIndex = lines.findIndex((l) => l.includes(marker))
  if (markerIndex === -1) return false

  const indent = lines[markerIndex].match(/^\s*/)?.[0] ?? ''
  lines.splice(markerIndex + 1, 0, indent + newLine)
  await writeText(filePath, lines.join('\n'))
  return true
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/utils/fs.ts
git commit -m "feat(cli): add file system utilities"
```

---

### Task 4: Build module template functions

**Files:**
- Create: `cli/templates/module.ts`

**Interfaces:**
- Produces: `schemaTemplate(name: string, fields: FieldDef[]): string`
  - `typesTemplate(name: string): string`
  - `modelTemplate(name: string, fields: FieldDef[]): string`
  - `serviceTemplate(name: string): string`
  - `routesTemplate(name: string): string`
  - `indexTemplate(name: string, prefix: string): string`

- `FieldDef = { name: string; type: 'string' | 'number' | 'boolean'; required: boolean; default?: string | boolean | number }`

- [ ] **Step 1: Write the type definition and template functions**

```typescript
// cli/templates/module.ts
import { toPascalCase } from '../utils/name'

export interface FieldDef {
  name: string
  type: 'string' | 'number' | 'boolean'
  required: boolean
  default?: string | boolean | number
}

function resolveDrizzleType(field: FieldDef): string {
  switch (field.type) {
    case 'string':
      return field.required
        ? `text('${field.name}').notNull()`
        : `text('${field.name}')`
    case 'number':
      return field.required
        ? `integer('${field.name}').notNull()`
        : `integer('${field.name}')`
    case 'boolean':
      return field.required
        ? `integer('${field.name}', { mode: 'boolean' }).notNull()`
        : `integer('${field.name}', { mode: 'boolean' })`
  }
}

function resolveDefaultValue(field: FieldDef): string | null {
  if (field.default === undefined || field.default === null) return null
  if (field.type === 'string') return `'${field.default}'`
  return String(field.default)
}

function resolveDrizzleDefault(field: FieldDef): string {
  const def = resolveDefaultValue(field)
  if (!def) return ''
  return `.default(${def})`
}

export function schemaTemplate(tableName: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(tableName)

  const fieldLines = fields.map((f) => {
    const drizzleType = resolveDrizzleType(f)
    const defaultVal = resolveDrizzleDefault(f)
    return `  ${f.name}: ${drizzleType}${defaultVal},`
  })

  return `import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const ${tableName} = sqliteTable('${tableName}', {
  id: integer('id').primaryKey({ autoIncrement: true }),
${fieldLines.join('\n')}
  createdAt: text('created_at').notNull().\$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().\$defaultFn(() => new Date().toISOString()),
})

export type ${Pascal}Table = typeof ${tableName}
`
}

export function typesTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  return `import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { ${tableName} } from './schema'

export type ${Pascal} = InferSelectModel<typeof ${tableName}>
export type Create${Pascal} = InferInsertModel<typeof ${tableName}>
export type Update${Pascal} = Partial<Create${Pascal}>
`
}

export function modelTemplate(tableName: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(tableName)

  const overrideFields = fields
    .filter((f) => f.type === 'string' && f.required)
    .map((f) => `    ${f.name}: t.String({ minLength: 1 }),`)
    .join('\n')

  const overrideBlock = overrideFields ? `,\n  {\n${overrideFields}  }` : ''

  return `import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { ${tableName} } from './schema'

const _create${Pascal} = createInsertSchema(${tableName}${overrideBlock ? `\n  ${overrideBlock}\n)` : ')'}
const _${Pascal} = createSelectSchema(${tableName})

export const ${tableName}Model = new Elysia({ name: '${tableName}-model' }).model({
  create${Pascal}: t.Omit(_create${Pascal}, ['id', 'createdAt', 'updatedAt']),
  update${Pascal}: t.Partial(t.Omit(_create${Pascal}, ['id', 'createdAt', 'updatedAt'])),
  ${tableName}: _${Pascal},
})
`
}

export function serviceTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  const camel = tableName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

  return `import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { ${tableName} } from './schema'
import type { ${Pascal}, Create${Pascal}, Update${Pascal} } from './types'

export const create${Pascal}Service = (db: BunSQLiteDatabase) => ({
  getAll(): ${Pascal}[] {
    return db.select().from(${tableName}).orderBy(${tableName}.createdAt).all()
  },

  getById(id: number): ${Pascal} | undefined {
    return db.select().from(${tableName}).where(eq(${tableName}.id, id)).get()
  },

  create(data: Create${Pascal}): ${Pascal} | undefined {
    return db.insert(${tableName}).values(data).returning().get()
  },

  update(id: number, data: Update${Pascal}): ${Pascal} | undefined {
    return db
      .update(${tableName})
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(${tableName}.id, id))
      .returning()
      .get()
  },

  remove(id: number): ${Pascal} | undefined {
    return db.delete(${tableName}).where(eq(${tableName}.id, id)).returning().get()
  },
})
`
}

export function routesTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  const camel = tableName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

  return `import { Elysia } from 'elysia'
import { create${Pascal}Service } from './service'
import { ${tableName}Model } from './model'

export const ${camel}Routes = new Elysia()
  .use(${tableName}Model)
  .derive({ as: 'scoped' }, ({ db }) => ({ ${camel}Service: create${Pascal}Service(db) }))
  .get('/', ({ ${camel}Service }) => ${camel}Service.getAll())
  .get('/:id', ({ ${camel}Service, params: { id } }) => ${camel}Service.getById(Number(id)))
  .post('/', ({ ${camel}Service, body }) => ${camel}Service.create(body), { body: 'create${Pascal}' })
  .patch('/:id', ({ ${camel}Service, params: { id }, body }) => ${camel}Service.update(Number(id), body), { body: 'update${Pascal}' })
  .delete('/:id', ({ ${camel}Service, params: { id } }) => ${camel}Service.remove(Number(id)))
`
}

export function indexTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  const camel = tableName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const prefix = `/api/${tableName}`

  return `import { Elysia } from 'elysia'
import { ${camel}Routes } from './routes'

export const ${camel}Module = new Elysia({ prefix: '${prefix}', name: '${tableName}-module' })
  .use(${camel}Routes)
`
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/templates/module.ts
git commit -m "feat(cli): add module template functions for 6-file structure"
```

---

### Task 5: Build project scaffold template functions

**Files:**
- Create: `cli/templates/project.ts`

**Interfaces:**
- Produces: Template functions for all scaffoldable project files

- [ ] **Step 1: Write all scaffold template functions**

```typescript
// cli/templates/project.ts

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
```

- [ ] **Step 2: Commit**

```bash
git add cli/templates/project.ts
git commit -m "feat(cli): add project scaffold template functions"
```

---

### Task 6: Build the module generator (feat)

**Files:**
- Create: `cli/generators/module.ts`
- Modify: `cli/templates/module.ts` (ensure exports align)

**Interfaces:**
- Produces: `generateModule(basePath: string, featureName: string): Promise<void>` — prompts for fields, generates 6 files, updates configs
  - `collectFields(): Promise<FieldDef[]>` — interactive prompt sequence
  - `detectExistingProject(basePath: string): boolean` — checks if server/ exists

- [ ] **Step 1: Write the module generator**

```typescript
// cli/generators/module.ts
import { input, select, confirm } from '@inquirer/prompts'
import { toKebabCase } from '../utils/name'
import { writeFileTree, readText, writeText, pathExists } from '../utils/fs'
import {
  schemaTemplate,
  typesTemplate,
  modelTemplate,
  serviceTemplate,
  routesTemplate,
  indexTemplate,
  type FieldDef,
} from '../templates/module'
import { join } from 'path'

async function collectFields(): Promise<FieldDef[]> {
  const fields: FieldDef[] = []
  let addMore = true

  while (addMore) {
    const name = await input({
      message: 'Field name (snake_case):',
      validate: (v) => (v ? true : 'Field name is required'),
    })

    const type = await select<'string' | 'number' | 'boolean'>({
      message: `Field type for "${name}":`,
      choices: [
        { name: 'string (text)', value: 'string' },
        { name: 'number (integer)', value: 'number' },
        { name: 'boolean', value: 'boolean' },
      ],
    })

    const required = await confirm({
      message: `Is "${name}" required?`,
      default: true,
    })

    let defaultVal: string | boolean | number | undefined
    if (!required) {
      const defaultRaw = await input({
        message: `Default value for "${name}" (leave empty for none):`,
      })
      if (defaultRaw) {
        defaultVal = type === 'number' ? Number(defaultRaw) : type === 'boolean' ? defaultRaw === 'true' : defaultRaw
      }
    }

    fields.push({ name, type, required, default: defaultVal })

    addMore = await confirm({
      message: 'Add another field?',
      default: false,
    })
  }

  return fields
}

async function updateDbSchema(serverPath: string, tableName: string): Promise<boolean> {
  const schemaPath = join(serverPath, 'db', 'schema.ts')
  if (!pathExists(schemaPath)) {
    await writeText(schemaPath, `export { ${tableName} } from '../modules/${tableName}/schema'\n`)
    return true
  }

  const content = await readText(schemaPath)
  const exportLine = `export { ${tableName} } from '../modules/${tableName}/schema'`
  if (!content.includes(tableName)) {
    await writeText(schemaPath, content.trimEnd() + '\n' + exportLine + '\n')
  }
  return true
}

async function updateServerIndex(serverPath: string, moduleName: string, camelName: string): Promise<boolean> {
  const indexPath = join(serverPath, 'index.ts')
  if (!pathExists(indexPath)) return false

  const content = await readText(indexPath)
  const lines = content.split('\n')

  const importLine = `import { ${camelName}Module } from './modules/${moduleName}'`

  const useLine = `  .use(${camelName}Module)`

  if (content.includes(importLine)) return false

  // Insert import after last import
  const lastImportIdx = lines.reduce((max, line, i) => {
    return line.startsWith('import ') ? i : max
  }, -1)

  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine)
  }

  // Insert .use() before the static plugin or listen
  const listenIdx = lines.findIndex((l) => l.includes('.listen('))
  const staticIdx = lines.findIndex((l) => l.includes('staticPlugin'))

  const insertIdx = staticIdx >= 0 ? staticIdx : listenIdx >= 0 ? listenIdx : -1

  if (insertIdx > 0) {
    lines.splice(insertIdx, 0, useLine)
  }

  await writeText(indexPath, lines.join('\n'))
  return true
}

export async function generateModule(basePath: string, featureName: string): Promise<void> {
  const moduleName = toKebabCase(featureName)
  const serverPath = join(basePath, 'server')
  const moduleDir = join('modules', moduleName)
  const fields = await collectFields()

  const files: Record<string, string> = {
    [join(moduleDir, 'schema.ts')]: schemaTemplate(moduleName, fields),
    [join(moduleDir, 'types.ts')]: typesTemplate(moduleName),
    [join(moduleDir, 'model.ts')]: modelTemplate(moduleName, fields),
    [join(moduleDir, 'service.ts')]: serviceTemplate(moduleName),
    [join(moduleDir, 'routes.ts')]: routesTemplate(moduleName),
    [join(moduleDir, 'index.ts')]: indexTemplate(moduleName),
  }

  await writeFileTree(serverPath, files)

  const camelName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

  const schemaOk = await updateDbSchema(serverPath, moduleName)
  const indexOk = await updateServerIndex(serverPath, moduleName, camelName)

  console.log(`\nGenerated module: ${moduleName}`)
  for (const [rel] of Object.entries(files)) {
    console.log(`  \u2713 ${join(serverPath, rel)}`)
  }
  if (schemaOk) console.log('  \u2713 Updated server/db/schema.ts')
  if (indexOk) console.log('  \u2713 Updated server/index.ts')
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/generators/module.ts
git commit -m "feat(cli): add module generator with interactive field prompts"
```

---

### Task 7: Build the project scaffold generator (init)

**Files:**
- Create: `cli/generators/scaffold.ts`

**Interfaces:**
- Produces: `scaffoldProject(targetDir: string, projectName: string): Promise<void>`

- [ ] **Step 1: Write the scaffold generator**

```typescript
// cli/generators/scaffold.ts
import { join } from 'path'
import { confirm } from '@inquirer/prompts'
import { writeFileTree, writeJson, writeText, readJson, pathExists, readText } from '../utils/fs'
import { serverIndexTemplate, serverConfigTemplate, dbPluginTemplate } from '../templates/project'
import { schemaTemplate, typesTemplate, modelTemplate, serviceTemplate, routesTemplate, indexTemplate } from '../templates/module'

export async function scaffoldProject(targetDir: string, projectName: string): Promise<void> {
  const files: Record<string, string> = {}

  // Server entry
  files['server/index.ts'] = serverIndexTemplate()
  files['server/config.ts'] = serverConfigTemplate()

  // DB
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

  // Plugin
  files['server/plugins/db.ts'] = dbPluginTemplate()

  // Example todos module
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

  // Config files
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

  // Write all server files
  await writeFileTree(targetDir, files)

  // Update existing vite.config.ts with proxy
  const viteConfigPath = join(targetDir, 'vite.config.ts')
  if (pathExists(viteConfigPath)) {
    let viteContent = await readText(viteConfigPath)
    if (!viteContent.includes('proxy')) {
      viteContent = viteContent.replace(
        /\)\)/,
        `\n  server: {\n    proxy: {\n      '/api': {\n        target: 'http://localhost:3000',\n        changeOrigin: true,\n      },\n    },\n  },\n}))`,
      )
      await writeText(viteConfigPath, viteContent)
    }
    console.log('  \u2713 Updated vite.config.ts')
  }

  // Update or create package.json
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

  // Clean up old .env.example if it has stale content
  const envExamplePath = join(targetDir, '.env.example')
  if (pathExists(envExamplePath)) {
    const envExample = await readText(envExamplePath)
    if (envExample.includes('CLICKUP')) {
      // Leave it but just note it exists
    }
  }

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
```

- [ ] **Step 2: Commit**

```bash
git add cli/generators/scaffold.ts
git commit -m "feat(cli): add full project scaffold generator (init)"
```

---

### Task 8: Build the `feat` command handler

**Files:**
- Create: `cli/commands/feat.ts`

**Interfaces:**
- Consumes: `generateModule(basePath, featureName)` from `cli/generators/module.ts`
- Produces: Exported `featAction(name: string, options: { cwd?: string })`

- [ ] **Step 1: Write the feat command**

```typescript
// cli/commands/feat.ts
import { generateModule } from '../generators/module'
import { pathExists } from '../utils/fs'
import { join } from 'path'

export async function featAction(
  name: string,
  options: { cwd?: string } = {},
): Promise<void> {
  const targetDir = options.cwd || process.cwd()
  const serverPath = join(targetDir, 'server')

  if (!pathExists(serverPath)) {
    console.error('Error: No server/ directory found. Run prelysia init first.')
    process.exit(1)
  }

  await generateModule(targetDir, name)
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/commands/feat.ts
git commit -m "feat(cli): add 'feat' command handler"
```

---

### Task 9: Build the `init` command handler

**Files:**
- Create: `cli/commands/init.ts`

**Interfaces:**
- Consumes: `scaffoldProject(targetDir, projectName)` from `cli/generators/scaffold.ts`
- Produces: Exported `initAction(projectName?: string, options: { cwd?: string })`

- [ ] **Step 1: Write the init command**

```typescript
// cli/commands/init.ts
import { join, resolve } from 'path'
import { input, confirm } from '@inquirer/prompts'
import { scaffoldProject } from '../generators/scaffold'
import { pathExists, listDir } from '../utils/fs'
import { toKebabCase } from '../utils/name'

async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await listDir(dirPath)
    return entries.length === 0
  } catch {
    return true
  }
}

export async function initAction(
  projectName?: string,
  options: { cwd?: string } = {},
): Promise<void> {
  let targetDir: string

  if (projectName) {
    const name = toKebabCase(projectName)
    targetDir = resolve(options.cwd || process.cwd(), name)
  } else {
    targetDir = resolve(options.cwd || process.cwd())
  }

  const nonEmpty = !(await isDirectoryEmpty(targetDir))
  if (nonEmpty) {
    const proceed = await confirm({
      message: `Directory ${targetDir} is not empty. Continue anyway?`,
      default: false,
    })
    if (!proceed) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  const name = projectName || 'elysia-preact-app'

  console.log(`Scaffolding project at ${targetDir}...`)
  await scaffoldProject(targetDir, name)
}
```

- [ ] **Step 2: Commit**

```bash
git add cli/commands/init.ts
git commit -m "feat(cli): add 'init' command handler"
```

---

### Task 10: Build the CLI entry point

**Files:**
- Create: `cli/prelysia.ts`

**Interfaces:**
- Consumes: `initAction`, `featAction` from command modules
- Produces: Runnable CLI entry

- [ ] **Step 1: Write prelysia.ts**

```typescript
#!/usr/bin/env bun

import { Command } from 'commander'
import { initAction } from './commands/init'
import { featAction } from './commands/feat'
import { readFileSync } from 'fs'
import { join } from 'path'

function getVersion(): string {
  try {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf-8'),
    )
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const program = new Command()

program
  .name('prelysia')
  .description('Elysia + Preact fullstack scaffold CLI')
  .version(getVersion())

program
  .command('init')
  .description('Scaffold a new fullstack project')
  .argument('[project-name]', 'Project name (creates directory)')
  .action(initAction)

program
  .command('feat')
  .description('Generate a new module with CRUD routes')
  .argument('<name>', 'Feature name (kebab-case)')
  .action(featAction)

program.parse()
```

- [ ] **Step 2: Make executable and test --help**

```bash
chmod +x cli/prelysia.ts
```

Run: `bun run cli/prelysia.ts --help`
Expected: Shows usage with init and feat commands

- [ ] **Step 3: Commit**

```bash
git add cli/prelysia.ts
git commit -m "feat(cli): add CLI entry point with Commander.js"
```

---

### Task 11: End-to-end test of `feat`

**Files:**
- Test against the existing project

- [ ] **Step 1: Run feat in the existing project**

```bash
cd /tmp && rm -rf test-feat && mkdir test-feat && cd test-feat
# Simulate by symlinking or copying the actual project's server/ dir
cp -r /home/dutaahmad/Code/elysia-preact-scaffold/server .
cp /home/dutaahmad/Code/elysia-preact-scaffold/package.json .
cp /home/dutaahmad/Code/elysia-preact-scaffold/drizzle.config.ts .
bun install
bunx drizzle-kit push
```

- [ ] **Step 2: Run feat to generate a new module**

```bash
cd /tmp/test-feat
bun run /home/dutaahmad/Code/elysia-preact-scaffold/cli/prelysia.ts feat tags
```

Provide input:
- Field: `name` (string, required)
- Field: `color` (string, not required, default `blue`)
- No more fields

Expected:
- `server/modules/tags/` directory with 6 files
- `server/db/schema.ts` now re-exports `tags`
- `server/index.ts` now imports and uses `tagsModule`

- [ ] **Step 3: Verify the generated server compiles**

```bash
bun run server/index.ts &
sleep 2
curl -s http://localhost:3000/api/tags
# Should return []
curl -s -X POST http://localhost:3000/api/tags -H "Content-Type: application/json" -d '{"name":"test","color":"red"}'
# Should create a tag
kill %1 2>/dev/null || true
```

Expected: API works, tags CRUD available

- [ ] **Step 4: Cleanup**

```bash
rm -rf /tmp/test-feat
```

- [ ] **Step 5: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix(cli): adjust module generation after e2e test"
```

---

### Task 12: Clean up stale `.env.example`

- [ ] **Step 1: Update .env.example to match the scaffold**

```typescript
// .env.example
PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
```

- [ ] **Step 2: Commit**

```bash
git add .env.example
git commit -m "chore: update .env.example to match scaffold defaults"
```
