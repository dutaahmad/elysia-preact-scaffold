export const config = {
  port: Number(process.env.PORT) || 3000,
  dbPath: process.env.DB_PATH || 'server/data/todos.db',
  isProduction: process.env.NODE_ENV === 'production',
}
