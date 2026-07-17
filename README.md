# elysia-preact-scaffold

Source repository for the **prelysia-cli** — an Elysia + Preact fullstack scaffold generator.

## Development

```bash
git clone <this-repo>
bun install
bun run dev     # Vite (:5173) + Elysia (:3000) concurrently
```

## Structure

```
├── server/              # Backend reference scaffold (Elysia + Bun SQLite)
│   ├── config.ts
│   ├── index.ts
│   ├── plugins/
│   └── modules/
├── src/                 # Frontend reference scaffold (Preact + Vite)
│   ├── main.tsx
│   ├── App.tsx
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── pages/
├── packages/prelysia/   # CLI generator (published as prelysia-cli)
│   └── cli/
│       ├── prelysia.ts
│       ├── generator/
│       └── templates/
└── docs/                # Smoke tests, reports
```

## Key Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server (Vite + Elysia) |
| `bun run build` | Verify frontend build |
| `bun run prelysia` | Run CLI directly |
| `bun run feat` | Shortcut: `prelysia feat` |
| `bun run db:migrate` | Push Drizzle schema |

## Publishing

Published to npm as **`prelysia-cli`** via GitHub Actions OIDC (tag `prelysia-cli-v*` triggers `.github/workflows/publish.yml`). Only `packages/prelysia/cli/` is included in the tarball.
