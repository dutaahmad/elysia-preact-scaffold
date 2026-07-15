# Full Codebase Review — 2026-07-15

**Project:** `elysia-preact-scaffold`
**Scope:** All source, configuration, CLI, and template files
**Reviewer:** Automated code review

---

## Review Summary

| Severity      | Count |
| ------------- | ----- |
| 🔴 Blocking   | 4     |
| 🟡 Should fix | 10    |
| 🟢 Consider   | 12    |
| ✅ Positive   | 12    |

---

## Changes Since Previous Review (2026-07-14)

The commit `6af9eaf` ("fix(cli): resolve 5 critical errors found in code review") addressed **4 of 5 🔴 Critical** issues:

| Previous Issue | Status | Notes |
| -------------- | ------ | ----- |
| 🔴 1. Icon imports (wrong names) | ✅ **Resolved** | Original review was incorrect — both `House` and `HouseIcon` are valid exports from `@phosphor-icons/react` v2.x. The `Icon` suffix pattern works fine. |
| 🔴 2. Elysia module augmentation | ✅ **Resolved** | Removed `declare module 'elysia' { interface ElysiaContext { ... } }` from `server/plugins/db.ts` and `cli/templates/project.ts`. |
| 🔴 3. Duplicate `.use()` in CLI | ✅ **Resolved** | Added `if (content.includes(useLine)) return false` guard in `cli/generators/module.ts`. |
| 🔴 4. createInsertSchema syntax | ✅ **Resolved** | Replaced fragile template with single-expression schemaArgs generation in `cli/templates/module.ts`. |
| 🔴 5. CLI `__dirname` in ESM | ✅ **Resolved** | Replaced with `fileURLToPath(import.meta.url)` + `dirname()` in `cli/prelysia.ts`. |

All 🟡 and 🟢 issues from the previous review **remain open** unless noted below.

---

## 🔴 Blocking

### B1. Server type errors when actually type-checked

**Files:** `tsconfig.json:3-6`, `tsconfig.server.json`, `server/modules/todos/routes.ts:7`, `server/plugins/db.ts:4`, `server/db/utils.ts:5`

**What's wrong:** The root `tsconfig.json` does **not** reference `tsconfig.server.json`, so `tsc --noEmit` (used by most editors/CI) **never type-checks server code**. When checked with `--project tsconfig.server.json`, three real type errors surface:

```
1. server/db/utils.ts:5 — 'BuildSchema' is a type and must be imported
   using a type-only import when 'verbatimModuleSyntax' is enabled.

2. server/modules/todos/routes.ts:7 — Property 'db' does not exist on
   type '{ body: unknown; ... }'. (context type)

3. server/plugins/db.ts:4 — 'BunSQLiteDatabase' is declared but its value
   is never read.
```

This means the server codebase has been silently broken since the `declare module 'elysia'` augmentation was removed in commit `6af9eaf`.

**Fix:**

```json
// tsconfig.json — add server reference
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.server.json" }
  ]
}
```

```ts
// server/plugins/db.ts — remove unused import
// Remove this line (no longer needed without the augmentation block)
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite';
```

```ts
// server/db/utils.ts — fix type-only import
import type { BuildSchema } from 'drizzle-typebox';
//                           ^^^^ add 'type'
```

**The `db` context type error** (error 2) requires either:
- **Option A:** Restore module augmentation with the correct interface name:
  ```ts
  // server/plugins/db.ts
  declare module 'elysia' {
    interface ElysiaApp {
      db: BunSQLiteDatabase
    }
  }
  ```
- **Option B:** Add a typed wrapper for the `db` context access in routes.

---

### B2. Server `:id` routes silently accept NaN

**File:** `server/modules/todos/routes.ts:9,11,12` (and template `cli/templates/module.ts:148,150-151`)

**What's wrong:** `Number(id)` produces `NaN` for non-numeric input without any validation. A request like `GET /api/todos/abc` passes `NaN` to `getById`, which will never match a record and returns HTTP 200 with `null` body — confusing for API consumers.

