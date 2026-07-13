import { Elysia } from 'elysia'
import { todosRoutes } from './routes'

export const todosModule = new Elysia({ prefix: '/api/todos', name: 'todos-module' })
  .use(todosRoutes)
