# Full Codebase Review — 2026-07-14

**Project:** `elysia-preact-scaffold`
**Scope:** All source, configuration, CLI, and template files
**Reviewer:** Automated code review

---

## Review Summary

| Severity      | Count |
| ------------- | ----- |
| 🔴 Error      | 5     |
| 🟡 Warning    | 8     |
| 🟢 Suggestion | 10    |
| ✅ Positive   | 10    |

---

## 🔴 Critical Errors

### 1. Phosphor icons imported with wrong names

**Files:** `src/app.tsx:1`, `src/pages/Home.tsx:1`

`@phosphor-icons/react` v2.x exports components **without** the `Icon` suffix. These imports will fail at runtime/build time.

```ts
// ❌ Wrong — Icon suffix does not exist
import {
  CaretLeftIcon,
  ParagraphIcon,
  HouseIcon,
  ListIcon,
} from "@phosphor-icons/react";
import { CheckCircleIcon } from "@phosphor-icons/react";

// ✅ Correct
import { CaretLeft, Paragraph, House, List } from "@phosphor-icons/react";
import { CheckCircle } from "@phosphor-icons/react";
```

**Impact:** Build failure / runtime error. Every usage of these icon components must also be renamed.

**Affected files:**

- `src/app.tsx` — `CaretLeftIcon` → `CaretLeft`, `ParagraphIcon` → `Paragraph`, `HouseIcon` → `House`, `ListIcon` → `List`
- `src/pages/Home.tsx` — `CheckCircleIcon` → `CheckCircle`

---

### 2. Elysia module augmentation references non-existent interface

**File:** `server/plugins/db.ts:14-17`
**Also in template:** `cli/templates/project.ts:52`

```ts
// ❌ Wrong — ElysiaContext does not exist in Elysia 1.x
declare module "elysia" {
  interface ElysiaContext {
    db: BunSQLiteDatabase;
  }
}

// ✅ Correct pattern for Elysia 1.4+
declare module "elysia" {
  interface ElysiaApp {
    db: BunSQLiteDatabase;
  }
}
```

However, since `.decorate('db', drizzle(sqlite)).as('global')` is used, the type is **automatically propagated** to all contexts. The entire module augmentation block may be unnecessary.

**Impact:** TypeScript may not recognize `db` on the context in route handlers, or the augmentation silently fails to merge.

---

### 3. Server index updater can insert duplicate `.use()` lines

**File:** `cli/generators/module.ts:108-115`

The `updateServerIndex()` function checks `if (content.includes(importLine))` to prevent duplicate imports, but **never checks** for the `.use(camelNameModule)` line. Running `prelysia feat` twice for the same module name inserts duplicate `.use()` chains.

```ts
// The dedup check:
if (content.includes(importLine)) return false;

// But .use() is inserted unconditionally:
const insertIdx = staticIdx >= 0 ? staticIdx : listenIdx >= 0 ? listenIdx : -1;
if (insertIdx > 0) {
  lines.splice(insertIdx, 0, useLine);
}
```

**Fix:**

```ts
if (content.includes(useLine)) return false;
```

---

### 4. Template generates potentially invalid `createInsertSchema` syntax

**File:** `cli/templates/module.ts:86`

The `overrideBlock` is assembled as a fragment and the closing parenthesis is split across branches:

```ts
const _create${Pascal} = createInsertSchema(${tableName}${overrideBlock ? `\n  ${overrideBlock}\n)` : ')'}
```

If `overrideFields` is generated from the field loop but `overrideBlock` is malformed, it can produce broken syntax (unbalanced parens).

**Fix:** Generate the entire `createInsertSchema(...)` call as a single template string to guarantee balanced parentheses.

---

### 5. CLI uses `__dirname` in ESM context

**File:** `cli/prelysia.ts:9`

```ts
const pkg = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8"),
);
```

While Bun supports `__dirname` as a compatibility feature in ESM, this is non-standard and will break if the file is run with Node.js or Deno. The project has `"type": "module"` in `package.json`.

**Fix:**