**Fix:**

```ts
// server/modules/todos/routes.ts
.get('/:id', ({ todoService, params: { id }, error }) => {
  const numId = Number(id)
  if (isNaN(numId)) return error(400, 'Invalid ID')
  const todo = todoService.getById(numId)
  if (!todo) return error(404, 'Not found')
  return todo
})
```

Apply the same guard to `PATCH /:id` and `DELETE /:id`. Update the template in `cli/templates/module.ts` so all generated modules follow the same pattern.

---

### B3. `db` context type not propagating to route handlers

**File:** `server/modules/todos/routes.ts:7`

**What's wrong:** The `.decorate('db', drizzle(sqlite)).as('global')` pattern is the correct Elysia 1.x approach, but TypeScript cannot resolve the `db` type in the `.derive()` callback of a separate Elysia instance. This is because the type propagation depends on runtime `.use()` chaining that TypeScript cannot statically trace.

**Impact:** Developers get red squigglies when accessing `db` in route handlers and may resort to `as any` casts, which defeats type safety.

**Fix:** Use Elysia's standard module augmentation pattern:

```ts
// server/plugins/db.ts or a new server/types.ts
import type { BunSQLiteDatabase } from 'drizzle-orm/bun-sqlite'

declare module 'elysia' {
  interface ElysiaApp {
    db: BunSQLiteDatabase
  }
}
```

This declares the `db` decoration type explicitly so TypeScript can resolve it in all downstream `.use()` consumers.

---

### B4. CLI scaffold generates dead `server/db/` files that fail type-checking

**Files:** `cli/generators/scaffold.ts:14-21,22-89`, `server/db/model.ts`, `server/db/utils.ts`

**What's wrong:** The scaffold generator inlines the full content of `server/db/model.ts` and `server/db/utils.ts`, AND the actual source files also exist in `server/db/`. Neither file is imported by the running application — they are remnants of a prior architecture. They also fail type-checking (`BuildSchema` import error in `utils.ts`).

**Fix:** Remove `server/db/model.ts` and `server/db/utils.ts` from the project source. In the scaffold generator, reference template functions from `cli/templates/project.ts` rather than duplicating file contents inline.

---

## 🟡 Should Fix

### W1. Icon naming inconsistency across source files (NEW)

**Files:** `src/components/ThemeToggle.tsx:1`, `src/app.tsx:1`, `src/pages/Home.tsx:1`, `cli/generators/scaffold.ts:193` (inline template)

Both `Icon`-suffixed (e.g., `HouseIcon`) and bare names (e.g., `Sun`) are valid exports from `@phosphor-icons/react`. However, the codebase is inconsistent:

| File | Pattern |
|------|---------|
| `src/app.tsx` | `CaretLeftIcon`, `ParagraphIcon`, `HouseIcon`, `ListIcon` (with `Icon`) |
| `src/pages/Home.tsx` | `CheckCircleIcon` (with `Icon`) |
| `src/components/ThemeToggle.tsx` | `Sun`, `Moon` (without `Icon`) |
| Scaffold inline ThemeToggle | `Sun`, `Moon` (without `Icon`) |
| Generated templates | All with `Icon` suffix |

**Fix:** Standardize on one pattern. The generated templates already use `Icon` suffix consistently, so align `ThemeToggle.tsx` and the scaffold inline template:

```tsx
// src/components/ThemeToggle.tsx
import { SunIcon, MoonIcon } from '@phosphor-icons/react'
// ... usage:
{theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
```

Also update the inlined template in `cli/generators/scaffold.ts:193`.

---

### W2. Theme flash on initial load (Unresolved from previous review)

**File:** `src/hooks/useTheme.ts:12-16` (and scaffold duplicate at same lines)

**What's wrong:** The theme `dataset.theme` is set inside `useEffect`, which fires **after** the first paint. Users see the default (light) theme before it switches to dark mode.

**Fix:** Apply the theme synchronously before mount:

