import { api } from './client'
import type { Todo, CreateTodo, UpdateTodo } from '../types/todo'

export const todoApi = {
  getAll: () => api.get<Todo[]>('/api/todo'),
  getById: (id: number) => api.get<Todo>(`/api/todo/${id}`),
  create: (data: CreateTodo) => api.post<Todo>('/api/todo', data),
  update: (id: number, data: UpdateTodo) => api.patch<Todo>(`/api/todo/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/todo/${id}`),
}
