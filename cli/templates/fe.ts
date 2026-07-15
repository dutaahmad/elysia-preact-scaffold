import { toPascalCase, toCamelCase } from '../utils/name'
import type { FieldDef } from './module'

export function feClientTemplate(): string {
  return `const BASE_URL = ''

const devLog = import.meta.env.DEV
  ? (msg: string, data?: unknown) => console.log(\`[API] \${msg}\`, data ?? '')
  : () => {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET'
  const body = options?.body
  devLog(\`\${method} \${path}\`, body ? JSON.parse(body as string) : undefined)

  const start = performance.now()
  const res = await fetch(\`\${BASE_URL}\${path}\`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const duration = ((performance.now() - start) / 1000).toFixed(3)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    devLog(\`\${method} \${path} \u2192 \${res.status} (\${duration}s)\`, error)
    throw new Error(error.message || res.statusText)
  }

  const data: T = await res.json()
  devLog(\`\${method} \${path} \u2192 \${res.status} (\${duration}s)\`, data)
  return data
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

export function feAppTemplate(): string {
  return `import type { ComponentChildren } from 'preact'
import { HouseIcon, CubeIcon, CaretLeftIcon, ListIcon } from '@phosphor-icons/react'
import { cn } from './lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { Route, Switch, Link, useRoute } from 'wouter'
import { Home } from './pages/Home'
import { ThemeToggle } from './components/ThemeToggle'
// @prelysia-imports

const queryClient = new QueryClient()

function SidebarLink({ href, children }: { href: string; children: ComponentChildren }) {
  const [isActive] = useRoute(href === '/' ? '/' : href + '/:rest*')
  return (
    <li class="sidebar__item">
      <Link
        href={href}
        class={cn('sidebar__button', isActive && 'sidebar__button--active')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span>{children}</span>
      </Link>
    </li>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav class="navbar" data-stisla-navbar>
        <a class="navbar__brand" href="/">prelysia</a>
        <button class="navbar__toggle" data-stisla-navbar-toggle aria-label="Toggle navigation">
          <ListIcon size={20} />
        </button>
        <div class="navbar__menu">
          <div class="navbar__nav">
            <ThemeToggle />
          </div>
      </nav>
      <div class="app-layout">
        <aside class="sidebar" id="sidebar" data-stisla-sidebar>
          <div class="sidebar__header">
            <a class="sidebar__brand" href="/">
              <span>prelysia</span>
            </a>
          </div>
          <div class="sidebar__content">
            <div class="sidebar__menu">
              <div class="sidebar__group">
                <div class="sidebar__group-title">Main</div>
                <ul class="sidebar__list">
                  <SidebarLink href="/">
                    <HouseIcon size={20} />
                    Home
                  </SidebarLink>
                </ul>
              </div>
              <div class="sidebar__group">
                <div class="sidebar__group-title">Modules</div>
                <ul class="sidebar__list">
                  {/* @prelysia-sidebar */}
                  {/* Icon: generated links include a Cube icon — swap it for a module-specific icon */}
                </ul>
              </div>
            </div>
          </div>
          <div class="sidebar__footer">
            <button data-stisla-sidebar-toggle="collapse" class="sidebar__button" aria-controls="sidebar">
              <CaretLeftIcon size={16} />
              <span>Collapse</span>
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
  return `import { RocketIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Link } from 'wouter'

export function Home() {
  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Dashboard</h1>
          <p class="page__description">Welcome to your app</p>
        </div>
        <div class="page__action">
          <RocketIcon size={32} />
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
                <li><CheckCircleIcon size={20} /> <code>prelysia feat categories</code> — add a Categories module</li>
                <li><CheckCircleIcon size={20} /> <code>bun run dev</code> — start the dev server</li>
                <li><CheckCircleIcon size={20} /> Navigate to <a href="/categories">/categories</a> to see the CRUD UI</li>
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

export function feMainTemplate(): string {
  return `// @ts-expect-error - no type declarations for vanilla JS package
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './App'

render(<App />, document.getElementById('app')!)
`
}

export function feStyleTemplate(): string {
  return `@import "tailwindcss";
@import "@stisla/style/theme.css";
@import "@stisla/style/components.css";
@source "./src";

html, body, #app {
  height: 100%;
  margin: 0;
}
#app {
  display: flex;
  flex-direction: column;
}
.app-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
.app-main {
  flex: 1;
  overflow-y: auto;
}

`
}

export function feUseThemeTemplate(): string {
  return `import { useState, useEffect } from 'preact/hooks'

const STORAGE_KEY = 'stisla-theme'

function getInitialTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return [theme, toggle]
}
`
}

export function feThemeToggleTemplate(): string {
  return `import { SunIcon, MoonIcon } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()

  return (
    <button class={cn('button', 'button--ghost', 'button--sm')} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  )
}
`
}

export function feUtilsTemplate(): string {
  return `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
}
