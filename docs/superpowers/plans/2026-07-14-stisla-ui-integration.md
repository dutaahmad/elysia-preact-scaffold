# Stisla UI Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Stisla UI (`@stisla/vanilla`) into the Elysia + Preact scaffold — all generated page templates use Stisla CSS classes, and the CLI gains `--fe-only` flag + auto-updating sidebar.

**Architecture:** Stisla is a CSS component system (vanilla, no framework-specific JS). Import its CSS + JS in `main.tsx`, apply class names on Preact elements. A thin `src/style.css` provides the app shell layout (flex sidebar + page). Two new comment-markers (`@prelysia-sidebar`) track sidebar nav items alongside existing `@prelysia-imports` and `@prelysia-routes`.

**Tech Stack:** Preact 10, @stisla/vanilla ^3.0.0, wouter, @tanstack/preact-query

## Global Constraints

- All Stisla class names from the design spec must be used verbatim
- No icons — buttons and sidebar are text-only
- No `preact/compat` — use native Preact with CSS classes only
- `@stisla/vanilla` goes into generated project deps, NOT CLI tool deps
- `updateAppFile()` must be idempotent (skip if import already exists)
- Sidebar links use wouter `<Link>` with manual `aria-current="page"` via `useRoute`

---

### Task 1: Rewrite FE templates with Stisla classes

**Files:**
- Modify: `cli/templates/fe.ts`

- [ ] **Step 1: Rewrite `feAppTemplate()` — Navbar + Sidebar + Page shell**

Replace entire `feAppTemplate()` with the new Stisla layout template:

```
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
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
```

- [ ] **Step 2: Rewrite `feHomeTemplate()` — Stisla dashboard**

```
import { Link } from 'wouter'

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
```

- [ ] **Step 3: Rewrite `feListPageTemplate()` — Stisla .page + .card + .table**

Replace with:

```typescript
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
```

- [ ] **Step 4: Rewrite `feFormPageTemplate()` — Stisla .page + .card + .field + .input**

Replace with:

```typescript
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
```

- [ ] **Step 5: Delete unused template exports or mark as unchanged**

Keep: `feClientTemplate`, `feTypesTemplate`, `feApiTemplate` unchanged.

- [ ] **Step 6: Verify TypeScript compiles**

Run: `bun x tsc --noEmit --project tsconfig.app.json 2>&1 | head -20`
Expected: no errors (or only unrelated ones)

- [ ] **Step 7: Commit**

```
git add cli/templates/fe.ts
git commit -m "feat(cli): rewrite FE templates with Stisla UI classes"
```

---

### Task 2: Update scaffold generator for Stisla

**Files:**
- Modify: `cli/generators/scaffold.ts`

- [ ] **Step 1: Add `@stisla/vanilla` to generated project deps**

In the `deps` object, add: `'@stisla/vanilla': '^3.0.0'`

- [ ] **Step 2: Add Stisla imports to generated main.tsx**

The scaffold currently doesn't generate `main.tsx` directly (uses Vite template). Instead, modify the scaffold to write `src/main.tsx` with Stisla imports, or add a post-scaffold step. Actually, the scaffold uses Vite's template for `index.html` and the scaffold writes the `src/` files. Let me check — looking at scaffold.ts, it writes custom templates for `src/api/client.ts`, `src/pages/Home.tsx`, `src/App.tsx`. It does NOT write `src/main.tsx` — that's from the Vite Preact template.

So I need to add `src/main.tsx` to the scaffold's `files` object. The Vite template generates `src/main.tsx` with basic Preact render. The scaffold should overwrite it to add Stisla imports.

Add to the `files` object:
```typescript
files['src/main.tsx'] = `import '@stisla/vanilla/dist/stisla.css'
import '@stisla/vanilla'
import { render } from 'preact'
import { App } from './app'

render(<App />, document.getElementById('app')!)
`
```

- [ ] **Step 3: Add `src/style.css` to generated files**

