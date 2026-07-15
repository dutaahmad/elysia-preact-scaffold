import { PlusIcon, PencilIcon, TrashIcon } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { Link } from 'wouter'
import { todoApi } from '../../api/todo'
import type { Todo } from '../../types/todo'

export function TodoList() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['todo'],
    queryFn: todoApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: todoApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todo'] }),
  })

  if (isLoading) return <div class="page"><div class="card"><div class="card__body">Loading...</div></div></div>
  if (error) return <div class="page"><div class="card"><div class="card__body">Error: {error.message}</div></div></div>

  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Todo</h1>
        </div>
        <div class="page__action">
          <Link href="/todo/new" class="button button--primary"><PlusIcon size={16} /> Add New</Link>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <div class="card">
            {data?.length === 0 ? (
              <div class="card__body">No todo found.</div>
            ) : (
              <table class="table table--hover table--striped">
                <thead>
                  <tr>
            <th>title</th>
            <th>content</th>
            <th>references</th>
            <th>status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((item: Todo) => (
                    <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.content}</td>
              <td>{item.references}</td>
              <td>{item.status}</td>
                      <td>
                        <Link href={`/todo/${item.id}/edit`} class="button button--ghost button--sm"><PencilIcon size={16} /> Edit</Link>
                        <button
                          class="button button--danger button--soft button--sm"
                          onClick={() => deleteMutation.mutate(item.id)}
                        >
                          <TrashIcon size={16} />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