```ts
function getInitialTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  const theme =
    stored === 'dark' || stored === 'light'
      ? stored
      : window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
  document.documentElement.dataset.theme = theme  // apply before mount
  return theme
}
```

Since `useState(getInitialTheme)` calls the initializer synchronously, this runs before the first render. The `useEffect` can remain as a fallback for subsequent changes.

---

### W3. `preact.ComponentChildren` used without import (Unresolved)

**File:** `src/app.tsx:11` (and template `cli/templates/fe.ts:293`)

**What's wrong:** `preact.ComponentChildren` references the `preact` module namespace, but `preact` is never imported. With `verbatimModuleSyntax: true`, this should be a type error.

**Fix:**

```tsx
import type { ComponentChildren } from 'preact'

function SidebarLink({ href, children }: { href: string; children: ComponentChildren }) {
```

Update both the source file and the `feAppTemplate()` in `cli/templates/fe.ts`.

---

### W4. `as any` cast in generated form template (Unresolved)

**File:** `cli/templates/fe.ts:232`

**What's wrong:** The generated form component casts `existing as any` then `rest as Create${Pascal}`, completely bypassing type safety.

**Fix:** Generate explicit destructuring with known field names:

```ts
useEffect(() => {
  if (existing) {
    setFormData({
${destructuredFields}
    })
  }
}, [existing])
```

Where `${destructuredFields}` is generated by the template knowing each field name and type.

---

### W5. `UpdateTodo` spread can overwrite timestamps (Unresolved)

**File:** `server/modules/todos/service.ts:22` (and template `cli/templates/module.ts:123`)

**What's wrong:** The spread `{ ...data, updatedAt: new Date().toISOString() }` can be overwritten if `data` contains an `updatedAt` or `createdAt` field (since `UpdateTodo = Partial<CreateTodo>` includes them).

**Fix:**

```ts
const { createdAt: _createdAt, updatedAt: _updatedAt, ...cleanData } = data
return db.update(todos)
  .set({ ...cleanData, updatedAt: new Date().toISOString() })
  .where(eq(todos.id, id))
  .returning()
  .get()
```

---

### W6. No `onError` handler for missing resources (Unresolved)

**File:** `server/modules/todos/routes.ts:9,11,12` (and template `cli/templates/module.ts`)

**What's wrong:** When `getById`, `update`, or `remove` return `undefined`, Elysia serializes it as HTTP 200 with `null` body. Wouter/Elysia routes lack proper error responses for not-found cases.

**Fix:** All CRUD routes should return explicit error codes. See B2 for the `getById` pattern. Apply similarly to `update` and `remove`:

```ts
.patch('/:id', ({ todoService, params: { id }, body, error }) => {
  const numId = Number(id)
  if (isNaN(numId)) return error(400, 'Invalid ID')
  const updated = todoService.update(numId, body)
  if (!updated) return error(404, 'Not found')
  return updated
})
```

---

### W7. Massive code duplication in scaffold generator (Unresolved)

**File:** `cli/generators/scaffold.ts:14-89,154-214`

**What's wrong:** The scaffold generator inlines full file contents rather than calling template functions:

| Inlined content | Should use |
|----------------|------------|
| `server/db/model.ts` (lines 14-21) | A new template function or remove entirely |
| `server/db/utils.ts` (lines 22-89) | A new template function or remove entirely |
| `src/hooks/useTheme.ts` (lines 154-192) | A new `feThemeHookTemplate()` |
| `src/components/ThemeToggle.tsx` (lines 193-206) | A new `feThemeToggleTemplate()` |
| `src/lib/utils.ts` (lines 208-214) | A new `feUtilsTemplate()` |

This means changes to `useTheme.ts` or `ThemeToggle.tsx` are not reflected in scaffolded projects.

**Fix:** Extract template functions into `cli/templates/fe.ts` (or a new `cli/templates/project.ts`) and call them from `scaffold.ts`, matching the existing pattern for `feClientTemplate()`, `feAppTemplate()`, etc.

---

