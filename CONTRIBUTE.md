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
│   └── prelysia/           # published to npm as "prelysia-cli"
│       ├── package.json    # only 2 runtime deps: commander + @inquirer/prompts
│       └── cli/            # CLI source code
├── server/                 # scaffold backend (not published)
├── src/                    # scaffold frontend (not published)
└── .github/workflows/
    └── publish.yml         # auto-publish on tag push via OIDC
```

Only `packages/prelysia/` is published to npm. The root package (`elysia-preact-scaffold`) is private and contains all scaffold dependencies for development.

## Publishing `prelysia-cli`

### Trusted Publisher (OIDC)

This repo uses [npm Trusted Publishing](https://docs.npmjs.com/trusted-publishers) via GitHub Actions OIDC — no long-lived tokens required.

### Prerequisites

| Item | Check |
|------|-------|
| npm account | `npm whoami` — logged in with 2FA enabled |
| Package name | Confirmed: `prelysia-cli` is available on npm |
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
git commit -m "chore: bump prelysia-cli to v0.x.y"
git tag prelysia-cli-v0.x.y

# 4. Push — GitHub Actions publishes automatically
git push origin main --tags
```

### First-Time Setup

Trusted publishing only works after the package exists on the registry. For the **first publish only**:

```bash
cd packages/prelysia
npm publish --access public --otp=XXXXXX
# Get OTP from your authenticator app
```

Then configure the trusted publisher on [npmjs.com](https://www.npmjs.com/package/prelysia-cli/settings):

- Navigate to **Settings → Trusted Publisher → Add**
- Provider: **GitHub Actions**
- Environment: *leave blank* (no environment restrictions)
- Org: `dutaahmad`, Repo: `elysia-preact-scaffold`, Workflow: `publish.yml`
- Allowed actions: `npm publish`

After setup, also lock down the package under **Settings → Publishing access** → **"Require two-factor authentication and disallow tokens"**.

### Verification After Publish

```bash
npm view prelysia-cli                  # confirm version on registry
bun install -g prelysia-cli && prelysia --help  # smoke test global install
```

## GitHub Actions

### Publish Workflow

File: `.github/workflows/publish.yml`

Triggered on tag push `prelysia-cli-v*`. Uses OIDC (no tokens):

1. Checkout repo
2. Setup Bun — `bun install` dependencies
3. Setup Node — `npm publish` handles OIDC auth
4. Publish with provenance attestations (automatic for public repos)

Automatic provenance links each publish to the exact commit and workflow run.

## Troubleshooting

### Publish succeeded in CI but npmjs.com shows old version

The npm registry API and website may be out of sync due to CDN caching. The API is the source of truth.

**Check the real state:**

```bash
# Latest dist-tag
curl -s https://registry.npmjs.org/prelysia-cli | jq '.dist-tags'

# All published versions
curl -s https://registry.npmjs.org/prelysia-cli | jq '.versions | keys'
```

If the API shows your version but the website doesn't, **hard refresh** the browser (`Cmd+Shift+R` / `Ctrl+F5`). Wait up to 2 minutes for CDN propagation.

### CI published but GitHub tag doesn't match package version

The `version` field in `packages/prelysia/package.json` must equal the git tag suffix:

```
Tag:                prelysia-cli-v0.1.2
package.json:       "version": "0.1.2"
```

Bump the version in `package.json` first, then commit, tag, and push.

### CI fails with "ENEEDAUTH"

npm CLI versions before 11 do not support OIDC trusted publishing. The workflow upgrades npm explicitly:

```yaml
- run: npm install -g npm@11
```

If the error persists, verify the trusted publisher is configured at `https://www.npmjs.com/package/prelysia-cli/settings`.

### CI runs the wrong script instead of publishing

A `"publish"` script in `package.json` overrides the `npm publish` command (npm lifecycle hooks). If one exists, rename it to something that doesn't conflict, like `"npm-publish"`.

### CI fails with 404 when publishing

This typically means the auth token used doesn't have publish permission for the package. With OIDC trusted publishing:

1. Confirm the trusted publisher is configured on npmjs.com
2. Ensure the workflow has `permissions: { id-token: write }`
3. Remove any `NPM_TOKEN` or `NODE_AUTH_TOKEN` secrets from the repo — they override OIDC
4. Run `npm install -g npm@11` before publishing (npm 10 lacks OIDC support)
