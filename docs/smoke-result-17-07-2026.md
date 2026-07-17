# Smoke Test Result

**Date**: 17 July 2026  
**Test**: Smoke Test (`docs/smoke-test.md`)  
**Environment**: macOS (darwin), Bun 1.3.4, commit `feat/init-enhancements`  
**Executed by**: qa-expert agent  
**Status**: **NOT READY** — 2 critical defects block release

---

## S: Scaffold

| # | Test Case | Result | Evidence |
|---|---|---|---|
| S1 | Server files exist | **PASS** ✅ | `server/` has `config.ts`, `index.ts`, `plugins/db.ts`, `db/schema.ts`, `modules/todos/` |
| S2 | Todos module files | **PASS** ✅ | All 6 files: `schema.ts`, `types.ts`, `model.ts`, `service.ts`, `routes.ts`, `index.ts` |
| S3 | Frontend files exist | **PASS** ✅ | All 8 files in `src/`: `main.tsx`, `style.css`, `App.tsx`, `api/client.ts`, `hooks/useTheme.ts`, `components/ThemeToggle.tsx`, `lib/utils.ts`, `pages/Home.tsx` |
| S4 | Config files (6) | **FAIL** ❌ | `README.md` missing from root. Only exists at `packages/prelysia/README.md`. |
| S5 | Build passes | **FAIL** ❌ | `bun run build` → `✗ Build failed: Can't resolve '@stisla/style/theme.css'` (exit 1) |

## D: Dev Server

| # | Test Case | Result | Evidence |
|---|---|---|---|
| D1 | Concurrency starts | **FAIL** ❌ | Vite starts ✅. Elysia crashes: `SQLITE_CANTOPEN: unable to open database file` — `server/data/` directory missing. |
| D2 | FE loads | **BLOCKED** ⚠️ | Server not running. CSS would also fail due to missing `@stisla/style`. |
| D3 | API proxy works | **BLOCKED** ⚠️ | Requires running server. |
| D4 | Server live reload | **BLOCKED** ⚠️ | Requires running server. |

## U: Frontend UI

| # | Test Case | Result | Evidence |
|---|---|---|---|
| U1-U4 | All UI layout tests | **BLOCKED** ⚠️ | Blocked by S5 (broken build). |

## T: Theme

| # | Test Case | Result | Evidence |
|---|---|---|---|
| T1-T5 | All theme tests | **BLOCKED** ⚠️ | Blocked by S5 (no working dev server). |

## C: CRUD Module Generation

| # | Test Case | Result | Evidence |
|---|---|---|---|
| C1-C7 | All feat command tests | **BLOCKED** ⚠️ | CLI parses correctly (`--help` works ✅). Marker comments present in `App.tsx` ✅. Cannot run generator without modifying files (outside QA scope). |

## O: CRUD Operations

| # | Test Case | Result | Evidence |
|---|---|---|---|
| O1-O8 | All CRUD operation tests | **BLOCKED** ⚠️ | Blocked by B1 (no database) and S5 (no build). |

## P: Production Build

| # | Test Case | Result | Evidence |
|---|---|---|---|
| P1-P5 | All production tests | **BLOCKED** ⚠️ | Blocked by S5 (broken build). |

## B: Database

| # | Test Case | Result | Evidence |
|---|---|---|---|
| B1 | Migrate (`db:migrate`) | **FAIL** ❌ | `ConnectionFailed: Unable to open connection to local database server/data/todos.db: 14` — `server/data/` directory missing. |
| B2 | Generate (`db:generate`) | **PASS** ✅ | `drizzle/0000_good_ultimo.sql` generated successfully. |
| B3 | Data persistence | **BLOCKED** ⚠️ | No DB file to test against. |
| B4 | SQLite file exists | **FAIL** ❌ | `server/data/` directory does not exist. |

---

## Defects Found

### DEFECT-1: Missing `@stisla/style` dependency (BLOCKER)

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Priority** | High |
| **Environment** | Bun 1.3.4, commit `feat/init-enhancements` |
| **Frequency** | Always |

