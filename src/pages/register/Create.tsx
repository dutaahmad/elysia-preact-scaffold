import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState } from 'preact/hooks'
import { useMutation, useQueryClient } from '@tanstack/preact-query'
import { useLocation } from 'wouter'
import { registerApi } from '../../api/register'
import type { CreateRegister } from '../../types/register'

export function RegisterCreate() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateRegister>({
    full_name: '',
  })

  const mutation = useMutation({
    mutationFn: (data: CreateRegister) => registerApi.create(data),
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
          <h1 class="page__title">New Register</h1>
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
                Create
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
