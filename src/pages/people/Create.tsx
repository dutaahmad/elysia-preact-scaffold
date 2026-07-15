import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState } from 'preact/hooks'
import { useMutation, useQueryClient } from '@tanstack/preact-query'
import { useLocation } from 'wouter'
import { peopleApi } from '../../api/people'
import type { CreatePeople } from '../../types/people'

export function PeopleCreate() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreatePeople>({
    full_name: '',
    gender: 0,
    marriage: false,
  })

  const mutation = useMutation({
    mutationFn: (data: CreatePeople) => peopleApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] })
      navigate('/people')
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
          <h1 class="page__title">New People</h1>
        </div>
        <div class="page__action">
          <a href="/people" class="button button--neutral"><XIcon size={16} /> Cancel</a>
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
          <div class="field">
            <label for="field-gender">gender <span class="text-red-500">*</span></label>
            <input
              class="input"
              type="number"
              id="field-gender"
              value={formData.gender ?? ''}
              required
              onInput={(e) => setFormData({ ...formData, gender: Number((e.target as HTMLInputElement).value) })}
            />
          </div>
          <div class="field">
            <label class="field__item" for="field-marriage">
              <input
                type="checkbox"
                role="switch"
                class="switch"
                id="field-marriage"
                checked={formData.marriage ?? false}
                onChange={(e) => setFormData({ ...formData, marriage: (e.target as HTMLInputElement).checked })}
              />
              <span class="field__label">marriage</span>
            </label>
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