**Title**: Build fails — `@stisla/style` is a peer dependency of `@stisla/css` but is not installed

**Steps to reproduce**:
1. `bun install`
2. `bun run build`

**Expected**: Build succeeds, `dist/` produced, exit 0.

**Actual**: `✗ Build failed: Can't resolve '@stisla/style/theme.css' in '/Users/.../src'`

**Root cause**: `src/style.css` imports `@stisla/style/theme.css` and `@stisla/style/components.css`, but `@stisla/style` is not listed in `dependencies`. `@stisla/css` (v3.0.1) declares `@stisla/style@3.0.1` as a peer dependency, so `bun install` does not auto-install it.

**Affected in generated projects**: `packages/prelysia/cli/generator/scaffold.ts` (line 114-127) does not include `@stisla/style` in the dependency list written to generated `package.json`. Every project created by `prelysia init` will have the same broken build.

**Evidence**:
```
$ bun run build
✗ Build failed in 466ms
error during build:
[plugin @tailwindcss/vite:generate:build] /.../src/style.css
Error: Can't resolve '@stisla/style/theme.css' in '/.../src'
```

---

### DEFECT-2: Missing `server/data/` directory (BLOCKER)

| Field | Value |
|---|---|
| **Severity** | Critical |
| **Priority** | High |
| **Environment** | Bun 1.3.4, commit `feat/init-enhancements` |
| **Frequency** | Always |

**Title**: Elysia server crashes — `server/data/` directory does not exist

**Steps to reproduce**:
1. `bun run dev`
2. Observe Elysia output

**Expected**: Elysia starts and listens on port 3000.

**Actual**: Elysia crashes immediately with `SQLITE_CANTOPEN: unable to open database file`.

**Root cause**: `server/config.ts` defaults `dbPath` to `server/data/todos.db`. `server/plugins/db.ts` calls `new Database(config.dbPath)`, but the `server/data/` parent directory has never been created in this repo. In generated projects, `packages/prelysia/cli/generator/scaffold.ts` line 150 creates it via `mkdirSync`, but this repo is the template source, not a generated project.

**Evidence**:
```
[elysia] const sqlite = new Database(config.dbPath)
[elysia]                    ^
[elysia] SQLiteError: unable to open database file
[elysia]       errno: 14, code: "SQLITE_CANTOPEN"
```

---

### DEFECT-3: Missing root `README.md`

| Field | Value |
|---|---|
| **Severity** | Low |
| **Priority** | Low |
| **Frequency** | Always |

**Title**: No `README.md` at project root

**Expected**: `ls .env .env.example .gitignore README.md drizzle.config.ts vite.config.ts` returns all six files.

**Actual**: `README.md: MISSING` — only exists at `packages/prelysia/README.md`.

**Note**: May be by design (template repo vs generated project). Verify intent and update either the file or the smoke test expectation.

---

## Summary

| Metric | Value |
|---|---|
| Total test cases attempted | 15 (S1-S5, D1-D4, B1-B4) |
| Passed | 3 |
| Failed | 5 |
| Blocked | 20+ (remaining U/T/C/O/P tests) |
| Defects found | 3 (2 Critical, 1 Low) |
| **Release readiness** | **NOT READY** |

### What was NOT tested (explicitly)

- **Frontend UI rendering** (U1-U4) — blocked by DEFECT-1 (broken build)
- **Theme toggle/persistence** (T1-T5) — blocked by DEFECT-1
- **CRUD feat command execution** (C1-C7) — CLI parses correctly and marker comments exist, but generator was not run to avoid modifying project files (outside QA scope per hard boundary)
- **CRUD operations** (O1-O8) — blocked by DEFECT-2 (no database)
- **Production build & preview** (P1-P5) — blocked by DEFECT-1
- **Data persistence** (B3) — blocked by DEFECT-2

### Recommended actions (for developer)

1. Add `"@stisla/style": "^3.0.1"` to both root `package.json` dependencies and `scaffold.ts` dependency list (line ~123)
2. Create `server/data/` directory or add setup instructions
3. Decide on root `README.md` — either add one or update smoke test expectation
4. Re-run smoke test after fixes
