export interface Register {
  id: number
  full_name: string
  createdAt: string
  updatedAt: string
}

export interface CreateRegister {
  full_name: string
}

export type UpdateRegister = Partial<CreateRegister>
