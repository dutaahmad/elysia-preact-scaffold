# AGENTS.md

## Stack

- **Runtime**: Bun (v1.3+)
- **Backend**: Elysia 1.4, modular monolith (plugins per domain)
- **Frontend**: Preact 10 + Vite 8 (SPA), **Stisla** CSS (`.navbar`, `.sidebar`, `.card`, `.page`, `.table`, `.field`, `.button`) loaded with `@ts-expect-error` (no type declarations)
- **FE Routing/Data**: wouter (`Route`, `Switch`, `Link`, `useRoute`) + `@tanstack/preact-query` (`QueryClientProvider`)
- **Database**: Bun SQLite + Drizzle ORM, `drizzle-typebox` for validation
- **CLI**: `prelysia` (Commander.js + `@inquirer/prompts`)
- **Language**: TypeScript 6.0, `erasableSyntaxOnly: true` — no enums, no parameter properties, no namespaces
- **No linter, no test framework**

## Entrypoints

| Layer | Entry | Config |
|-------|-------|--------|
| Backend | `server/index.ts` | `tsconfig.server.json` (not included in root tsconfig references) |
| Frontend | `src/main.tsx` | `tsconfig.app.json` (referenced from root `tsconfig.json`) |
| DB Schema | `server/db/schema.ts` (re-exports module schemas) | `drizzle.config.ts` |
| CLI | `cli/prelysia.ts` | No tsconfig — runs via `#!/usr/bin/env bun` shebang |

## Architecture

- **Server**: each domain = `server/modules/<name>/` with 6 files — `schema.ts` (Drizzle table), `types.ts` (InferSelectModel/InsertModel), `model.ts` (drizzle-typebox → Elysia.t validation), `service.ts` (CRUD factory, `(db) => ({...})`), `routes.ts` (Elysia routes), `index.ts` (Elysia plugin — prefix + routes). Register in `server/index.ts` via `.use(module)`, add re-export to `server/db/schema.ts`.
- **Frontend**: generated module FE assets go to `src/types/<module>.ts`, `src/api/<module>.ts`, `src/pages/<module>/List.tsx`, `src/pages/<module>/Form.tsx`. `src/App.tsx` uses marker comments for codegen: `// @prelysia-imports` (import insertion), `{/* @prelysia-sidebar */}` (sidebar link), `{/* @prelysia-routes */}` (Route components). **Never remove these markers.**
- **DB**: global Elysia decoration — every route handler gets `db` on context. Decorated in `server/plugins/db.ts` as `.as('global')`.
- **Preact compat**: `tsconfig.app.json` aliases `react` → `preact/compat`, uses `"jsx": "react-jsx"`, `"jsxImportSource": "preact"`.

## Commands

```bash
bun run dev          # concurrently: vite (:5173) + elysia --watch (:3000)
bun run dev:fe       # vite only
bun run dev:be       # elysia only with --watch
bun run build        # vite build only (into dist/)
bun run preview      # NODE_ENV=production bun run server/index.ts (SPA + API)
bun run db:migrate   # drizzle-kit push (needs @libsql/client in devDeps, uses bun:sqlite at runtime)
bun run db:generate  # drizzle-kit generate (creates SQL files in drizzle/)
bun run db:studio    # drizzle-kit studio
bun cli/prelysia.ts  # CLI entry (use `bun cli/prelysia.ts --help`)
```

## Dev Workflow

- Vite on :5173 proxies `/api/*` → `http://localhost:3000` (configured in `vite.config.ts`).
- Elysia on :3000 handles API routes; in production also serves `dist/` via `@elysia/static` with `indexHTML: true`.
- First time setup: `bun run db:migrate` to create tables. Or `bun cli/prelysia.ts init` for full scaffold.
- Add CRUD modules: `bun cli/prelysia.ts feat <kebab-name>` (interactive field prompts, generates all 6 server files + FE assets + updates index.ts + App.tsx). Use `--fe-only` to skip server-side generation.
- `cli/` code is NOT typechecked by any tsconfig — run `bun cli/prelysia.ts` to verify.
- `.env` vars: `PORT`, `DB_PATH`, `NODE_ENV` (auto-loaded by Bun, no dotenv). `.env.example` is unrelated cruft (ClickUp tokens), ignore it.

## Key Conventions

- `verbatimModuleSyntax: true` — use `import type` for type-only imports.
- `drizzle-typebox` intermediate variable required: `const _x = createInsertSchema(...)`, then reference in `t.Omit(...)` to avoid infinite type instantiation.
- Service is a factory function called in routes: `derive({ as: 'scoped' }, ({ db }) => ({ svc: createService(db) }))`.
- All generated module routes use `BunSQLiteDatabase` type for db parameter.
- Wouter routes use `href` prop, not `to`. Use `useLocation` for navigation, `useRoute` for path matching.
- TanStack Query: `useQuery` + `useMutation` + `useQueryClient` from `@tanstack/preact-query`.
- Stisla CSS classes: `.button--primary`, `.button--danger`, `.button--ghost`, `.button--sm`, `.card`, `.card__body`, `.page`, `.page__header`, `.table`, `.field`, `.input`.
- `index.html` title is `preact-app` (unlikely to be right for your project — update it).
