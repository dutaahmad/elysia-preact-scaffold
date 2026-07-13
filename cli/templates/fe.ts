import { toPascalCase, toCamelCase } from '../utils/name'
import type { FieldDef } from './module'

export function feClientTemplate(): string {
  return `const BASE_URL = ''

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    throw new Error(error.message || res.statusText)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
`
}

export function feTypesTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)

  const selectFields = fields.map((f) => {
    const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'
    const optional = f.required ? '' : '?'
    return `  ${f.name}${optional}: ${tsType}`
  })

  const createFields = fields.map((f) => {
    const tsType = f.type === 'number' ? 'number' : f.type === 'boolean' ? 'boolean' : 'string'
    const optional = f.required ? '' : '?'
    return `  ${f.name}${optional}: ${tsType}`
  })

  return `export interface ${Pascal} {
  id: number
${selectFields.join('\n')}
  createdAt: string
  updatedAt: string
}

export interface Create${Pascal} {
${createFields.join('\n')}
}

export type Update${Pascal} = Partial<Create${Pascal}>
`
}

export function feApiTemplate(name: string, _fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  return `import { api } from './client'
import type { ${Pascal}, Create${Pascal}, Update${Pascal} } from '../types/${name}'

export const ${camel}Api = {
  getAll: () => api.get<${Pascal}[]>('/api/${name}'),
  getById: (id: number) => api.get<${Pascal}>(\`/api/${name}/\${id}\`),
  create: (data: Create${Pascal}) => api.post<${Pascal}>('/api/${name}', data),
  update: (id: number, data: Update${Pascal}) => api.patch<${Pascal}>(\`/api/${name}/\${id}\`, data),
  remove: (id: number) => api.delete<void>(\`/api/${name}/\${id}\`),
}
`
}

export function feListPageTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  const headerCells = fields.map((f) => `            <th>${f.name}</th>`).join('\n')
  const dataCells = fields.map((f) => `              <td>{item.${f.name}}</td>`).join('\n')

  return `import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
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
          <Link href="/${name}/new" class="button button--primary">Add New</Link>
        </div>
      </div>
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
                    <Link href={\`/${name}/\${item.id}/edit\`} class="button button--ghost button--sm">Edit</Link>
                    <button
                      class="button button--danger button--soft button--sm"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
`
}

export function feFormPageTemplate(name: string, fields: FieldDef[]): string {
  const Pascal = toPascalCase(name)
  const camel = toCamelCase(name)

  const formFields = fields
    .map((f) => {
      if (f.type === 'boolean') {
        return `          <div class="field">
            <label class="field__item" for="field-${f.name}">
              <span class="checkbox">
                <input
                  type="checkbox"
                  id="field-${f.name}"
                  checked={formData.${f.name} ?? false}
                  onChange={(e) => setFormData({ ...formData, ${f.name}: (e.target as HTMLInputElement).checked })}
                />
              </span>
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
      return `          <div class="field">
            <label for="field-${f.name}">${f.name}</label>
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

  return `import { useState, useEffect } from 'preact/hooks'
import { useQuery, useMutation, useQueryClient } from '@tanstack/preact-query'
import { useRoute, useLocation } from 'wouter'
import { ${camel}Api } from '../../api/${name}'
import type { Create${Pascal} } from '../../types/${name}'

export function ${Pascal}Form() {
  const [, params] = useRoute('/${name}/:id?')
  const [, navigate] = useLocation()
  const queryClient = useQueryClient()
  const isEdit = !!params?.id

  const [formData, setFormData] = useState<Create${Pascal}>({
${initialFields},
  })

  const { data: existing } = useQuery({
    queryKey: ['${name}', Number(params?.id)],
    queryFn: () => ${camel}Api.getById(Number(params!.id)),
    enabled: isEdit,
  })

  useEffect(() => {
    if (existing) {
      const { id, createdAt, updatedAt, ...rest } = existing as any
      setFormData(rest as Create${Pascal})
    }
  }, [existing])

  const mutation = useMutation({
    mutationFn: (data: Create${Pascal}) =>
      isEdit ? ${camel}Api.update(Number(params!.id), data) : ${camel}Api.create(data),
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
          <h1 class="page__title">{isEdit ? 'Edit' : 'New'} ${Pascal}</h1>
        </div>
        <div class="page__action">
          <a href="/${name}" class="button button--neutral">Cancel</a>
        </div>
      </div>
      <div class="card">
        <form onSubmit={handleSubmit}>
          <div class="card__body">
${formFields}
          </div>
          <div class="card__footer">
            <button type="submit" class="button button--primary" aria-busy={mutation.isPending || undefined}>
              {isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
`
}

export function feAppTemplate(): string {
  return `import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { Router, Route, Switch, Link, useRoute } from 'wouter'
import { Home } from './pages/Home'
// @prelysia-imports

const queryClient = new QueryClient()

function SidebarLink({ href, children }: { href: string; children: preact.ComponentChildren }) {
  const [isActive] = useRoute(href === '/' ? '/' : href + '/:rest*')
  return (
    <div class="sidebar__item">
      <Link href={href} class="sidebar__button" aria-current={isActive ? 'page' : undefined}>
        <span>{children}</span>
      </Link>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav class="navbar" data-stisla-navbar>
        <a class="navbar__brand" href="/">prelysia</a>
        <button class="navbar__toggle" data-stisla-navbar-toggle aria-label="Toggle navigation">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <div class="navbar__menu">
          <div class="navbar__nav" />
        </div>
      </nav>
      <div class="app-layout">
        <aside class="sidebar" data-stisla-sidebar>
          <div class="sidebar__header">
            <a class="sidebar__brand" href="/">
              <span>prelysia</span>
            </a>
          </div>
          <div class="sidebar__content">
            <div class="sidebar__group">
              <div class="sidebar__group-title">Main</div>
              <div class="sidebar__list">
                <SidebarLink href="/">Home</SidebarLink>
              </div>
            </div>
            <div class="sidebar__group">
              <div class="sidebar__group-title">Modules</div>
              <div class="sidebar__list">
                {/* @prelysia-sidebar */}
              </div>
            </div>
          </div>
          <div class="sidebar__footer">
            <button data-stisla-sidebar-toggle="collapse" class="button button--ghost button--sm" style="width:100%">
              Collapse
            </button>
          </div>
        </aside>
        <main class="page app-main">
          <Switch>
            <Route path="/" component={Home} />
            {/* @prelysia-routes */}
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  )
}
`
}

export function feHomeTemplate(): string {
  return `import { Link } from 'wouter'

export function Home() {
  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Dashboard</h1>
          <p class="page__description">Welcome to your app</p>
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <div class="card">
            <div class="card__body">
              <p>Your app is ready.</p>
              <p>Run <code>prelysia feat &lt;name&gt;</code> to add a new CRUD module.</p>
            </div>
          </div>
        </section>
        <section class="page__section">
          <div class="card">
            <div class="card__header">
              <div class="card__title">Quick Start</div>
            </div>
            <div class="card__body">
              <ol style="margin:0;padding-inline-start:1.25rem">
                <li><code>prelysia feat categories</code> — add a Categories module</li>
                <li><code>bun run dev</code> — start the dev server</li>
                <li>Navigate to <a href="/categories">/categories</a> to see the CRUD UI</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
`
}
