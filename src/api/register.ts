import { api } from './client'
import type { Register, CreateRegister, UpdateRegister } from '../types/register'

export const registerApi = {
  getAll: () => api.get<Register[]>('/api/register'),
  getById: (id: number) => api.get<Register>(`/api/register/${id}`),
  create: (data: CreateRegister) => api.post<Register>('/api/register', data),
  update: (id: number, data: UpdateRegister) => api.patch<Register>(`/api/register/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/register/${id}`),
}
