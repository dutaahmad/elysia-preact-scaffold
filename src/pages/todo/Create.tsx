import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState } from 'preact/hooks'
import { useMutation, useQueryClient } from '@tanstack/preact-query'
import { useLocation } from 'wouter'
import { todoApi } from '../../api/todo'
import type { CreateTodo } from '../../types/todo'

export function TodoCreate() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<CreateTodo>({
    title: '',
    content: '',
    references: '',
    status: '',
  })

  const mutation = useMutation({
      mutationFn: (data: CreateTodo) => {
          console.log(data)
          return todoApi.create(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo'] })
      navigate('/todo')
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
          <h1 class="page__title">New Todo</h1>
        </div>
        <div class="page__action">
          <a href="/todo" class="button button--neutral"><XIcon size={16} /> Cancel</a>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <form class="card" onSubmit={handleSubmit}>
            <div class="card__body">
          <div class="field">
            <label for="field-title">title <span class="text-red-500">*</span></label>
            <input
              class="input"
              type="text"
              id="field-title"
              value={formData.title ?? ''}
              required
              onInput={(e) => setFormData({ ...formData, title: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div class="field">
            <label for="field-content">content <span class="text-red-500">*</span></label>
            <input
              class="input"
              type="text"
              id="field-content"
              value={formData.content ?? ''}
              required
              onInput={(e) => setFormData({ ...formData, content: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div class="field">
            <label for="field-references">references</label>
            <input
              class="input"
              type="text"
              id="field-references"
              value={formData.references ?? ''}
              onInput={(e) => setFormData({ ...formData, references: (e.target as HTMLInputElement).value })}
            />
          </div>
          <div class="field">
            <label for="field-status">status <span class="text-red-500">*</span></label>
            <input
              class="switch"
              type="checkbox"
              role="switch"
              id="field-status"
              value={formData.status ?? ''}
              required
              onInput={(e) => setFormData({ ...formData, status: (e.target as HTMLInputElement).value })}
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
