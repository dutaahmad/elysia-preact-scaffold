import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { people } from './schema'
import type { People, CreatePeople, UpdatePeople } from './types'

export const createPeopleService = (db: BunSQLiteDatabase) => ({
  getAll(): People[] {
    return db.select().from(people).orderBy(people.createdAt).all()
  },

  getById(id: number): People | undefined {
    return db.select().from(people).where(eq(people.id, id)).get()
  },

  create(data: CreatePeople): People | undefined {
    return db.insert(people).values(data).returning().get()
  },

  update(id: number, data: UpdatePeople): People | undefined {
    return db
      .update(people)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(people.id, id))
      .returning()
      .get()
  },

  remove(id: number): People | undefined {
    return db.delete(people).where(eq(people.id, id)).returning().get()
  },
})
