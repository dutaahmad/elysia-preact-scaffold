import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DB_PATH ?? 'server/data/todos.db',
  },
})
