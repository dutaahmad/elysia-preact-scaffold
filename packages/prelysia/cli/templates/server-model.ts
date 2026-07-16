import { toPascalCase } from '../utils/name'
import type { FieldDef } from '../types'

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