```typescript
files['src/style.css'] = `html, body, #app {
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
```

- [ ] **Step 4: Ensure App.tsx imports style.css**

The scaffold writes `src/App.tsx` via `feAppTemplate()`. The App template should import `./style.css` at the top. Add this import to `feAppTemplate()`.

Actually, it's better to import style.css in `main.tsx` alongside the Stisla imports. Let me add it there instead.

Wait, looking at the current scaffold - the Vite template generates `src/main.tsx` which imports `./index.css`. If we're replacing both `index.css` and `app.css` with `style.css`, we need to make sure it's imported. Add to `src/main.tsx`:
```tsx
import './style.css'
```

Add to the scaffold's main.tsx template:
```typescript
files['src/main.tsx'] = `import '@stisla/vanilla/dist/stisla.css'
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './app'

render(<App />, document.getElementById('app')!)
`
```

- [ ] **Step 5: Commit**

```
git add cli/generators/scaffold.ts
git commit -m "feat(cli): add Stisla deps and templates to scaffold"
```

---

### Task 3: Update this project's source files

**Files:**
- Modify: `src/App.tsx`, `src/pages/Home.tsx`, `src/main.tsx`
- Create: `src/style.css`
- Delete: `src/index.css`, `src/app.css`

- [ ] **Step 1: Replace `src/App.tsx` with new Stisla shell**

Use the same content as `feAppTemplate()` from Task 1.

- [ ] **Step 2: Replace `src/pages/Home.tsx` with Stisla dashboard**

Use the same content as `feHomeTemplate()` from Task 1.

- [ ] **Step 3: Replace `src/main.tsx` with Stisla imports + style.css import**

```tsx
import '@stisla/vanilla/dist/stisla.css'
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './app'

render(<App />, document.getElementById('app')!)
```

- [ ] **Step 4: Create `src/style.css` with layout CSS**

```css
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
```

- [ ] **Step 5: Delete `src/index.css` and `src/app.css`**

- [ ] **Step 6: Verify dev server starts**

Run: `cd /Users/nahdidutaahmad/Code.nosync/elysia-preact-scaffold && bun run dev:fe & sleep 5 && curl -s http://localhost:5173 | head -20`
Expected: Vite serves the app with Stisla CSS loaded

- [ ] **Step 7: Commit**

```
git add src/App.tsx src/pages/Home.tsx src/main.tsx src/style.css
git rm src/index.css src/app.css
git commit -m "feat: apply Stisla UI shell to project source files"
```

---

### Task 4: Add `--fe-only` flag to CLI

**Files:**
- Modify: `cli/prelysia.ts`, `cli/commands/feat.ts`, `cli/generators/module.ts`

- [ ] **Step 1: Add `--fe-only` option in `cli/prelysia.ts`**

```typescript
program
  .command('feat')
  .description('Generate a new module with CRUD routes')
  .argument('<name>', 'Feature name (kebab-case)')
  .option('--fe-only', 'Only generate FE assets (types, api, pages)')
  .action((name, options) => featAction(name, options))
```

- [ ] **Step 2: Update `cli/commands/feat.ts` — pass `feOnly` flag**

```typescript
export async function featAction(
  name: string,
  options: { cwd?: string; feOnly?: boolean } = {},
): Promise<void> {
  const targetDir = options.cwd || process.cwd()
  const serverPath = join(targetDir, 'server')

  if (!options.feOnly) {
    if (!pathExists(serverPath)) {
      console.error('Error: No server/ directory found. Run prelysia init first.')
      process.exit(1)
    }
  }

  const srcPath = join(targetDir, 'src')
  if (!pathExists(srcPath)) {
    console.error('Error: No src/ directory found. Run prelysia init first.')
    process.exit(1)
  }

  const appPath = join(srcPath, 'App.tsx')
  if (pathExists(appPath)) {
    const content = await readText(appPath)
    if (!content.includes('@prelysia-routes')) {
      console.error('Error: src/App.tsx is missing FE foundation markers. Run prelysia init first.')
      process.exit(1)
    }
  } else {
    console.error('Error: No src/App.tsx found. Run prelysia init first.')
    process.exit(1)
  }

  await generateModule(targetDir, name, { feOnly: options.feOnly ?? false })
}
```

- [ ] **Step 3: Update `cli/generators/module.ts` — update `generateModule()` signature and logic**

```typescript
export async function generateModule(
  basePath: string,
  featureName: string,
  options?: { feOnly?: boolean },
): Promise<void> {
  const moduleName = toKebabCase(featureName)
  const serverPath = join(basePath, 'server')
  const moduleDir = join('modules', moduleName)
  const fields = await collectFields()

  const camelName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const pascalName = toPascalCase(moduleName)

  // Server files
  if (!options?.feOnly) {
    const files: Record<string, string> = {
      [join(moduleDir, 'schema.ts')]: schemaTemplate(moduleName, fields),
      [join(moduleDir, 'types.ts')]: typesTemplate(moduleName),
      [join(moduleDir, 'model.ts')]: modelTemplate(moduleName, fields),
      [join(moduleDir, 'service.ts')]: serviceTemplate(moduleName),
      [join(moduleDir, 'routes.ts')]: routesTemplate(moduleName),
      [join(moduleDir, 'index.ts')]: indexTemplate(moduleName),
    }
    await writeFileTree(serverPath, files)

    await updateDbSchema(serverPath, moduleName)
    await updateServerIndex(serverPath, moduleName, camelName)
  }

  // FE files
  const feFiles: Record<string, string> = {
    [`src/types/${moduleName}.ts`]: feTypesTemplate(moduleName, fields),
    [`src/api/${moduleName}.ts`]: feApiTemplate(moduleName, fields),
    [`src/pages/${moduleName}/List.tsx`]: feListPageTemplate(moduleName, fields),
    [`src/pages/${moduleName}/Form.tsx`]: feFormPageTemplate(moduleName, fields),
  }
  await writeFileTree(basePath, feFiles)

  await updateAppFile(basePath, moduleName, camelName, pascalName)

  // Console output
  if (!options?.feOnly) {
    console.log(`\nGenerated module: ${moduleName}`)
    for (const rel of Object.keys(files)) {
      console.log(`  ✓ ${join(serverPath, rel)}`)
    }
  } else {
    console.log(`\nGenerated FE assets: ${moduleName}`)
  }
  for (const [rel] of Object.entries(feFiles)) {
    console.log(`  ✓ ${join(basePath, rel)}`)
  }
  if (!options?.feOnly) {
    console.log('  ✓ Updated server/db/schema.ts')
    console.log('  ✓ Updated server/index.ts')
  }
  console.log('  ✓ Updated src/App.tsx')
}
```

