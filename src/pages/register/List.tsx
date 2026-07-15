import { PlusIcon, PencilIcon, TrashIcon } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { Link } from 'wouter'
import { registerApi } from '../../api/register'
import type { Register } from '../../types/register'

export function RegisterList() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['register'],
    queryFn: registerApi.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: registerApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['register'] }),
  })

  if (isLoading) return <div class="page"><div class="card"><div class="card__body">Loading...</div></div></div>
  if (error) return <div class="page"><div class="card"><div class="card__body">Error: {error.message}</div></div></div>

  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Register</h1>
        </div>
        <div class="page__action">
          <Link href="/register/new" class="button button--primary"><PlusIcon size={16} /> Add New</Link>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <div class="card">
            {data?.length === 0 ? (
              <div class="card__body">No register found.</div>
            ) : (
              <table class="table table--hover table--striped">
                <thead>
                  <tr>
            <th>full_name</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((item: Register) => (
                    <tr key={item.id}>
              <td>{item.full_name}</td>
                      <td>
                        <Link href={`/register/${item.id}/edit`} class="button button--ghost button--sm"><PencilIcon size={16} /> Edit</Link>
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
