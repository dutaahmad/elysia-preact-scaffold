import { toPascalCase } from '../utils/name'
import type { FieldDef } from '../types'

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
