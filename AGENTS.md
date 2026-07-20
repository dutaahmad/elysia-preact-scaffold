# AGENTS.md

**Never commit without asking the user first.** If commit is needed, prompt for confirmation. Use global git config (`user.name`/`user.email`), not repo-local overrides.

**This repo is a fullstack scaffold/code generator.** The CLI (`packages/prelysia/cli/`) is the primary interface — prioritize CLI fixes over app code. The root app (`server/`, `src/`) is the reference scaffold, not production logic.

## Stack

- **Runtime**: Bun 1.3+
- **Backend**: Elysia 1.4, modular monolith, module per domain in `server/modules/<name>/`
- **Frontend**: Preact 10 + Vite 8 SPA, **Stisla** CSS (`.navbar`, `.sidebar`, `.card`, `.page`, `.table`, `.field`, `.button`), **Tailwind v4** for spacing/sizing only
- **FE Routing/Data**: wouter (`Route`, `Switch`, `Link`, `useRoute`, `useLocation`) + `@tanstack/preact-query`
- **Icons**: `@phosphor-icons/react` with `Icon` suffix, `size={20}` standalone, `size={16}` inline
- **DB**: Bun SQLite + Drizzle ORM, `drizzle-typebox` for validation
- **Class composition**: `clsx` + `tailwind-merge` via `cn()` from `src/lib/utils.ts`
- **TypeScript 6.0**, `erasableSyntaxOnly: true` — no enums, no parameter properties, no namespaces
- **No linter, no test framework, no typecheck command.** `bun run build` is the only verification.

## Entrypoints

| Layer | Entry | Config |
|-------|-------|--------|
| Backend | `server/index.ts` | `tsconfig.server.json` (not in root `tsconfig.json` references) |
| Frontend | `src/main.tsx` | `tsconfig.app.json` (referenced from root) |
| DB Schema | `server/db/schema.ts` (re-exports module schemas) | `drizzle.config.ts` |
| CLI | `packages/prelysia/cli/prelysia.ts` | No tsconfig — runs via `#!/usr/bin/env bun` shebang |

## Commands

```bash
bun run dev               # concurrently: vite (:5173) + elysia --watch (:3000)
bun run dev:fe            # vite only (with --host)
bun run dev:be            # elysia only with --watch
bun run build             # vite build into dist/ (the only verification command)
bun run preview           # NODE_ENV=production bun run server/index.ts (SPA + API on :3000)
bun run db:migrate        # drizzle-kit push
bun run db:generate       # drizzle-kit generate (SQL files to drizzle/)
bun run db:studio         # bunx drizzle-kit studio --host 0.0.0.0 --port 4983
bun run prelysia          # shortcut: bun run packages/prelysia/cli/prelysia.ts
bun run feat              # shortcut: bun run packages/prelysia/cli/prelysia.ts feat
```

## CLI (`prelysia`)

Published to npm as **`prelysia-cli`** via OIDC — tag `prelysia-cli-v*` triggers `.github/workflows/publish.yml`. Only `cli/` dir is included in tarball (see `packages/prelysia/package.json` `"files"`). CLI code is NOT typechecked by any tsconfig — run `bun packages/prelysia/cli/prelysia.ts` to verify.

```bash
bun packages/prelysia/cli/prelysia.ts init [project-name]  # scaffold full project
bun packages/prelysia/cli/prelysia.ts feat <kebab-name>     # add CRUD module (interactive field prompts)
bun packages/prelysia/cli/prelysia.ts feat <kebab-name> --fe-only  # skip server-side files
bun packages/prelysia/cli/prelysia.ts feat <kebab-name> --be-only  # skip frontend-side files
bun packages/prelysia/cli/prelysia.ts remove <kebab-name>   # remove module + DB table
```

### `init` creates (in generated project):
- `server/data/` dir (mkdirSync before `bunx drizzle-kit push`)
- `.env` (uncommented), `.env.example` (commented), `.gitignore`, `README.md` (from `templates/USER_README.md` with `{{projectName}}` interpolation)
- Todos module, full FE scaffold, `vite.config.ts` proxy injection
- Runs `bun install` then `bunx drizzle-kit push`

### `feat` generates:
- **Server**: 6 files at `server/modules/<name>/` — `schema.ts`, `types.ts`, `model.ts`, `service.ts`, `routes.ts`, `index.ts`
- **FE**: `src/types/<name>.ts`, `src/api/<name>.ts`, `src/pages/<name>/List.tsx`, `src/pages/<name>/Form.tsx`
- **Integration**: registers plugin in `server/index.ts`, re-export in `server/db/schema.ts`, updates `src/App.tsx` via marker comments:
  - `// @prelysia-imports` (import insertion)
  - `{/* @prelysia-sidebar */}` (sidebar link)
  - `{/* @prelysia-routes */}` (Route components)
  - **Never remove these markers** — `feat` validates they exist and refuses if missing.

## Architecture Details

- **Server modules**: 6-file pattern per domain — `schema.ts` (Drizzle table), `types.ts` (InferSelectModel/InsertModel), `model.ts` (drizzle-typebox → Elysia.t validation), `service.ts` (factory `(db) => ({...})`), `routes.ts` (Elysia routes), `index.ts` (Elysia plugin).
- **DB decoration**: global Elysia decoration via `.decorate('db', drizzle(sqlite)).as('global')` in `server/plugins/db.ts` — every route handler gets `db` on context.
- **`drizzle-typebox`**: intermediate variable required — `const _x = createInsertSchema(...)`, then reference in `t.Omit(...)` to avoid infinite type instantiation.
- **Wouter**: routes use `href` prop, not `to`. `useLocation` for navigation, `useRoute` for path matching.
- **Stisla page layout**: `.page > .page__header` (`.page__headline` > `.page__title` + `.page__description`; optional `.page__actions`) + `.page__body > .page__section > .card`.
- **Theme**: `useTheme` hook sets `data-theme` on `<html>`, persisted to `localStorage` key `stisla-theme`. `index.html` has inline `<script>` reading localStorage before first paint — do not remove.
- **ENV vars**: root `.env.example` (ClickUp tokens) is unrelated cruft. The generated project gets its own `.env`/`.env.example` with `PORT`, `DB_PATH`, `NODE_ENV`. Bun auto-loads `.env`, no dotenv needed. Default `DB_PATH` is `server/data/todos.db`.

## Templates

All CLI templates live under `packages/prelysia/cli/templates/`:
- `project.ts` — 10 template functions for server files (`serverIndexTemplate`, `serverConfigTemplate`, `envExampleTemplate`, `envLocalTemplate`, `gitignoreTemplate`, etc.)
- `module.ts` — 6 server file templates (used by `feat`)
- `fe-*.ts` — frontend file templates
- `USER_README.md` — physical Markdown file, read via `readFileSync` in `scaffold.ts`, placeholders interpolated with `.replace()`

## Package Boundary

Only `packages/prelysia/` is published to npm (as `prelysia-cli`). The root `package.json` is private (workspace container). When adding new files to the CLI tarball, update `"files"` in `packages/prelysia/package.json` and verify with `bun publish --dry-run`.
