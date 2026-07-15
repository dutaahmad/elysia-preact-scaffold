import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { todo } from './schema'
import type { Todo, CreateTodo, UpdateTodo } from './types'

export const createTodoService = (db: BunSQLiteDatabase) => ({
  getAll(): Todo[] {
    return db.select().from(todo).orderBy(todo.createdAt).all()
  },

  getById(id: number): Todo | undefined {
    return db.select().from(todo).where(eq(todo.id, id)).get()
  },

  create(data: CreateTodo): Todo | undefined {
    return db.insert(todo).values(data).returning().get()
  },

  update(id: number, data: UpdateTodo): Todo | undefined {
    return db
      .update(todo)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(todo.id, id))
      .returning()
      .get()
  },

  remove(id: number): Todo | undefined {
    return db.delete(todo).where(eq(todo.id, id)).returning().get()
  },
})
