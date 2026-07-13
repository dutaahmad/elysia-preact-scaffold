import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { todos } from './schema'
import type { Todo, CreateTodo, UpdateTodo } from './types'

export const createTodoService = (db: BunSQLiteDatabase) => ({
  getAll(): Todo[] {
    return db.select().from(todos).orderBy(todos.createdAt).all()
  },

  getById(id: number): Todo | undefined {
    return db.select().from(todos).where(eq(todos.id, id)).get()
  },

  create(data: CreateTodo): Todo | undefined {
    return db.insert(todos).values(data).returning().get()
  },

  update(id: number, data: UpdateTodo): Todo | undefined {
    return db
      .update(todos)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(todos.id, id))
      .returning()
      .get()
  },

  remove(id: number): Todo | undefined {
    return db.delete(todos).where(eq(todos.id, id)).returning().get()
  },
})
