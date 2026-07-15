import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const people = sqliteTable('people', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  full_name: text('full_name').notNull(),
  gender: integer('gender').notNull(),
  marriage: integer('marriage', { mode: 'boolean' }).notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type PeopleTable = typeof people
