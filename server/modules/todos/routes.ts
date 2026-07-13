import { Elysia } from 'elysia'
import { createTodoService } from './service'
import { todosModel } from './model'

export const todosRoutes = new Elysia()
  .use(todosModel)
  .derive({ as: 'scoped' }, ({ db }) => ({ todoService: createTodoService(db) }))
  .get('/', ({ todoService }) => todoService.getAll())
  .get('/:id', ({ todoService, params: { id } }) => todoService.getById(Number(id)))
  .post('/', ({ todoService, body }) => todoService.create(body), { body: 'createTodo' })
  .patch('/:id', ({ todoService, params: { id }, body }) => todoService.update(Number(id), body), { body: 'updateTodo' })
  .delete('/:id', ({ todoService, params: { id } }) => todoService.remove(Number(id)))
