export interface People {
  id: number
  full_name: string
  gender: number
  marriage: boolean
  createdAt: string
  updatedAt: string
}

export interface CreatePeople {
  full_name: string
  gender: number
  marriage: boolean
}

export type UpdatePeople = Partial<CreatePeople>
