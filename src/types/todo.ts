export interface Todo {
  id: number
  title: string
  content: string
  references?: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateTodo {
  title: string
  content: string
  references?: string
  status: string
}

export type UpdateTodo = Partial<CreateTodo>
