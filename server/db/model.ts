import { todos } from '../modules/todos/schema'
import { spreads } from './utils'

export const db = {
  insert: spreads({ todos }, 'insert'),
  select: spreads({ todos }, 'select'),
} as const
