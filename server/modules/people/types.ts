import type { InferSelectModel, InferInsertModel } from 'drizzle-orm'
import { people } from './schema'

export type People = InferSelectModel<typeof people>
export type CreatePeople = InferInsertModel<typeof people>
export type UpdatePeople = Partial<CreatePeople>