```ts
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

---

## 🟡 Warnings

### 6. Unused dead code — `server/db/model.ts` + `server/db/utils.ts`

**Files:** `server/db/model.ts`, `server/db/utils.ts`

- `server/db/model.ts` exports a `db` object that is **never imported** anywhere in the codebase.
- `server/db/utils.ts` contains `spread()`/`spreads()` which are only used by `model.ts`.
- These appear to be remnants of a prior architecture before the Elysia `.decorate('db', ...)` pattern was adopted.

**Recommendation:** Remove both files. If they're kept for future use, add a comment explaining the intended purpose and add at least one import to verify they compile.

---

### 7. Massive code duplication in scaffold generator

**File:** `cli/generators/scaffold.ts:38-66` (and surrounding)

The scaffold generator inlines the full content of several source files rather than reusing template functions:

| Inlined content                    | Duplicates                                        |
| ---------------------------------- | ------------------------------------------------- |
| `server/db/utils.ts` (lines 38-66) | Actual source file                                |
| `server/db/model.ts` (lines 32-37) | Actual source file                                |
| `server/plugins/db.ts`             | `cli/templates/project.ts` (`dbPluginTemplate()`) |

When you change a source file, the scaffold template **won't be updated**, so new projects generated with `prelysia init` will get stale code.

**Recommendation:** Import from the existing template functions in `cli/templates/project.ts`. If a template doesn't exist yet, create one.

---

### 8. Potential flash of wrong theme on initial load

**File:** `src/hooks/useTheme.ts:12-15`

The theme is applied in `useEffect`, which runs **after** the first paint. This means the page renders with the default theme, then switches:

```ts
const [theme, setTheme] = useState(getInitialTheme);

useEffect(() => {
  document.documentElement.dataset.theme = theme; // runs after mount
}, [theme]);
```

**Fix:** Set `dataset.theme` synchronously in `getInitialTheme`:

```ts
function getInitialTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  const theme =
    stored === "dark" || stored === "light"
      ? stored
      : window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
  document.documentElement.dataset.theme = theme; // apply before mount
  return theme;
}
```

---

### 9. No validation for `:id` parameter in routes

**File:** `server/modules/todos/routes.ts:9,11,12`

```ts
Number(id); // silently produces NaN for non-numeric input
```

A malformed request like `GET /api/todos/abc` passes `NaN` to the service, which will never match a record.

**Fix:** Add a guard:

```ts
.get('/:id', ({ todoService, params: { id }, error }) => {
  const numId = Number(id)
  if (isNaN(numId)) return error(400, 'Invalid ID')
  const todo = todoService.getById(numId)
  if (!todo) return error(404, 'Not found')
  return todo
})
```

Apply the same pattern to `PATCH /:id` and `DELETE /:id`.

---

### 10. `preact.ComponentChildren` used without explicit import

**File:** `src/app.tsx:11`

```tsx
function SidebarLink({ href, children }: { href: string; children: preact.ComponentChildren }) {
```

`ComponentChildren` is a type from `preact`. While `jsxImportSource` provides JSX types, `ComponentChildren` may not be in scope without an explicit import.

**Fix:**

```ts
import type { ComponentChildren } from "preact";
```

---

### 11. `as any` cast in generated form template

**File:** `cli/templates/fe.ts:232` (generated output)

```ts
const { id, createdAt, updatedAt, ...rest } = existing as any
setFormData(rest as Create${Pascal})
```

This bypasses type safety. Since the template knows the field structure, it should generate proper destructuring.

**Fix:** Generate the destructure with explicit type knowledge rather than using `as any`.

---

### 12. Server-side `UpdateTodo` spread could overwrite timestamps

**File:** `server/modules/todos/service.ts:22` (and generated template `cli/templates/module.ts:122`)

```ts
.set({ ...data, updatedAt: new Date().toISOString() })
```

While the model validation should prevent it, `UpdateTodo` is `Partial<CreateTodo>`, which includes optional `createdAt` and `updatedAt` fields. If they somehow end up in the data, the spread would overwrite the manual `updatedAt` value.

**Fix:**

```ts
const {
  createdAt: _createdAt,
  updatedAt: _updatedAt,
  ...cleanData
} = data.set({ ...cleanData, updatedAt: new Date().toISOString() });
```

---

### 13. `cli/utils/name.ts` edge cases

**File:** `cli/utils/name.ts`

The name utilities assume kebab-case input. If a user passes an unusual name format to `prelysia feat`, `toCamelCase` may produce unexpected results. For example, `toCamelCase('hello--world')` would produce `helloWorld` but with doubled hyphens it produces `HelloWorld`.

**Recommendation:** Add input sanitization in the command handlers before passing names to these utilities, or add validation that rejects names with consecutive hyphens, leading/trailing hyphens, etc.

---

## 🟢 Suggestions

### 14. `index.html` title is "preact-app"

**File:** `index.html:7`

The AGENTS.md explicitly calls out: _"index.html title is preact-app (unlikely to be right for your project — update it)."_

Update to your actual project name.

---

### 15. `tsconfig.server.json` not referenced from root `tsconfig.json`

**File:** `tsconfig.json`

The root `tsconfig.json` only references `tsconfig.app.json` and `tsconfig.node.json`. Adding `tsconfig.server.json` would enable `tsc --noEmit` to type-check server code:

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.server.json" }
  ]
}
```

---

### 16. Inline styles instead of Tailwind/Stisla

**File:** `src/pages/Home.tsx:27`

```tsx
<ol style="margin:0;padding-inline-start:1.25rem">
```

Per project conventions, use Tailwind classes instead: `class="m-0 ps-5"`.

Also affects the generated template: `cli/templates/fe.ts:399`.

---

### 17. Top-level `await` with `staticPlugin`

**File:** `server/index.ts:13-19`

The conditional `.use(staticPlugin(...))` uses `await` at the top level inside an `if` block. While Bun supports top-level await, consider restructuring to make the control flow clearer:

```ts
const staticAssets = config.isProduction
  ? await staticPlugin({ prefix: "/", assets: "dist", indexHTML: true })
  : (app: Elysia) => app;

const app = new Elysia()
  .use(cors())
  .use(dbPlugin)
  .use(todosModule)
  .use(staticAssets)
  .listen(config.port, ({ hostname, port }) => {
    console.log(`Server running at http://${hostname}:${port}`);
  });
