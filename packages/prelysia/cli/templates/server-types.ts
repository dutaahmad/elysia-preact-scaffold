import { toPascalCase } from '../utils/name'

export function typesTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  return `import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { ${tableName} } from './schema'

export type ${Pascal} = InferSelectModel<typeof ${tableName}>
export type Create${Pascal} = InferInsertModel<typeof ${tableName}>
export type Update${Pascal} = Partial<Create${Pascal}>
`
}
