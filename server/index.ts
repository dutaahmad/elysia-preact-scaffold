import { Elysia } from 'elysia'
import { cors } from '@elysia/cors'
import { staticPlugin } from '@elysia/static'
import { config } from './config'
import { dbPlugin } from './plugins/db'
import { todosModule } from './modules/todos'

const app = new Elysia()
  .use(cors())
  .use(dbPlugin)
  .use(todosModule)

if (config.isProduction) {
  app.use(
    await staticPlugin({
      prefix: '/',
      assets: 'dist',
      indexHTML: true,
    }),
  )
}

app.listen(config.port, ({ hostname, port }) => {
  console.log(`Server running at http://${hostname}:${port}`)
})
