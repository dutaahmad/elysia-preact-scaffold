# AGENTS.md

**This is a fullstack scaffold/code generator.** Prioritize CLI-side (`cli/`) fixes and enhancements over application code. The CLI (`prelysia`) is the primary interface users interact with.

## Stack

- **Runtime**: Bun (v1.3+)
- **Backend**: Elysia 1.4, modular monolith (plugins per domain)
- **Frontend**: Preact 10 + Vite 8 (SPA), **Stisla** CSS (`.navbar`, `.sidebar`, `.card`, `.page`, `.table`, `.field`, `.button`) loaded with `@ts-expect-error` (no type declarations), **Tailwind CSS v4** for spacing/sizing utilities
- **FE Routing/Data**: wouter (`Route`, `Switch`, `Link`, `useRoute`) + `@tanstack/preact-query` (`QueryClientProvider`)
- **Icons**: `@phosphor-icons/react` (PascalCase with `Icon` suffix, e.g. `SunIcon`, `MoonIcon`, `PlusIcon`, `TrashIcon`), `size={20}` standalone, `size={16}` inline
- **Class composition**: `clsx` + `tailwind-merge` via `cn()` from `src/lib/utils.ts`
- **Theme**: `useTheme` hook sets `data-theme` on `<html>`, persisted to localStorage key `stisla-theme`
- **Database**: Bun SQLite + Drizzle ORM, `drizzle-typebox` for validation
- **CLI**: `prelysia` (Commander.js + `@inquirer/prompts`)
- **Language**: TypeScript 6.0, `erasableSyntaxOnly: true` — no enums, no parameter properties, no namespaces
- **No linter, no test framework, no typecheck command**

## Entrypoints

| Layer | Entry | Config |
|-------|-------|--------|
| Backend | `server/index.ts` | `tsconfig.server.json` (not in root references) |
| Frontend | `src/main.tsx` | `tsconfig.app.json` (referenced from root) |
| DB Schema | `server/db/schema.ts` (re-exports module schemas) | `drizzle.config.ts` |
| CLI | `cli/prelysia.ts` | No tsconfig — runs via `#!/usr/bin/env bun` shebang |

## Architecture

- **Server**: each domain = `server/modules/<name>/` with 6 files — `schema.ts` (Drizzle table), `types.ts` (InferSelectModel/InsertModel), `model.ts` (drizzle-typebox → Elysia.t validation), `service.ts` (CRUD factory `(db) => ({...})`), `routes.ts` (Elysia routes), `index.ts` (Elysia plugin — prefix + routes). Register in `server/index.ts` via `.use(module)`, add re-export to `server/db/schema.ts`.
- **Frontend**: generated module FE assets go to `src/types/<module>.ts`, `src/api/<module>.ts`, `src/pages/<module>/List.tsx`, `src/pages/<module>/Form.tsx`. `src/App.tsx` uses marker comments for codegen: `// @prelysia-imports` (import insertion), `{/* @prelysia-sidebar */}` (sidebar link), `{/* @prelysia-routes */}` (Route components). **Never remove these markers.** The `feat` command validates markers exist and refuses if missing.
- **DB**: global Elysia decoration — every route handler gets `db` on context. Decorated in `server/plugins/db.ts` via `.decorate('db', drizzle(sqlite)).as('global')`.
- **CLI `init`**: scaffolds files, then runs `bun install` and `drizzle-kit push` automatically.
- **Preact compat**: `tsconfig.app.json` aliases `react` → `preact/compat`, uses `"jsx": "react-jsx"`, `"jsxImportSource": "preact"`.
- **Stisla page layout**: every page follows `.page > .page__header` (`.page__headline` > `.page__title` + `.page__description`; optional `.page__actions`) + `.page__body > .page__section > .card`.
- **Theme**: `useTheme` hook in `src/hooks/useTheme.ts` + `ThemeToggle` in `src/components/ThemeToggle.tsx`. Sets `document.documentElement.dataset.theme`.
- **Theme flash prevention**: `index.html` has an inline `<script>` that reads localStorage `stisla-theme` before first paint — do not remove it.
- **Tailwind v4**: `src/style.css` uses `@import "tailwindcss"` and `@source "./src"` for class scanning. `vite.config.ts` includes `@tailwindcss/vite` plugin.
- **SidebarLink**: shared component in `src/App.tsx`, uses `cn()` and `aria-current` for active state. Icon passed as children.
- **CLI templates**: `cli/templates/module.ts` (6 server files), `cli/templates/fe.ts` (client, types, api, list/form pages, app template, home, theme, utils), `cli/templates/project.ts` (scaffold server files). CLI code is NOT typechecked.

