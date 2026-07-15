import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { register } from './schema'

const _createRegister = createInsertSchema(register,
  {
    full_name: t.String({ minLength: 1 }),  })
const _Register = createSelectSchema(register)

export const registerModel = new Elysia({ name: 'register-model' }).model({
  createRegister: t.Omit(_createRegister, ['id', 'createdAt', 'updatedAt']),
  updateRegister: t.Partial(t.Omit(_createRegister, ['id', 'createdAt', 'updatedAt'])),
  register: _Register,
})