```

---

### 18. Brand text inconsistency

**File:** `src/app.tsx:32`

The `feAppTemplate()` generates the brand as `prelysia`, but `src/app.tsx` has `relysia`. Pick one name and use it consistently throughout the project.

---

### 19. Missing `onError` handler for not-found cases

**File:** `server/modules/todos/routes.ts`

When `getById`, `update`, or `remove` return `undefined`, Elysia serializes that as HTTP 200 with a `null` body. This is confusing for API consumers.

**Recommendation:** Check for falsy return values and return proper HTTP error codes (404 for not found, 400 for bad input).

---

### 20. Hardcoded dependency versions in scaffold generator

**File:** `cli/generators/scaffold.ts` (lines ~168-185)

Version strings like `"^1.4.2"` for `@elysia/cors`, `"^0.45.2"` for `drizzle-orm`, etc. are hardcoded in the template. These will drift from the actual project's dependency versions over time.

**Recommendation:** Read the current project's `package.json` and use its versions as defaults.

---

### 21. No try/catch for CLI file operations

**File:** `cli/commands/feat.ts`, `cli/commands/init.ts`

If `readText`, `writeText`, or `writeFileTree` fail (e.g., permissions error, disk full), the CLI crashes with an unhelpful stack trace.

**Recommendation:** Wrap file operations in try/catch and report user-friendly error messages.

---

### 22. `@source "./src"` with Tailwind v4

**File:** `src/style.css:4`

```css
@source "./src";
```

Verify this directive works correctly with Tailwind CSS v4 (`^4.1.7`). The v4 API may have different configuration requirements for content scanning.

---

### 23. `tsconfig.server.json` uses `"bun-types"` but `@types/bun` is installed

**File:** `tsconfig.server.json:7`, `package.json:37`

```json
// tsconfig.server.json
"types": ["bun-types"]

