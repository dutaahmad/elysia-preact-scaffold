import { Elysia } from 'elysia'
import { todoRoutes } from './routes'

export const todoModule = new Elysia({ prefix: '/api/todo', name: 'todo-module' })
  .use(todoRoutes)