- [ ] **Step 4: Verify CLI help output**

Run: `bun run cli/prelysia.ts feat --help`
Expected: shows `--fe-only` option

- [ ] **Step 5: Commit**

```
git add cli/prelysia.ts cli/commands/feat.ts cli/generators/module.ts
git commit -m "feat(cli): add --fe-only flag to feat command"
```

---

### Task 5: Implement sidebar insertion in App.tsx

**Files:**
- Modify: `cli/generators/module.ts`

- [ ] **Step 1: Rename `updateAppRoutes()` to `updateAppFile()` and handle 3 markers**

Replace the existing `updateAppRoutes()` function with:

```typescript
async function updateAppFile(basePath: string, moduleName: string, pascalName: string): Promise<boolean> {
  const appPath = join(basePath, 'src', 'App.tsx')
  if (!pathExists(appPath)) return false

  const content = await readText(appPath)
  const lines = content.split('\n')

  const importLine = `import { ${pascalName}List, ${pascalName}Form } from './pages/${moduleName}'`

  const sidebarItem = `                <SidebarLink href="/${moduleName}">${pascalName}</SidebarLink>`

  const routeLines = [
    `          <Route path="/${moduleName}" component={${pascalName}List} />`,
    `          <Route path="/${moduleName}/new" component={${pascalName}Form} />`,
    `          <Route path="/${moduleName}/:id/edit" component={${pascalName}Form} />`,
  ]

  // Skip if already present
  if (content.includes(importLine)) return false

  let modified = false

  // 1. Insert import after @prelysia-imports
  const importMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-imports'))
  if (importMarkerIdx >= 0) {
    lines.splice(importMarkerIdx + 1, 0, importLine)
    modified = true
  }

  // 2. Insert sidebar item before @prelysia-sidebar
  const sidebarMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-sidebar'))
  if (sidebarMarkerIdx >= 0) {
    lines.splice(sidebarMarkerIdx, 0, sidebarItem)
    modified = true
  }

  // 3. Insert routes before @prelysia-routes
  const routesMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-routes'))
  if (routesMarkerIdx >= 0) {
    lines.splice(routesMarkerIdx, 0, ...routeLines)
    modified = true
  }

  if (!modified) return false

  await writeText(appPath, lines.join('\n'))
  return true
}
```

- [ ] **Step 2: Update the call site in `generateModule()`**

Change `await updateAppRoutes(basePath, moduleName, pascalName)` to `await updateAppFile(basePath, moduleName, pascalName)`.

- [ ] **Step 3: Verify output with a test**

Run: create temp dir, scaffold it, run `prelysia feat categories`, check that App.tsx has:
  - Import for pages/categories
  - SidebarLink for categories
  - Route entries for /categories

- [ ] **Step 4: Commit**

```
git add cli/generators/module.ts
git commit -m "feat(cli): add sidebar insertion via @prelysia-sidebar marker"
```

---

### Task 6: Final verification

**Files:** None

- [ ] **Step 1: Run TypeScript check**

`bun x tsc --noEmit --project tsconfig.app.json 2>&1`
Expected: no errors

- [ ] **Step 2: Verify CLI commands still work**

`bun run cli/prelysia.ts --help`
`bun run cli/prelysia.ts feat --help`

- [ ] **Step 3: Start dev server and check it loads**

`bun run dev:fe &` then `curl http://localhost:5173` — verify HTML contains Stisla class names

- [ ] **Step 4: Full end-to-end test**

Create temp dir, scaffold with init, verify files exist, run feat with and without --fe-only, verify output.

- [ ] **Step 5: Final commit with all outstanding changes**

```
git add -A
git commit -m "feat: complete Stisla UI integration + --fe-only CLI flag"
```
