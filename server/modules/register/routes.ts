import { Elysia } from 'elysia'
import { dbPlugin } from '../../plugins/db'
import { createRegisterService } from './service'
import { registerModel } from './model'

export const registerRoutes = new Elysia()
  .use(registerModel)
  .use(dbPlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ registerService: createRegisterService(db) }))
  .get('/', ({ registerService }) => registerService.getAll())
  .get('/:id', ({ registerService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const item = registerService.getById(numId)
    if (!item) {
      set.status = 404
      return 'Not found'
    }
    return item
  })
  .post('/', ({ registerService, body }) => registerService.create(body), { body: 'createRegister' })
  .patch('/:id', ({ registerService, params: { id }, body, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const updated = registerService.update(numId, body)
    if (!updated) {
      set.status = 404
      return 'Not found'
    }
    return updated
  }, { body: 'updateRegister' })
  .delete('/:id', ({ registerService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const removed = registerService.remove(numId)
    if (!removed) {
      set.status = 404
      return 'Not found'
    }
    return removed
  })
