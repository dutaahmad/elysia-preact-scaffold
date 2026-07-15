import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { todo } from './schema'

export type Todo = InferSelectModel<typeof todo>
export type CreateTodo = InferInsertModel<typeof todo>
export type UpdateTodo = Partial<CreateTodo>
