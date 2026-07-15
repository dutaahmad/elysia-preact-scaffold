import { api } from './client'
import type { People, CreatePeople, UpdatePeople } from '../types/people'

export const peopleApi = {
  getAll: () => api.get<People[]>('/api/people'),
  getById: (id: number) => api.get<People>(`/api/people/${id}`),
  create: (data: CreatePeople) => api.post<People>('/api/people', data),
  update: (id: number, data: UpdatePeople) => api.patch<People>(`/api/people/${id}`, data),
  remove: (id: number) => api.delete<void>(`/api/people/${id}`),
}
