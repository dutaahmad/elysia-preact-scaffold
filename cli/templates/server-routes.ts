import { toPascalCase } from '../utils/name'

export function routesTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  const camel = tableName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

  return `import { Elysia } from 'elysia'
import { dbPlugin } from '../../plugins/db'
import { create${Pascal}Service } from './service'
import { ${tableName}Model } from './model'

export const ${camel}Routes = new Elysia()
  .use(${tableName}Model)
  .use(dbPlugin)
  .derive({ as: 'scoped' }, ({ db }) => ({ ${camel}Service: create${Pascal}Service(db) }))
  .get('/', ({ ${camel}Service }) => ${camel}Service.getAll())
  .get('/:id', ({ ${camel}Service, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const item = ${camel}Service.getById(numId)
    if (!item) {
      set.status = 404
      return 'Not found'
    }
    return item
  })
  .post('/', ({ ${camel}Service, body }) => ${camel}Service.create(body), { body: 'create${Pascal}' })
  .patch('/:id', ({ ${camel}Service, params: { id }, body, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const updated = ${camel}Service.update(numId, body)
    if (!updated) {
      set.status = 404
      return 'Not found'
    }
    return updated
  }, { body: 'update${Pascal}' })
  .delete('/:id', ({ ${camel}Service, params: { id }, set }) => {
    const numId = Number(id)
    if (isNaN(numId)) {
      set.status = 400
      return 'Invalid ID'
    }
    const removed = ${camel}Service.remove(numId)
    if (!removed) {
      set.status = 404
      return 'Not found'
    }
    return removed
  })
`
}

export function indexTemplate(tableName: string): string {
  const Pascal = toPascalCase(tableName)
  const camel = tableName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const prefix = `/api/${tableName}`

  return `import { Elysia } from 'elysia'
import { ${camel}Routes } from './routes'

export const ${camel}Module = new Elysia({ prefix: '${prefix}', name: '${tableName}-module' })
  .use(${camel}Routes)
`
}
