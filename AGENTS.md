# AGENTS.md

## Stack

- **Runtime**: Bun (v1.3+)
- **Backend**: Elysia 1.4, modular monolith (plugins per domain)
- **Frontend**: Preact 10 + Vite 8 (SPA)
- **Database**: Bun SQLite + Drizzle ORM, `drizzle-typebox` for validation
- **No test framework, no linter configured yet**

## Entrypoints

| Layer | Entry | Config |
|-------|-------|--------|
| Backend | `server/index.ts` | `tsconfig.server.json` (not included in root tsconfig references) |
| Frontend | `src/main.tsx` | `tsconfig.app.json` (referenced from root `tsconfig.json`) |
| DB Schema | `server/db/schema.ts` (re-exports modules) | `drizzle.config.ts` |

## Architecture

```
server/
  index.ts          — compose plugins + optional static serving in production
  config.ts         — reads PORT, DB_PATH, NODE_ENV from process.env (Bun auto-loads .env)
  plugins/
    db.ts           — global Elysia plugin, decorates .db via bun:sqlite + drizzle
  modules/
    <domain>/       — each module is a self-contained bounded context
      schema.ts     — Drizzle table definition (sqliteTable)
      types.ts      — InferSelectModel / InferInsertModel types
      model.ts      — drizzle-typebox → Elysia.t validation models
      service.ts    — pure CRUD, injected with db via factory
      routes.ts     — Elysia route handlers
      index.ts      — public plugin API (exports the Elysia plugin)
  db/
    schema.ts       — re-exports all module schemas (for drizzle-kit discovery)
    model.ts        — singleton spread utility for table schemas
    utils.ts        — spread() / spreads() from Elysia Drizzle docs
```

## Commands

```bash
bun run dev          # concurrently: vite (:5173) + elysia --watch (:3000)
bun run dev:fe       # vite only
bun run dev:be       # elysia only with --watch
bun run build        # vite build only (into dist/)
bun run preview      # NODE_ENV=production bun run server/index.ts (SPA + API)
bun run db:migrate   # drizzle-kit push (needs @libsql/client in devDeps)
bun run db:generate  # drizzle-kit generate
bun run db:studio    # drizzle-kit studio
```

## Dev Workflow

- Vite on :5173 proxies `/api/*` → `http://localhost:3000` (configured in `vite.config.ts`)
- Elysia on :3000 handles API routes directly
- In production (`preview`), Elysia also serves `dist/` via `@elysia/static` with `indexHTML: true` (SPA fallback)
- First time setup: `bun run db:migrate` to create tables

## Key Conventions

- Each new domain = new folder in `server/modules/<name>/` with all 6 files (schema, types, model, service, routes, index)
- Register in `server/index.ts` via `.use(module)` and add re-export to `server/db/schema.ts`
- DB connection is a global Elysia decoration — every route gets `db` on context
- `verbatimModuleSyntax: true` — use `import type` for type-only imports
- `drizzle-typebox` intermediate variable required: declare `const _x = createInsertSchema(...)` first, then reference it in `t.Omit(...)` to avoid infinite type instantiation
- `.env` is auto-loaded by Bun (no dotenv)
- SQLite database file at `server/data/todos.db` (gitignored)
