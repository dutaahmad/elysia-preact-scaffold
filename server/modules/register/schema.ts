import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const register = sqliteTable('register', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  full_name: text('full_name').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type RegisterTable = typeof register
