import { Elysia } from 'elysia'
import { peopleRoutes } from './routes'

export const peopleModule = new Elysia({ prefix: '/api/people', name: 'people-module' })
  .use(peopleRoutes)
