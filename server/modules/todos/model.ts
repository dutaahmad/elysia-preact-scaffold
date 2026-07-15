import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { todos } from './schema'

const _createTodos = createInsertSchema(todos, {
  title: t.String({ minLength: 1 }),
})
const _todos = createSelectSchema(todos)

export const todosModel = new Elysia({ name: 'todos-model' }).model({
  createTodos: t.Omit(_createTodos, ['id', 'createdAt', 'updatedAt']),
  updateTodos: t.Partial(t.Omit(_createTodos, ['id', 'createdAt', 'updatedAt'])),
  todos: _todos,
})
