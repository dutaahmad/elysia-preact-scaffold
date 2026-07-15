import { eq } from 'drizzle-orm'
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'
import { register } from './schema'
import type { Register, CreateRegister, UpdateRegister } from './types'

export const createRegisterService = (db: BunSQLiteDatabase) => ({
  getAll(): Register[] {
    return db.select().from(register).orderBy(register.createdAt).all()
  },

  getById(id: number): Register | undefined {
    return db.select().from(register).where(eq(register.id, id)).get()
  },

  create(data: CreateRegister): Register | undefined {
    return db.insert(register).values(data).returning().get()
  },

  update(id: number, data: UpdateRegister): Register | undefined {
    return db
      .update(register)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(register.id, id))
      .returning()
      .get()
  },

  remove(id: number): Register | undefined {
    return db.delete(register).where(eq(register.id, id)).returning().get()
  },
})
