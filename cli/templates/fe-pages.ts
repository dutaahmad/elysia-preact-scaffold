import { toPascalCase, toCamelCase } from '../utils/name'
import type { FieldDef } from '../types'

export function feListPageTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  const headerCells = fields.map((f) => `            <th>${f.name}</th>`).join('\n')
  const dataCells = fields.map((f) => `              <td>{item.${f.name}}</td>`).join('\n')

  return `import { PlusIcon, PencilIcon, TrashIcon } from '@phosphor-icons/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { Link } from 'wouter'
import { ${camel}Api } from '../../api/${name}'
import type { ${Pascal} } from '../../types/${name}'

export function ${Pascal}List() {
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['${name}'],
    queryFn: ${camel}Api.getAll,
  })

  const deleteMutation = useMutation({
    mutationFn: ${camel}Api.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['${name}'] }),
  })

  if (isLoading) return <div class="page"><div class="card"><div class="card__body">Loading...</div></div></div>
  if (error) return <div class="page"><div class="card"><div class="card__body">Error: {error.message}</div></div></div>

  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">${Pascal}</h1>
        </div>
        <div class="page__action">
          <Link href="/${name}/new" class="button button--primary"><PlusIcon size={16} /> Add New</Link>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <div class="card">
            {data?.length === 0 ? (
              <div class="card__body">No ${name} found.</div>
            ) : (
              <table class="table table--hover table--striped">
                <thead>
                  <tr>
${headerCells}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.map((item: ${Pascal}) => (
                    <tr key={item.id}>
${dataCells}
                      <td>
                        <Link href={\`/${name}/\${item.id}/edit\`} class="button button--ghost button--sm"><PencilIcon size={16} /> Edit</Link>
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
`
}

export function feCreatePageTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  const formFields = fields
    .map((f) => {
      if (f.type === 'boolean') {
        return `          <div class="field">
            <label class="field__item" for="field-${f.name}">
              <input
                type="checkbox"
                role="switch"
                class="switch"
                id="field-${f.name}"
                checked={formData.${f.name} ?? false}
                onChange={(e) => setFormData({ ...formData, ${f.name}: (e.target as HTMLInputElement).checked })}
              />
              <span class="field__label">${f.name}</span>
            </label>
          </div>`
      }
      const typeAttr = f.type === 'number' ? 'number' : 'text'
      const requiredAttr = f.required ? '\n              required' : ''
      const valueSetter =
        f.type === 'number'
          ? `Number((e.target as HTMLInputElement).value)`
          : `(e.target as HTMLInputElement).value`
      const requiredMark = f.required ? ' <span class="text-red-500">*</span>' : ''
      return `          <div class="field">
            <label for="field-${f.name}">${f.name}${requiredMark}</label>
            <input
              class="input"
              type="${typeAttr}"
              id="field-${f.name}"
              value={formData.${f.name} ?? ''}${requiredAttr}
              onInput={(e) => setFormData({ ...formData, ${f.name}: ${valueSetter} })}
            />
          </div>`
    })
    .join('\n')

  const initialFields = fields
    .map((f) => {
      if (f.default !== undefined) {
        if (f.type === 'string') return `    ${f.name}: '${f.default}'`
        return `    ${f.name}: ${f.default}`
      }
      if (f.type === 'boolean') return `    ${f.name}: false`
      if (f.type === 'number') return `    ${f.name}: 0`
      return `    ${f.name}: ''`
    })
    .join(',\n')

  return `import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState } from 'preact/hooks'
import { useMutation, useQueryClient } from '@tanstack/preact-query'
import { useLocation } from 'wouter'
import { ${camel}Api } from '../../api/${name}'
import type { Create${Pascal} } from '../../types/${name}'

export function ${Pascal}Create() {
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Create${Pascal}>({
${initialFields},
  })

  const mutation = useMutation({
    mutationFn: (data: Create${Pascal}) => ${camel}Api.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${name}'] })
      navigate('/${name}')
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
          <h1 class="page__title">New ${Pascal}</h1>
        </div>
        <div class="page__action">
          <a href="/${name}" class="button button--neutral"><XIcon size={16} /> Cancel</a>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <form class="card" onSubmit={handleSubmit}>
            <div class="card__body">
${formFields}
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
`
}

export function feEditPageTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  const formFields = fields
    .map((f) => {
      if (f.type === 'boolean') {
        return `          <div class="field">
            <label class="field__item" for="field-${f.name}">
              <input
                type="checkbox"
                role="switch"
                class="switch"
                id="field-${f.name}"
                checked={formData.${f.name} ?? false}
                onChange={(e) => setFormData({ ...formData, ${f.name}: (e.target as HTMLInputElement).checked })}
              />
              <span class="field__label">${f.name}</span>
            </label>
          </div>`
      }
      const typeAttr = f.type === 'number' ? 'number' : 'text'
      const requiredAttr = f.required ? '\n              required' : ''
      const valueSetter =
        f.type === 'number'
          ? `Number((e.target as HTMLInputElement).value)`
          : `(e.target as HTMLInputElement).value`
      const requiredMark = f.required ? ' <span class="text-red-500">*</span>' : ''
      return `          <div class="field">
            <label for="field-${f.name}">${f.name}${requiredMark}</label>
            <input
              class="input"
              type="${typeAttr}"
              id="field-${f.name}"
              value={formData.${f.name} ?? ''}${requiredAttr}
              onInput={(e) => setFormData({ ...formData, ${f.name}: ${valueSetter} })}
            />
          </div>`
    })
    .join('\n')

  const initialFields = fields
    .map((f) => {
      if (f.default !== undefined) {
        if (f.type === 'string') return `    ${f.name}: '${f.default}'`
        return `    ${f.name}: ${f.default}`
      }
      if (f.type === 'boolean') return `    ${f.name}: false`
      if (f.type === 'number') return `    ${f.name}: 0`
      return `    ${f.name}: ''`
    })
    .join(',\n')

  return `import { XIcon, CheckIcon } from '@phosphor-icons/react'
import { useState, useEffect } from 'preact/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { useRoute, useLocation } from 'wouter'
import { ${camel}Api } from '../../api/${name}'
import type { Create${Pascal} } from '../../types/${name}'

export function ${Pascal}Edit() {
  const [, params] = useRoute('/${name}/:id/edit')
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()

  const [formData, setFormData] = useState<Create${Pascal}>({
${initialFields},
  })

  const { data: existing } = useQuery({
    queryKey: ['${name}', Number(params?.id)],
    queryFn: () => ${camel}Api.getById(Number(params!.id)),
  })

  useEffect(() => {
    if (existing) {
      const { id, createdAt, updatedAt, ...rest } = existing as Create${Pascal} & { id: number; createdAt: string; updatedAt: string }
      setFormData(rest)
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Create${Pascal}) => ${camel}Api.update(Number(params!.id), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${name}'] })
      navigate('/${name}')
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
          <h1 class="page__title">Edit ${Pascal}</h1>
        </div>
        <div class="page__action">
          <a href="/${name}" class="button button--neutral"><XIcon size={16} /> Cancel</a>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <form class="card" onSubmit={handleSubmit}>
            <div class="card__body">
${formFields}
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
`
}

export function fePagesBarrelTemplate(name: string): string {
  const Pascal = toPascalCase(name)
  return `export { ${Pascal}List } from './List'
export { ${Pascal}Create } from './Create'
export { ${Pascal}Edit } from './Edit'
`
}