### W8. CLI name utilities lack input validation (Unresolved)

**File:** `cli/utils/name.ts:1-18`

**What's wrong:** Name utilities (`toPascalCase`, `toCamelCase`, `toKebabCase`) assume clean kebab-case input. Consecutive hyphens (`hello--world`), leading/trailing hyphens, or mixed formats produce unexpected results.

**Fix:** Add input sanitization at the command handler level:

```ts
// In feat.ts / init.ts
function sanitizeModuleName(input: string): string {
  return input.replace(/[^a-zA-Z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
}
```

---

### W9. No try/catch for CLI file operations (Unresolved)

**Files:** `cli/commands/feat.ts`, `cli/commands/init.ts`

**What's wrong:** Functions like `readText`, `writeText`, `writeFileTree` are called without try/catch. A permissions error or disk-full causes an unhelpful crash.

**Fix:**

```ts
try {
  await generateModule(targetDir, name, { feOnly: options.feOnly ?? false })
} catch (err) {
  console.error('Failed to generate module:', err instanceof Error ? err.message : err)
  process.exit(1)
}
```

Apply the same pattern to `initAction`.

---

### W10. `BuildSchema` type import violation (NEW)

**File:** `server/db/utils.ts:5`

**What's wrong:** `BuildSchema` from `drizzle-typebox` is imported as a value but it is a type. With `verbatimModuleSyntax: true`, TypeScript enforces `import type { BuildSchema }`.

**Fix:**

```ts
import type { BuildSchema } from 'drizzle-typebox'
```

---

## 🟢 Consider

### C1. `index.html` title is still "preact-app" (Unresolved)

**File:** `index.html:7`

The AGENTS.md explicitly calls this out. Update to your actual project name (e.g., `<title>Elysia Preact Scaffold</title>`).

---

### C2. `tsconfig.server.json` uses deprecated `"bun-types"` (Unresolved)

**File:** `tsconfig.server.json:7`

Bun 1.3+ deprecated `bun-types` in favor of `@types/bun`, which is already installed:

```json
"types": ["@types/bun"]
```

---

### C3. Inline styles instead of Tailwind/Stisla (Unresolved)

**File:** `src/pages/Home.tsx:27`, `cli/templates/fe.ts:399`

```tsx
<ol style="margin:0;padding-inline-start:1.25rem">
```

Use Tailwind classes: `class="m-0 ps-5"`.

---

### C4. Brand text inconsistency: "relysia" vs "prelysia" (Unresolved)

**Files:** `src/app.tsx:32`, `cli/templates/fe.ts` (`feAppTemplate()`)

- Actual source: `<p>relysia</p>`
- Generated template: `<a ...>prelysia</a>`

---

### C5. Top-level `await` inside `if` block (Unresolved)

**File:** `server/index.ts:13-19`

The conditional `staticPlugin` inside an `if` block using `await` is valid in Bun but could be clearer. Consider extracting the plugin outside the chain.

---

### C6. Hardcoded dependency versions (Unresolved)

**File:** `cli/generators/scaffold.ts:271-293`

Version strings like `"^1.4.2"` for `@elysia/cors` are hardcoded. Read the current project's `package.json` and use those versions.

---

### C7. `@source "./src"` with Tailwind v4 (Unresolved)

**File:** `src/style.css:4`

The `@source` directive is a Tailwind v4 feature but its exact API requirements may differ. Verify this works correctly with `tailwindcss ^4.1.7`.

---

### C8. Missing `documents` directory for `drizzle-kit` (NEW)

**File:** `package.json` scripts, `drizzle.config.ts`

The `db:generate` script runs `drizzle-kit generate` but there's no `out` directory configured. Drizzle Kit may write migration files to a default `drizzle/` directory, which is in `.gitignore`. Consider explicitly configuring the output directory.

---

### C9. `.env.example` contains unrelated ClickUp secrets (NEW)

**File:** `.env.example`

The file contains `CLICKUP_TOKEN`, `CLICKUP_USER_ID`, and `CLICKUP_TEAM_ID` — unrelated to the project. Replace with actual required env vars:

