import { Elysia } from 'elysia'
import { dbPlugin } from '../../plugins/db'
import { createTodoService } from './service'
import { todoModel } from './model'

export const todoRoutes = new Elysia()
  .use(todoModel)
  .use(dbPlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ todoService: createTodoService(db) }))
  .get('/', ({ todoService }) => todoService.getAll())
  .get('/:id', ({ todoService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const item = todoService.getById(numId)
    if (!item) {
      set.status = 404
      return 'Not found'
    }
    return item
  })
  .post('/', ({ todoService, body }) => todoService.create(body), { body: 'createTodo' })
  .patch('/:id', ({ todoService, params: { id }, body, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const updated = todoService.update(numId, body)
    if (!updated) {
      set.status = 404
      return 'Not found'
    }
    return updated
  }, { body: 'updateTodo' })
  .delete('/:id', ({ todoService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const removed = todoService.remove(numId)
    if (!removed) {
      set.status = 404
      return 'Not found'
    }
    return removed
  })
