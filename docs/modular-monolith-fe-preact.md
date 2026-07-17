# Modular Monolith Frontend Architecture with Preact

> **Research Date:** 2026-07-17
> **Context:** Research for the `prelysia` scaffold project — Elysia + Preact fullstack code generator
> **Status:** Knowledge gathering only — no plans or specs

---

## Table of Contents

1. [TL;DR](#tldr)
2. [What Is a Modular Monolith Frontend?](#what-is-a-modular-monolith-frontend)
3. [How This Project Already Implements It](#how-this-project-already-implements-it)
4. [Preact-Specific Primitives for Modularity](#preact-specific-primitives-for-modularity)
   - [Signals + createModel for Domain Logic](#signals--createmodel-for-domain-logic)
   - [useModel for Component Integration](#usemodel-for-component-integration)
   - [Lazy Loading with preact-iso](#lazy-loading-with-preact-iso)
5. [Wouter for Modular Routing](#wouter-for-modular-routing)
6. [TanStack Query Preact for Per-Module Data Fetching](#tanstack-query-preact-for-per-module-data-fe)
7. [Feature-Sliced Design (FSD) — The Dominant Methodology](#feature-sliced-design-fsd--the-dominant-methodology)
   - [Layer Hierarchy](#layer-hierarchy)
   - [Slices and Segments](#slices-and-segments)
   - [The Public API Pattern](#the-public-api-pattern)
   - [Unidirectional Dependency Rule](#unidirectional-dependency-rule)
8. [Per-Module Types Pattern](#per-module-types-pattern)
9. [Boundary Enforcement Tools](#boundary-enforcement-tools)
   - [Steiger (Recommended)](#steiger-recommended)
   - [eslint-plugin-fsd-lint (Alternative)](#eslint-plugin-fsd-lint-alternative)
   - [Comparison: Steiger vs eslint-plugin-fsd-lint](#comparison-steiger-vs-eslint-plugin-fsd-lint)
10. [Sources](#sources)

---

## TL;DR

The modular monolith frontend pattern organizes code by **business domain** (not file type), with each module owning its UI, data fetching, types, and API layer. This project already implements a lightweight modular monolith via its `feat` CLI generator (per-module `types/`, `api/`, `pages/<name>/`).

Research from **context7** confirms:

- **Preact Signals + `createModel`** — first-class API for encapsulating domain logic into self-contained models with signals, computed values, and actions. Models auto-dispose via `Symbol.dispose`.
- **`wouter-preact`** — the sanctioned routing library with `useRoute` for module-scoped parameter extraction and `nest` for nested routes.
- **`@tanstack/preact-query`** — per-module `useQuery` hooks with scoped query keys.

**Feature-Sliced Design (FSD)** is the dominant methodology. Its 7-layer hierarchy (App > Pages > Widgets > Features > Entities > Shared) formalizes the modular monolith with enforced dependency direction. The `public-api` pattern (each module exports via `index.ts`) and **Steiger** (standalone linter, 58.6K weekly downloads, 18 FSD rules) are the key enforcement mechanisms.

---

## What Is a Modular Monolith Frontend?

A **modular monolith** (also called "Modulith") is a single deployable frontend application whose internal architecture is structured as independent modules. Key characteristics:

- **Single deployment** — one build, one bundle, one deploy
- **Strong internal module boundaries** — modules are isolated by convention and enforcement
- **Domain-driven organization** — code is grouped by business domain, not file type
- **Unidirectional dependency** — modules can only depend on modules "below" them
- **Public API contracts** — each module exposes only a curated surface via `index.ts`

> *"Most 'we should split into micro-frontends' conversations are actually unfinished modular-monolith work."* — [Frontend Architecture at Scale](https://github.com/sujeet-pro/sujeet.pro/blob/main/content/articles/frontend-architecture-at-scale/README.md)

The alternative — organizing by file type (`components/`, `hooks/`, `utils/`, `services/`) — breaks at scale because a single feature requires editing files across many folders, creating cognitive overhead and merge conflicts.

---

## How This Project Already Implements It

The `prelysia feat` CLI generates per-domain files following a consistent vertical-slice pattern:

```
src/
├── api/
│   ├── client.ts              # shared HTTP client (singleton)
│   └── <name>.ts              # per-module API class (CRUD endpoints)
├── types/
│   └── <name>.ts              # per-module TypeScript interfaces
└── pages/
    └── <name>/
        ├── List.tsx           # list page component
        ├── Create.tsx         # create form component
        ├── Edit.tsx           # edit form component
        └── index.ts           # barrel export (Public API pattern)
```

Each module is a self-contained vertical slice with its own:
- **Types** — `interface Todo`, `interface CreateTodo`, `type UpdateTodo`
- **API functions** — `todosApi.getAll()`, `todosApi.create(data)`, etc.
- **Page components** — `TodoList`, `TodoCreate`, `TodoEdit`
- **Public API** — `index.ts` barrel file

Adding a module = adding a folder. Removing a module = deleting a folder.

**Source:** Project template files:
- [`fe-types.ts`](/packages/prelysia/cli/templates/fe-types.ts)
- [`fe-api.ts`](/packages/prelysia/cli/templates/fe-api.ts)
- [`fe-pages.ts`](/packages/prelysia/cli/templates/fe-pages.ts)

---

## Preact-Specific Primitives for Modularity

### Signals + createModel for Domain Logic

Preact Signals v2+ has a first-class `createModel` API for building reusable, encapsulated domain models. This is the idiomatic Preact way to extract business logic from components into self-contained modules.

```js
import { signal, computed, effect, createModel } from '@preact/signals'

const TodoItemModel = createModel((text) => {
  const completed = signal(false)
  return { text, completed, toggle() { completed.value = !completed.value } }
})

const TodoListModel = createModel(() => {
  const items = signal([])
  return {
    items,
    addTodo(text) {
      const todo = new TodoItemModel(text)
      items.value = [...items.value, todo]
    },
    removeTodo(todo) {
      items.value = items.value.filter(t => t !== todo)
      todo[Symbol.dispose]()
    }
  }
})

const todoList = new TodoListModel()
todoList.addTodo('Buy groceries')
// Disposing the parent also cleans up all nested model effects
todoList[Symbol.dispose]()
```

Key features for modular monolith:
- **Encapsulation** — model owns its signals, computed values, and actions
- **Composition** — models can nest (parent disposal auto-cleans children)
- **TypeScript support** — `ReadonlySignal` pattern for enforcing read-only access externally
- **Zero dependencies on UI** — models are pure logic, testable without Preact

**Source:** [`/preactjs/preact-www` — Signals Guide](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/signals.md)

### useModel for Component Integration

The `useModel` hook handles model instantiation, lifecycle, and disposal within components:

```jsx
import { signal, createModel } from '@preact/signals'
import { useModel } from '@preact/signals'

const CounterModel = createModel((initialCount) => ({
  count: signal(initialCount),
  increment() { this.count.value++ }
}))

function Counter({ initialValue }) {
  const model = useModel(() => new CounterModel(initialValue))
  return <button onClick={() => model.increment()}>Count: {model.count}</button>
}
```

**Source:** [`/preactjs/preact-www` — useModel Guide](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/signals.md)

### Lazy Loading with preact-iso

The `lazy()` function enables code-splitting by dynamically importing components at the route level:

```jsx
import { lazy, LocationProvider, Router } from 'preact-iso'

const Profiles = lazy(() => import('./routes/profiles.js'))
const Profile = lazy(() => import('./routes/profile.js'))

function App() {
  return (
    <LocationProvider>
      <Router>
        <Home path="/" />
        <Profiles path="/profiles" />
        <Profile path="/profile/:id" />
      </Router>
    </LocationProvider>
  )
}
```

The returned component exposes a `preload()` method for eager loading on hover/focus.

**Source:** [`/preactjs/preact-www` — preact-iso Guide](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/preact-iso.md)

---

## Wouter for Modular Routing

Wouter is the routing library used in this project. For Preact, imports must use `wouter-preact` instead of `wouter`.

```diff
- import { useRoute, Route, Switch } from "wouter"
+ import { useRoute, Route, Switch } from "wouter-preact"
```

### Key APIs for Modular Monolith

| API | Purpose | Modular Monolith Use |
|---|---|---|
| `useRoute("/users/:id")` | Returns `[match, params]` | Each module page extracts its own params |
| `useLocation()` | Returns `[location, navigate]` | Navigation within/across modules |
| `Switch` | Exclusive route matching | Page-level routing in `App.tsx` |
| `Route path="/" component={Home}` | Route declaration | Module pages registered via `// @prelysia-routes` marker |
| `nest` prop | Nested route context | Module sub-routing (e.g., `/todos/:id/edit`) |

### Nested Routes

```jsx
<Route path="/app" nest>
  <Route path="/users/:id" nest>
    <Route path="/orders" />
  </Route>
</Route>
```

### Current Integration in Project

In `App.tsx`, each generated module registers its routes via marker comments:

```tsx
<Switch>
  <Route path="/" component={Home} />
  {/* @prelysia-routes */}
</Switch>
```

The `feat` command inserts route registrations at this marker. For a module named `todos`:

```tsx
<Route path="/todos" component={TodoList} />
<Route path="/todos/new" component={TodoCreate} />
<Route path="/todos/:id/edit" component={TodoEdit} />
```

**Source:** [`/molefrog/wouter` — README](https://github.com/molefrog/wouter/blob/v3/README.md)

---

## TanStack Query Preact for Per-Module Data Fetching

`@tanstack/preact-query` is the Preact-specific build of TanStack Query. It mirrors the React Query API exactly.

### Installation

```bash
bun add @tanstack/preact-query
```

### Setup (already in project)

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* routes and modules */}
    </QueryClientProvider>
  )
}
```

### Per-Module Usage

Each generated page has its own scoped query with a module-specific key:

```tsx
// pages/todos/List.tsx
const { data, isLoading, error } = useQuery({
  queryKey: ['todos'],           // module-scoped key
  queryFn: todosApi.getAll,
})

// pages/todos/Create.tsx
const mutation = useMutation({
  mutationFn: todosApi.create,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })  // invalidates same module
  },
})
```

The module-scoped query key convention (`['todos']`, `['categories']`, etc.) ensures that mutations only invalidate their own module's data — a key modularity property.

### State Management Architecture for Modular Monolith

All major sources converge on a 4-category state model:

| State Type | Tool in This Project | Modular Concern |
|---|---|---|
| **Server state** | `@tanstack/preact-query` (useQuery/useMutation) | Per-module query keys, co-located hooks |
| **URL state** | `wouter-preact` (useRoute params) | Module-scoped route params |
| **Local UI state** | `useState`/`useReducer` | Form state inside each page component |
| **Global UI state** | Signals or minimal context | Theme via `useTheme` + localStorage |

**Rule:** Default to local state until you can name why it must be shared.

**Source:** [`/tanstack/query` — Preact Quick Start](https://tanstack.com/query/v5/docs/framework/preact/quick-start.md)

---

## Feature-Sliced Design (FSD) — The Dominant Methodology

Feature-Sliced Design is the most widely adopted modular frontend methodology. It provides a standardized set of rules and conventions for organizing frontend code.

> *"FSD can be implemented in projects and teams of any size. There are no restrictions on what programming language, UI framework, or state manager you use."* — [Feature-Sliced Design Overview](https://feature-sliced.design/docs/get-started/overview)

### Layer Hierarchy

FSD defines **7 layers** (from top/most-responsibility to bottom/least):

| Layer | Responsibility | Has Slices? | In This Project |
|---|---|---|---|
| **App** | Routing, entrypoints, global styles, providers | No | `App.tsx`, `main.tsx` |
| **Processes** | (Deprecated) Multi-page flows | Yes | — |
| **Pages** | Route-level screens | Yes | `pages/<name>/` |
| **Widgets** | Large self-contained UI blocks | Yes | `components/` (sidebar, navbar) |
| **Features** | User interactions delivering business value | Yes | Could be extracted from pages |
| **Entities** | Business domain models with logic | Yes | `types/<name>.ts` + `api/<name>.ts` |
| **Shared** | Generic reusable code, UI kit, API client | No | `lib/`, `api/client.ts`, `components/` |

**Critical rule:** Modules on one layer can only import from layers strictly below. This enforces unidirectional dependency flow.

### How Layers Map to This Project

```
App (App.tsx, main.tsx, style.css)
  ↓ imports
Pages (pages/todos/List.tsx, Create.tsx, Edit.tsx)
  ↓ imports
API layer (api/todos.ts) + Types (types/todos.ts)
  ↓ imports
Shared (api/client.ts, lib/utils.ts, components/ThemeToggle.tsx)
```

This already follows FSD's dependency direction — pages import API/types, which import the shared client.

### Slices and Segments

**Slices** partition a layer by business domain. In this project:
- `pages/todos/` — one slice
- `pages/categories/` (if added) — another slice

Slices cannot import from other slices on the same layer (prevents circular dependencies).

**Segments** partition a slice by technical purpose. Conventional segment names:

| Segment | Purpose | In This Project |
|---|---|---|
| `ui/` | UI components, styles, date formatters | Pages ARE the UI (no separate segment) |
| `api/` | Backend interactions, types, mappers | `api/<name>.ts` |
| `model/` | Data model, schemas, stores, business logic | Types + Signals models |
| `lib/` | Slice-specific utilities | Not yet used |
| `config/` | Feature flags, constants | Not yet used |

**Source:** [FSD Layers Reference](https://feature-sliced.design/docs/reference/layers.md)

### The Public API Pattern

Every slice must expose a public API via `index.ts`. External consumers may only import from this file — never from internal paths.

This project already uses this:

```typescript
// pages/todos/index.ts
export { TodoList } from './List'
export { TodoCreate } from './Create'
export { TodoEdit } from './Edit'
```

This is the key mechanism that makes refactoring safe. You can rename, move, or restructure internal files without affecting consumers.

### Unidirectional Dependency Rule

FSD's most important rule:

> A module in a slice can only import other slices when they are located on layers strictly below.

Additionally:
- **Same-layer slices** cannot import each other (e.g., `todos` cannot import `categories`)
- If two slices share code, it must be **lifted down** to a lower layer (Entities or Shared)

This eliminates circular dependencies and makes the module graph predictable.

---

## Per-Module Types Pattern

**Decision:** Types should live inside each module, not in a shared `types/` directory. If a type needs to be referenced by another module, lift it to `shared/types/`.

### Current State (shared types)

```
src/types/todos.ts     ← shared directory, all modules dump types here
```

### Target State (per-module types)

```
src/
└── pages/
    └── todos/
        ├── types.ts           ← colocated with the module
        ├── api.ts             ← colocated with the module
        ├── List.tsx
        ├── Create.tsx
        ├── Edit.tsx
        └── index.ts
```

**Benefits:**
- **High cohesion** — types live with the code that uses them
- **Low coupling** — no shared types directory creates implicit dependencies
- **Explicit sharing** — lifting to `shared/types.ts` is a deliberate, visible decision
- **Deletable modules** — deleting a module folder removes everything, including types

**Rule:** If a type is referenced by more than one module, extract it to `src/shared/types/<domain>.ts` and import from there. This is FSD's "lift down" pattern.

**Source:** Consensus across multiple sources:
- [Designing Large React Applications](https://frontendprep.io/guides/react/designing-large-react-apps) — "Feature types that belong to a single domain reside inside the feature"
- [Modular Feature Design in React](https://www.codewithseb.com/blog/modular-feature-design-react-plug-and-play) — "Each feature owns its types"
- FSD layers — entities layer owns domain types

---

## Boundary Enforcement Tools

Two main tools exist for enforcing FSD boundaries in code. Both are compatible with this project's stack (TypeScript 6, Bun, Vite).

### Steiger (Recommended)

**Steiger** is a standalone file structure and project architecture linter. It is the official FSD tooling.

- **npm:** `steiger` + `@feature-sliced/steiger-plugin`
- **Weekly downloads:** 58.6K
- **Latest version:** 0.5.13 (steiger) / 0.6.0 (plugin) — updated Jun 8, 2026
- **License:** MIT
- **Standalone** — does not require ESLint

**Installation:**
```bash
bun add -D steiger @feature-sliced/steiger-plugin
```

**Usage:**
```bash
npx steiger ./src
npx steiger ./src --watch    # watch mode
```

**18 FSD rules** (key ones):

| Rule | Description | Enforces |
|---|---|---|
| `fsd/forbidden-imports` | No imports from higher layers or cross-slice | Dependency direction |
| `fsd/public-api` | Require `index.ts` public API per slice | Public API pattern |
| `fsd/no-public-api-sidestep` | Block direct internal imports | Boundary enforcement |
| `fsd/no-segmentless-slices` | Require segments within slices | Structural consistency |
| `fsd/typo-in-layer-name` | Detect misspelled layer names | Correctness |
| `fsd/insignificant-slice` | Detect unused or rarely-used slices | Code health |
| `fsd/no-cross-imports` | (Disabled by default) Block same-layer cross-imports | Isolation |

**Zero-config** — works out of the box with `fsd.configs.recommended`.

**Configuration** (via `steiger.config.ts`):
```typescript
import { defineConfig } from 'steiger'
import fsd from '@feature-sliced/steiger-plugin'

export default defineConfig([
  ...fsd.configs.recommended,
  {
    files: ['./src/shared/**'],
    rules: {
      'fsd/public-api': 'off',   // shared layer doesn't need public API
    },
  },
])
```

**Compatibility with this project:**
- ✅ TypeScript 6 — Steiger uses `tsconfck` to resolve path aliases
- ✅ Bun — runs via `bun x steiger` or `bun run steiger`
- ✅ Vite — no Vite dependency needed
- ✅ No ESLint needed — standalone tool
- ✅ Watch mode for dev workflow

**Source:** [feature-sliced/steiger — GitHub](https://github.com/feature-sliced/steiger)
- [Steiger README](https://github.com/feature-sliced/steiger/blob/master/README.md)
- [FSD Plugin README](https://github.com/feature-sliced/steiger/blob/master/packages/steiger-plugin-fsd/src/forbidden-imports/README.md)

### eslint-plugin-fsd-lint (Alternative)

An ESLint 9+ plugin for enforcing FSD rules with Flat Config support.

- **npm:** `eslint-plugin-fsd-lint`
- **ESLint 9+ only** — requires Flat Config
- **Framework-agnostic** — works with any ESLint-compatible project

**Key rules:**
- `fsd/forbidden-imports` — layer direction
- `fsd/no-cross-slice-dependency` — same-layer slice isolation
- `fsd/no-public-api-sidestep` — enforce public API imports
- `fsd/no-relative-imports` — use aliases instead of relative paths
- `fsd/no-ui-in-business-logic` — prevent UI imports in model/api/lib
- `fsd/ordered-imports` — predictable FSD import ordering

**Configuration:**
```js
export default [{
  plugins: { fsd: fsdPlugin },
  rules: {
    "fsd/forbidden-imports": "error",
    "fsd/no-cross-slice-dependency": "error",
    "fsd/no-public-api-sidestep": "error",
  },
}]
```

**Compatibility concerns for this project:**
- ⚠️ This project has **no linter** (per AGENTS.md: "No linter, no test framework")
- ⚠️ Adding ESLint just for FSD rules may be heavy
- ✅ Would work if ESLint is added in the future

**Source:** [effozen/eslint-plugin-fsd-lint — GitHub](https://github.com/effozen/eslint-plugin-fsd-lint)

### Comparison: Steiger vs eslint-plugin-fsd-lint

| Aspect | Steiger | eslint-plugin-fsd-lint |
|---|---|---|
| **Type** | Standalone linter | ESLint plugin |
| **Dependency** | None (zero-config) | Requires ESLint 9+ Flat Config |
| **Rules** | 18 FSD rules | 7 FSD rules |
| **Watch mode** | ✅ Built-in (`--watch`) | ❌ Relies on ESLint watch |
| **Maturity** | 58.6K weekly downloads, active since 2024 | Smaller community |
| **Config format** | `steiger.config.ts` (ESLint-inspired) | ESLint Flat Config |
| **Best for** | **This project** — no linter currently; standalone tool is cleaner | Projects already using ESLint 9 |

**Recommendation:** **Steiger** is the better fit for this project because:
1. No existing linter to integrate with
2. Zero-config startup
3. Standalone — one command to run, one dependency to add
4. Watch mode for dev experience
5. Larger community and more FSD rules

---

## Sources

### Preact (context7)
| Source | Description |
|---|---|
| [Signals Guide — createModel, useModel, Composition](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/signals.md) | Preact Signals v2+ createModel API, model composition, useModel hook, TypeScript ReadonlySignal pattern |
| [preact-iso lazy()](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/preact-iso.md) | Code-splitting via lazy imports with preload() support |
| [Hooks Guide](https://github.com/preactjs/preact-www/blob/master/content/en/guide/v10/hooks.md) | Custom hooks for extracting component logic into reusable functions |

### Wouter (context7)
| Source | Description |
|---|---|
| [wouter README — Preact Usage](https://github.com/molefrog/wouter/blob/v3/README.md) | `wouter-preact` import difference, `useRoute`, `useLocation`, `Switch`, nested `nest` routes |

### TanStack Query (context7)
| Source | Description |
|---|---|
| [@tanstack/preact-query Quick Start](https://tanstack.com/query/v5/docs/framework/preact/quick-start.md) | QueryClient setup, useQuery, useMutation, query invalidation for Preact |
| [@tanstack/preact-query Overview](https://tanstack.com/query/v5/docs/framework/preact/overview.md) | Full setup with loading/error/success states |

### Feature-Sliced Design
| Source | Description |
|---|---|
| [FSD Overview — layers, slices, segments](https://feature-sliced.design/docs/get-started/overview) | Official FSD introduction — 7 layers, import rules, migration strategy |
| [FSD Layers Reference](https://feature-sliced.design/docs/reference/layers.md) | Detailed layer semantics — App, Shared, Entities, Features, Widgets, Pages |
| [The Ultimate Frontend Project Structure Guide](https://feature-sliced.design/blog/frontend-structure-best-practices) | Comparison of file-type, layered, component-based, DDD, and FSD approaches |
| [Modular Frontend: The Secret to Maintainable Code](https://feature-sliced.design/blog/guide-to-modular-frontend) | Step-by-step guide to adopting modular architecture with FSD |

### Modular Feature Design
| Source | Description |
|---|---|
| [Modular Feature Design in React](https://www.codewithseb.com/blog/modular-feature-design-react-plug-and-play) | Feature-based organization, Public API pattern, dependency rules, testing |
| [Designing Large React Applications](https://frontendprep.io/guides/react/designing-large-react-apps) | Feature-based blueprint, state categories, code-splitting, ESLint boundary enforcement |
| [React Architecture Blueprint](https://wolf-tech.io/blog/react-for-front-end-a-practical-architecture-blueprint) | Module graph strategy, state model, MVRA checklist |
| [Frontend Architecture at Scale](https://github.com/sujeet-pro/sujeet.pro/blob/main/content/articles/frontend-architecture-at-scale/README.md) | Modular monolith vs micro-frontends, dependency graph health, platform surfaces |
| [Scalable Angular Frontend with Nx — Modulith](https://angular.love/beyond-clean-code-building-a-scalable-angular-frontend-architecture-with-nx-monorepos) | Nx boundary enforcement, library types (data-access, ui, feature, utility), dependency flow |
| [pnpm Monorepo FSD Architecture](https://devcheolu.com/en/posts/Wolc3BPmdOzyE5ycjodt) | Steiger integration, package-boundary enforcement, public API exports |

### Boundary Enforcement Tools
| Source | Description |
|---|---|
| [Steiger — Universal architecture linter](https://github.com/feature-sliced/steiger) | Standalone FSD linter, 18 rules, zero-config, watch mode |
| [@feature-sliced/steiger-plugin — npm](https://www.npmjs.com/package/@feature-sliced/steiger-plugin) | 58.6K weekly downloads, 16 versions, latest 0.6.0 (Jun 2026) |
| [Steiger Config Examples](https://github.com/feature-sliced/steiger/blob/master/CONFIG_EXAMPLES.md) | Configuration examples for different scenarios |
| [eslint-plugin-fsd-lint](https://github.com/effozen/eslint-plugin-fsd-lint) | ESLint 9+ alternative, 7 FSD rules, Flat Config |

### This Project
| Source | Description |
|---|---|
| [AGENTS.md](/AGENTS.md) | Project conventions — stack, entrypoints, commands, CLI reference |
| [fe-types.ts](/packages/prelysia/cli/templates/fe-types.ts) | Per-module TypeScript type generation template |
| [fe-api.ts](/packages/prelysia/cli/templates/fe-api.ts) | Per-module API class generation template |
| [fe-pages.ts](/packages/prelysia/cli/templates/fe-pages.ts) | Per-module page component generation template (List, Create, Edit) |
| [fe-entry.ts](/packages/prelysia/cli/templates/fe-entry.ts) | App shell template with router, providers, sidebar |
| [fe-client.ts](/packages/prelysia/cli/templates/fe-client.ts) | Shared HTTP client template |

---

*End of research document. Ready for Planner agent consumption.*