```
PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
```

---

### C10. `vite.config.ts` may have untyped import (NEW)

**File:** `vite.config.ts:1`

```ts
import tailwindcss from '@tailwindcss/vite'
```

If this package lacks type declarations, it may cause type errors when checking with `tsconfig.node.json`. Verify or add `@ts-expect-error`.

---

### C11. `clsx` import uses inline `type` keyword (NEW)

**File:** `src/lib/utils.ts:1`

```ts
import { type ClassValue, clsx } from 'clsx'
```

While valid, the inline `type` is a less common pattern. Consider separating:

```ts
import { clsx } from 'clsx'
import type { ClassValue } from 'clsx'
```

---

### C12. Missing `/api/health` endpoint (NEW)

No health-check endpoint exists. For production deployments (container orchestration, load balancers), a simple `GET /api/health → 200 OK` endpoint is useful.

---

## ✅ Things Done Well

### Architecture & Maintainability

- **6-file module pattern** (`schema.ts`, `types.ts`, `model.ts`, `service.ts`, `routes.ts`, `index.ts`) is clean, modular, and enforces separation of concerns.
- **Service factory pattern** (`createService(db) => ({...})`) with `.derive({ as: 'scoped' })` is idiomatic Elysia DI — services are testable without HTTP.
- **CLI marker comments** (`@prelysia-imports`, `@prelysia-sidebar`, `@prelysia-routes`) are a pragmatic codegen approach that avoids AST parsing.
- **Template functions** in `cli/templates/` are well-organized and export `FieldDef` as a shared interface.

### TypeScript Practices

- **Full `verbatimModuleSyntax: true` compliance** (except `server/db/utils.ts`).
- **`erasableSyntaxOnly: true`** — no enums, parameter properties, or namespaces.
- **`drizzle-typebox` intermediate variable** pattern avoids infinite type instantiation.
- **`tsconfig.app.json`** properly aliases `react` → `preact/compat`.

### Backend

- `PRAGMA journal_mode = WAL` is a SQLite performance best practice.
- Drizzle schema uses modern patterns (`$defaultFn`, `{ mode: 'boolean' }`).
- Clean separation: `server/config.ts` centralizes environment configuration.
- Router-based plugin composition (`server/index.ts` chains `.use()` cleanly).

### Frontend

- `@tanstack/preact-query` wraps the entire app correctly via `QueryClientProvider`.
- `wouter` routes use idiomatic `useRoute` for active link detection and `useLocation` for navigation.
- Generated list pages handle loading, error, and empty states.
- `cn()` utility with `clsx` + `tailwind-merge` is the correct approach.
- Theme system with localStorage persistence and system preference detection is well-implemented.
- Stisla + Tailwind separation (Stisla for structure, Tailwind for spacing/sizing) is well thought out.

### CLI

- Interactive field collection with validation is user-friendly.
- `--fe-only` flag provides flexibility for FE-only generation.
- `readFileTree`/`writeFileTree` in `cli/utils/fs.ts` are clean abstractions.

### Configuration & Hygiene

- `.env` is in `.gitignore` (no secret leakage).
- Vite proxy configuration for `/api` → `localhost:3000` is correct.
- Clean separation of tsconfigs for app, node, and server targets.
- No `console.log` or `debugger` statements in application code.
- No unused imports across frontend code.

---

## Priority Action Items

