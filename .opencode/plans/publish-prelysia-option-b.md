# Plan: Publish `prelysia` CLI to npm (Option B)

**Goal:** Users run `bun install -g prelysia` then use `prelysia init`, `prelysia feat`, etc. directly — no `npx`/`bunx` prefix. CLI runs via `#!/usr/bin/env bun` shebang. No compile step.

---

## 1. Restructure to Bun workspace monorepo

### Why

The root `package.json` has ALL scaffold dependencies (elysia, preact, vite, tailwindcss, etc.) — ~40 packages. A global install of `prelysia` should NOT pull those. The CLI only needs `commander` + `@inquirer/prompts`.

### New structure

```
elysia-preact-scaffold/
├── .opencode/plans/
├── package.json                 # root workspace, private
├── packages/
│   └── prelysia/                # published to npm as "prelysia"
│       ├── package.json
│       └── cli/                 # moved from root cli/
│           ├── prelysia.ts      ← shebang: #!/usr/bin/env bun
│           ├── commands/        # unchanged
│           ├── generator/       # unchanged
│           ├── templates/       # unchanged
│           ├── utils/           # unchanged
│           └── types.ts         # unchanged
├── server/                      # unchanged
├── src/                         # unchanged
├── vite.config.ts               # unchanged
├── drizzle.config.ts            # unchanged
└── AGENTS.md                    # update CLI paths
```

### Root `package.json` changes

| Field | Current | New |
|-------|---------|-----|
| `name` | `elysia-preact-scaffold` | unchanged |
| `private` | `true` | unchanged |
| `workspaces` | (none) | `["packages/prelysia"]` |
| `scripts.prelysia` | `bun run cli/prelysia.ts` | `bun run packages/prelysia/cli/prelysia.ts` |
| `scripts.feat` | `bun run cli/prelysia.ts feat` | `bun run packages/prelysia/cli/prelysia.ts feat` |

Keep all other deps/scripts — they're for the scaffold dev environment.

---

## 2. Create `packages/prelysia/package.json`

```json
{
  "name": "prelysia",
  "version": "0.1.0",
  "description": "Elysia + Preact fullstack scaffold CLI",
  "type": "module",
  "bin": {
    "prelysia": "./cli/prelysia.ts"
  },
  "files": [
    "cli/",
    "README.md",
    "LICENSE"
  ],
  "engines": {
    "bun": ">=1.3"
  },
  "dependencies": {
    "@inquirer/prompts": "^8.5.2",
    "commander": "^15.0.0"
  },
  "devDependencies": {
    "@types/bun": "^1.3.14"
  },
  "keywords": ["elysia", "preact", "scaffold", "cli", "fullstack"],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/<your-org>/elysia-preact-scaffold"
  }
}
```

**Key details:**

- `bin` points directly to `.ts` file — bun's shebang means bun handles TS natively
- `files` only includes `cli/` — no server/, src/, or scaffold deps in published package
- Only 2 runtime deps: `commander` + `@inquirer/prompts` (tiny install)
- `engines.bun` signals this requires Bun

---

## 3. Version resolution (auto-fix)

Currently `cli/prelysia.ts` line 15:
```typescript
readFileSync(join(dirname(__filename), '..', 'package.json'), 'utf-8')
```

This resolves `cli/../package.json` → root package.json. After moving to `packages/prelysia/cli/prelysia.ts`, it resolves to `packages/prelysia/../package.json` → `packages/prelysia/package.json` (its own package.json).

**No change needed** — the relative path automatically corrects itself.

---

## 4. File moves

Move the entire `cli/` directory into the workspace:

```
mkdir -p packages/prelysia
mv cli packages/prelysia/cli
```

All internal imports (`./commands/init`, `../generator/scaffold`, `../utils/fs`, etc.) remain valid since relative paths within `cli/` are unchanged.

---

## 5. Scripts & dev workflow changes

### Root `package.json` scripts to update

```json
"prelysia": "bun run packages/prelysia/cli/prelysia.ts",
"feat": "bun run packages/prelysia/cli/prelysia.ts feat"
```

With bun workspaces, you can also run:
```bash
bun run -w prelysia    # if workspace script is set
```

### `AGENTS.md` updates

Search for references to `cli/` — update paths:

| Current | New |
|---------|-----|
| `cli/prelysia.ts` | `packages/prelysia/cli/prelysia.ts` |
| `bun cli/prelysia.ts` | `bun packages/prelysia/cli/prelysia.ts` |
| `cli/templates/module.ts` | `packages/prelysia/cli/templates/module.ts` |
| etc. | etc. |

---

## 6. Verification

### After restructuring

```bash
# 1) Bun install resolves workspaces
bun install

# 2) Root scripts still work
bun run prelysia --help

# 3) Test commands
bun run prelysia init /tmp/test-prelysia-scaffold-option-b

# 4) Local global install test
cd packages/prelysia
bun link
cd /tmp
bunx prelysia init test-project    # should work via link
```

### Before publishing

```bash
# 5) Dry run publish
cd packages/prelysia
bun publish --dry-run
# Verify: only cli/ directory, README, LICENSE
# Verify: package.json has correct deps (2 only)
```

---

## 7. Publish workflow

### Manual publish

```bash
cd packages/prelysia
bun publish
```

### Future: GitHub Actions (out of scope for this plan)

Trigger on tag push, auto-publish to npm via `bun publish` with `NPM_TOKEN`.

---

## 8. Post-publish items

| Item | Details |
|------|---------|
| README | Add install instructions: `bun install -g prelysia` |
| Usage docs | `prelysia init`, `prelysia feat`, `prelysia remove` |
| Community | Add GitHub repo topics, shields |
| Testimonials | Ask early users for feedback |

---

## 9. Open questions / risks

| Risk | Mitigation |
|------|------------|
| Users without Bun can't install | Acceptable for Option B — instructions clearly state Bun requirement |
| npm users who install via `npm install -g` get errors if bun not on PATH | Add `postinstall` warning or `engines` check; document clearly |
| Workspace changes might break CI/dev workflows | Test thoroughly before merging |
| `bun run prelysia` root script changes path | Update all references in AGENTS.md |

---

## Summary of files to create/modify

| File | Action |
|------|--------|
| `packages/prelysia/package.json` | **Create** — CLI package definition |
| `packages/prelysia/cli/` (all contents) | **Move** from root `cli/` |
| `package.json` (root) | **Edit** — add workspaces, fix scripts |
| `AGENTS.md` | **Edit** — update CLI paths |
| `packages/prelysia/README.md` | **Create** — CLI-specific readme (optional) |