## Commands

```bash
bun run dev          # concurrently: vite (:5173) + elysia --watch (:3000)
bun run dev:fe       # vite only
bun run dev:be       # elysia only with --watch
bun run build        # vite build only (into dist/) — only verification command
bun run preview      # NODE_ENV=production bun run server/index.ts (SPA + API)
bun run db:migrate   # drizzle-kit push (needs @libsql/client in devDeps)
bun run db:generate  # drizzle-kit generate (creates SQL files in drizzle/)
bun run db:studio    # drizzle-kit studio
bun cli/prelysia.ts  # CLI entry (use `bun cli/prelysia.ts --help`)
```

## Dev Workflow

- Vite on :5173 proxies `/api/*` → `http://localhost:3000` (configured in `vite.config.ts`).
- Elysia on :3000 handles API routes; in production also serves `dist/` via `@elysia/static` with `indexHTML: true`.
- First time setup: `bun run db:migrate` to create tables. Or `bun cli/prelysia.ts init` for full scaffold (scaffolds files, runs `bun install`, then `drizzle-kit push`).
- Add CRUD modules: `bun cli/prelysia.ts feat <kebab-name>` (interactive field prompts, generates all 6 server files + FE assets + updates index.ts + App.tsx). Use `--fe-only` to skip server-side generation.
- `cli/` code is NOT typechecked by any tsconfig — run `bun cli/prelysia.ts` to verify.
- `.env` vars: `PORT`, `DB_PATH`, `NODE_ENV` (auto-loaded by Bun, no dotenv). `.env.example` is unrelated cruft (ClickUp tokens), ignore it.

## Key Conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- `drizzle-typebox` intermediate variable required: `const _x = createInsertSchema(...)`, then reference in `t.Omit(...)` to avoid infinite type instantiation.
- Service is a factory function called in routes via `derive({ as: 'scoped' }, ({ db }) => ({ svc: createService(db) }))`.
- All generated module routes use `BunSQLiteDatabase` type for db parameter.
- Wouter routes use `href` prop, not `to`. Use `useLocation` for navigation, `useRoute` for path matching.
- TanStack Query: `useQuery` + `useMutation` + `useQueryClient` from `@tanstack/preact-query`.
- **`cn()` rule**: use `cn(...)` from `src/lib/utils.ts` for conditional class composition. Raw `class` is fine for static Stisla layout classes.
- **Icon convention**: import from `@phosphor-icons/react` with `Icon` suffix (e.g. `SunIcon`, `MoonIcon`, `PlusIcon`, `TrashIcon`). `size={20}` standalone, `size={16}` inline with text.
- **Tailwind + Stisla**: Stisla owns structural layout/components; Tailwind handles spacing, sizing, borders. Never use Tailwind to override Stisla component styles.
- **Stisla CSS classes**: `.button` (variants: `--primary`, `--danger`, `--ghost`, `--soft`, `--neutral`, `--sm`), `.card` (`.card__header`, `__body`, `__footer`), `.page` (`.page__header`, `__body`, `__section`, `__headline`, `__title`, `__description`, `__actions`), `.table` (`.table--hover`, `--striped`), `.field`, `.input`.
- `index.html` title is `Elysia + Preact` — update if you rename the project.
- No `npm test`, `npm run lint`, or `npm run typecheck` exist. `bun run build` is the only verification command.
