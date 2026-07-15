import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const todo = sqliteTable('todo', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  references: text('references'),
  status: text('status').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
})

export type TodoTable = typeof todo
