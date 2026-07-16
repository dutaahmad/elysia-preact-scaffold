import { toPascalCase } from '../utils/name'
import type { FieldDef } from '../types'

export function feTypesTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)

  const selectFields = fields.map((f) => {
    const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'
    const optional = f.required ? '' : '?'
    return `  ${f.name}${optional}: ${tsType}`
  })

  const createFields = fields.map((f) => {
    const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'
    const optional = f.required ? '' : '?'
    return `  ${f.name}${optional}: ${tsType}`
  })

  return `export interface ${Pascal} {
  id: number
${selectFields.join('\n')}
  createdAt: string
  updatedAt: string
}

export interface Create${Pascal} {
${createFields.join('\n')}
}

export type Update${Pascal} = Partial<Create${Pascal}>
`
}
