import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { todos } from './schema'

const _createTodo = createInsertSchema(todos, {
  title: t.String({ minLength: 1 }),
})
const _todo = createSelectSchema(todos)

export const todosModel = new Elysia({ name: 'todos-model' }).model({
  createTodo: t.Omit(_createTodo, ['id', 'createdAt', 'updatedAt']),
  updateTodo: t.Partial(t.Omit(_createTodo, ['id', 'createdAt', 'updatedAt'])),
  todo: _todo,
})
