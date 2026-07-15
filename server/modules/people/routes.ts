import { Elysia } from 'elysia'
import { dbPlugin } from '../../plugins/db'
import { createPeopleService } from './service'
import { peopleModel } from './model'

export const peopleRoutes = new Elysia()
  .use(peopleModel)
  .use(dbPlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ peopleService: createPeopleService(db) }))
  .get('/', ({ peopleService }) => peopleService.getAll())
  .get('/:id', ({ peopleService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const item = peopleService.getById(numId)
    if (!item) {
      set.status = 404
      return 'Not found'
    }
    return item
  })
  .post('/', ({ peopleService, body }) => peopleService.create(body), { body: 'createPeople' })
  .patch('/:id', ({ peopleService, params: { id }, body, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const updated = peopleService.update(numId, body)
    if (!updated) {
      set.status = 404
      return 'Not found'
    }
    return updated
  }, { body: 'updatePeople' })
  .delete('/:id', ({ peopleService, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const removed = peopleService.remove(numId)
    if (!removed) {
      set.status = 404
      return 'Not found'
    }
    return removed
  })
