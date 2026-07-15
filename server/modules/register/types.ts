import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { register } from './schema'

export type Register = InferSelectModel<typeof register>
export type CreateRegister = InferInsertModel<typeof register>
export type UpdateRegister = Partial<CreateRegister>
