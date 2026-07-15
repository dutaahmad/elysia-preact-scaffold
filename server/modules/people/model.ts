import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { people } from './schema'

const _createPeople = createInsertSchema(people,
  {
    full_name: t.String({ minLength: 1 }),  })
const _People = createSelectSchema(people)

export const peopleModel = new Elysia({ name: 'people-model' }).model({
  createPeople: t.Omit(_createPeople, ['id', 'createdAt', 'updatedAt']),
  updatePeople: t.Partial(t.Omit(_createPeople, ['id', 'createdAt', 'updatedAt'])),
  people: _People,
})
