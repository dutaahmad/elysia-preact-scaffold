import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState, useEffect } from 'preact/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { useRoute, useLocation } from 'wouter'
import { registerApi } from '../../api/register'
import type { CreateRegister } from '../../types/register'

export function RegisterEdit() {
  const [, params] = useRoute('/register/:id/edit')
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateRegister>({
    full_name: '',
  })

  const { data: existing } = useQuery({
    queryKey: ['register', Number(params?.id)],
    queryFn: () => registerApi.getById(Number(params!.id)),
  })

  useEffect(() => {
    if (existing) {
      const { id, createdAt, updatedAt, ...rest } = existing as CreateRegister & { id: number; createdAt: string; updatedAt: string }
      setFormData(rest)
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: CreateRegister) => registerApi.update(Number(params!.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['register'] })
      navigate('/register')
    },
  })

  const handleSubmit = (e: Event) => {
    e.preventDefault()
    mutation.mutate(formData)
  }

  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Edit Register</h1>
        </div>
        <div class="page__action">
          <a href="/register" class="button button--neutral"><XIcon size={16} /> Cancel</a>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <form class="card" onSubmit={handleSubmit}>
            <div class="card__body">
          <div class="field">
            <label for="field-full_name">full_name <span class="text-red-500">*</span></label>
            <input
              class="input"
              type="text"
              id="field-full_name"
              value={formData.full_name ?? ''}
              required
              onInput={(e) => setFormData({ ...formData, full_name: (e.target as HTMLInputElement).value })}
            />
          </div>
            </div>
            <div class="card__footer">
              <button type="submit" class="button button--primary" aria-busy={mutation.isPending || undefined}>
                <CheckIcon size={20} />
                Update
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
