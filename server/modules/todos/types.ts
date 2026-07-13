import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { todos } from './schema'

export type Todo = InferSelectModel<typeof todos>
export type CreateTodo = InferInsertModel<typeof todos>
export type UpdateTodo = Partial<CreateTodo>
