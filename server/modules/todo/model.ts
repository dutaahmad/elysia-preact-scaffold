import { Elysia, t } from 'elysia'
import { createInsertSchema, createSelectSchema } from 'drizzle-typebox'
import { todo } from './schema'

const _createTodo = createInsertSchema(todo,
  {
    title: t.String({ minLength: 1 }),
    content: t.String({ minLength: 1 }),
    status: t.String({ minLength: 1 }),  })
const _Todo = createSelectSchema(todo)

export const todoModel = new Elysia({ name: 'todo-model' }).model({
  createTodo: t.Omit(_createTodo, ['id', 'createdAt', 'updatedAt']),
  updateTodo: t.Partial(t.Omit(_createTodo, ['id', 'createdAt', 'updatedAt'])),
  todo: _Todo,
})
