# Contributing

## Development Setup

```bash
bun install
bun run dev          # Vite (:5173) + Elysia (:3000) concurrently
bun run dev:fe       # Vite only
bun run dev:be       # Elysia only with --watch
bun run prelysia --help  # Test CLI
```

The CLI (`packages/prelysia/cli/`) is NOT typechecked by any tsconfig — run it directly to verify:

```bash
bun run packages/prelysia/cli/prelysia.ts --help
```

There is no linter, test framework, or typecheck command.

## Project Structure

```
elysia-preact-scaffold/
├── package.json            # root workspace config (private)
├── packages/
│   └── prelysia/           # published to npm as "prelysia"
│       ├── package.json    # only 2 runtime deps: commander + @inquirer/prompts
│       └── cli/            # CLI source code
├── server/                 # scaffold backend (not published)
├── src/                    # scaffold frontend (not published)
└── .github/workflows/
    └── publish.yml         # auto-publish on tag push
```

Only `packages/prelysia/` is published to npm. The root package (`elysia-preact-scaffold`) is private and contains all scaffold dependencies for development.

## Publishing `prelysia`

### Prerequisites

| Item | Check |
|------|-------|
| npm account | `npm whoami` — logged in with 2FA enabled |
| npm token | `NPM_TOKEN` added to repo secrets for GitHub Actions |
| Package name | Confirmed: `prelysia` is available on npm |
| Clean git | `git status --porcelain` — no uncommitted changes |
| Dry run | `bun publish --dry-run` — verify only `cli/` files are included |
| Version sync | `bun run prelysia --version` matches `packages/prelysia/package.json` |
| `bun install` | Workspace lockfile is up to date |

### Semantic Versioning

| Bump | When | Example |
|------|------|---------|
| **Patch** | Bug fixes, dependency bumps, template refinements, docs | `0.1.0` → `0.1.1` |
| **Minor** | New commands, new features, non-breaking flag changes | `0.1.0` → `0.2.0` |
| **Major** | Breaking CLI commands, breaking output format, dropping Bun version support | `0.x` → `1.0.0` |
| **Pre-release** | Betas/RCs before stable | `--tag next` |

### Release Process

```bash
# 1. Bump version
#    Edit packages/prelysia/package.json → "version"

# 2. Verify
bun install                                    # sync lockfile
bun run prelysia --version                     # matches new version
cd packages/prelysia && bun publish --dry-run  # inspect tarball contents
# Expect: cli/ files + package.json + README.md (no server/, no src/)

# 3. Commit and tag
git add -A
git commit -m "chore: bump prelysia to v0.x.y"
git tag prelysia-v0.x.y

# 4. Push — GitHub Actions publishes automatically
git push origin main --tags
```

### Manual Publish (without CI)

```bash
cd packages/prelysia
bun publish --access public
```

### Verification After Publish

```bash
npm view prelysia                  # confirm version on registry
bun install -g prelysia && prelysia --help  # smoke test global install
```

## GitHub Actions

### Publish Workflow

File: `.github/workflows/publish.yml`

Triggered on tag push `prelysia-v*`. Steps:

1. Checkout repo
2. Setup Bun (`oven-sh/setup-bun`)
3. `bun install`
4. `bun publish --access public` (authenticated via `NPM_TOKEN`)

Before the first publish, add `NPM_TOKEN` to repo secrets.