// package.json
"@types/bun": "^1.3.14"
```

With Bun 1.3+, `bun-types` is deprecated in favor of `@types/bun`. Update to:

```json
"types": ["@types/bun"]
```

---

## ✅ Things Done Well

### Architecture

- **6-file module pattern** (`schema.ts`, `types.ts`, `model.ts`, `service.ts`, `routes.ts`, `index.ts`) is clean, consistent, and easy to maintain.
- **Service factory pattern** (`createService(db) => ({...})`) with `.derive({ as: 'scoped' })` is the idiomatic Elysia 1.x DI pattern.
- **CLI marker comments** (`// @prelysia-imports`, `{/* @prelysia-sidebar */}`, `{/* @prelysia-routes */}`) are a clean approach that avoids AST parsing for code generation.

### TypeScript

- `verbatimModuleSyntax: true` compliance — all type-only imports correctly use `import type`.
- `drizzle-typebox` intermediate variable pattern (`_createTodo = createInsertSchema(...)`) correctly avoids the infinite type instantiation bug.
- `erasableSyntaxOnly: true` compliance — no enums, no parameter properties, no namespaces.

### CSS Strategy

- Stisla handles structural components (`.card`, `.page`, `.sidebar`, `.button`) while Tailwind handles spacing/sizing utilities. This separation is well thought out.
- `cn()` utility using `clsx` + `tailwind-merge` is the correct approach for class composition.

### Theme System

- The `useTheme` hook with localStorage persistence, system preference detection, and `data-theme` attribute is well-implemented.
- Works correctly with Stisla's dark mode via `data-theme` attribute.

### Database

- `PRAGMA journal_mode = WAL` is a performance best practice for SQLite.
- Drizzle ORM schema definitions use modern patterns (`$defaultFn`, `{ mode: 'boolean' }`).
- `drizzle.config.ts` reads `DB_PATH` from environment with a sensible default.

### Frontend

- `@tanstack/preact-query` with `QueryClientProvider` wrapping the entire app is correct.
- `wouter` usage with `useRoute` for active link detection and `useLocation` for navigation is idiomatic.
- Generated list pages handle loading, error, and empty states.

### Configuration

- `.env` is in `.gitignore` (no secret leakage risk).
- Vite proxy configuration for `/api` → `localhost:3000` is correct.
- Clean separation of tsconfigs for app, node, and server targets.

---

## Priority Action Items

| Priority | Issue                                      | File(s)                                            | Effort |
| -------- | ------------------------------------------ | -------------------------------------------------- | ------ |
| P0       | Fix icon imports                           | `src/app.tsx`, `src/pages/Home.tsx`                | 5 min  |
| P0       | Fix Elysia module augmentation             | `server/plugins/db.ts`, `cli/templates/project.ts` | 5 min  |
| P1       | Remove unused dead code                    | `server/db/model.ts`, `server/db/utils.ts`         | 10 min |
| P1       | Fix theme flash                            | `src/hooks/useTheme.ts`                            | 5 min  |
| P1       | Add `:id` validation                       | `server/modules/todos/routes.ts`                   | 10 min |
| P2       | Fix dedup in CLI module generator          | `cli/generators/module.ts`                         | 2 min  |
| P2       | Add `ComponentChildren` import             | `src/app.tsx`                                      | 1 min  |
| P2       | Fix inline styles                          | `src/pages/Home.tsx`, `cli/templates/fe.ts`        | 5 min  |
| P3       | Eliminate code duplication in scaffold     | `cli/generators/scaffold.ts`                       | 30 min |
| P3       | Read dependency versions from package.json | `cli/generators/scaffold.ts`                       | 15 min |
| P3       | Fix brand text inconsistency               | `src/app.tsx`                                      | 1 min  |
| P3       | Add try/catch to CLI commands              | `cli/commands/feat.ts`, `cli/commands/init.ts`     | 15 min |

---

_Generated 2026-07-14 via automated code review._