| Priority | Issue | File(s) | Effort |
| -------- | ----- | ------- | ------ |
| **P0** | Fix server type errors (add tsconfig ref, fix 3 type errors) | `tsconfig.json`, `server/plugins/db.ts`, `server/db/utils.ts`, `server/modules/todos/routes.ts` | 20 min |
| **P0** | Add `isNaN` guard on all `:id` routes | `server/modules/todos/routes.ts`, `cli/templates/module.ts` | 10 min |
| **P1** | Restore `ElysiaApp` module augmentation for `db` type | `server/plugins/db.ts` | 2 min |
| **P1** | Standardize icon naming (ThemeToggle → Icon suffix) | `src/components/ThemeToggle.tsx`, `cli/generators/scaffold.ts` | 5 min |
| **P1** | Fix theme flash (synchronous `dataset.theme` set) | `src/hooks/useTheme.ts`, `cli/generators/scaffold.ts` | 5 min |
| **P1** | Add `ComponentChildren` explicit import | `src/app.tsx`, `cli/templates/fe.ts` | 2 min |
| **P2** | Remove dead `server/db/model.ts` + `utils.ts` | `server/db/model.ts`, `server/db/utils.ts` | 5 min |
| **P2** | Fix `UpdateTodo` timestamp spread | `server/modules/todos/service.ts`, `cli/templates/module.ts` | 5 min |
| **P2** | Add `onError` handlers for 404/400 responses | `server/modules/todos/routes.ts`, `cli/templates/module.ts` | 15 min |
| **P2** | Replace inline styles with Tailwind classes | `src/pages/Home.tsx`, `cli/templates/fe.ts` | 5 min |
| **P3** | Eliminate code duplication in scaffold generator | `cli/generators/scaffold.ts`, `cli/templates/fe.ts` | 30 min |
| **P3** | Read dependency versions from `package.json` | `cli/generators/scaffold.ts` | 15 min |
| **P3** | Fix brand text inconsistency | `src/app.tsx`, `cli/templates/fe.ts` | 2 min |
| **P3** | Add try/catch to CLI commands | `cli/commands/feat.ts`, `cli/commands/init.ts` | 15 min |
| **P3** | Clean up `.env.example` | `.env.example` | 2 min |

---

## Previous Issues Status Summary

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 Critical | Icon imports (was false positive) | ✅ **Valid** — both patterns work |
| 2 | 🔴 Critical | Elysia module augmentation | ✅ **Fixed** — removed dead code (but exposed B3) |
| 3 | 🔴 Critical | Duplicate `.use()` in CLI | ✅ **Fixed** |
| 4 | 🔴 Critical | createInsertSchema syntax | ✅ **Fixed** |
| 5 | 🔴 Critical | CLI `__dirname` | ✅ **Fixed** |
| 6 | 🟡 Warning | Dead code in `server/db/` | ❌ **Open** |
| 7 | 🟡 Warning | Code duplication in scaffold | ❌ **Open** |
| 8 | 🟡 Warning | Theme flash | ❌ **Open** |
| 9 | 🟡 Warning | `:id` validation (now B2) | ❌ **Open** (promoted to 🔴) |
| 10 | 🟡 Warning | `ComponentChildren` import | ❌ **Open** |
| 11 | 🟡 Warning | `as any` in form template | ❌ **Open** |
| 12 | 🟡 Warning | `UpdateTodo` timestamp spread | ❌ **Open** |
| 13 | 🟡 Warning | CLI name edge cases | ❌ **Open** |
| 14 | 🟢 Suggestion | `index.html` title | ❌ **Open** |
| 15 | 🟢 Suggestion | tsconfig.server.json reference (now B1) | ❌ **Open** (promoted to 🔴) |
| 16 | 🟢 Suggestion | Inline styles | ❌ **Open** |
| 17 | 🟢 Suggestion | Top-level await | ❌ **Open** |
| 18 | 🟢 Suggestion | Brand text inconsistency | ❌ **Open** |
| 19 | 🟢 Suggestion | Missing `onError` handler (now W6) | ❌ **Open** (promoted to 🟡) |
| 20 | 🟢 Suggestion | Hardcoded deps | ❌ **Open** |
| 21 | 🟢 Suggestion | No try/catch CLI (now W9) | ❌ **Open** (promoted to 🟡) |
| 22 | 🟢 Suggestion | `@source "./src"` | ❌ **Open** |
| 23 | 🟢 Suggestion | `"bun-types"` → `"@types/bun"` | ❌ **Open** |

---

_Generated 2026-07-15 via automated code review._
