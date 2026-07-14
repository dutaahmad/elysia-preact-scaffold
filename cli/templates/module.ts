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
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
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

  const schemaArgs = overrideFields.length > 0
    ? `${tableName},\n  {\n${overrideFields.join('\n')}  }`
    : tableName

  return `import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { ${tableName} } from './schema'

const _create${Pascal} = createInsertSchema(${schemaArgs})
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
