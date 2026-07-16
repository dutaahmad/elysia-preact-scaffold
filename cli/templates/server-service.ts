import { toPascalCase } from '../utils/name'

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
