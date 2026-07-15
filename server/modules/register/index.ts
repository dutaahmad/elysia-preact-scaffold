import { Elysia } from 'elysia'
import { registerRoutes } from './routes'

export const registerModule = new Elysia({ prefix: '/api/register', name: 'register-module' })
  .use(registerRoutes)
