# Code Review — 2026-07-16

**Branch:** `feat/init-enhancements`
**Scope:** `prelysia init` enhancements — SQLite DB auto-creation, `.env`/`.env.example`/`.gitignore` generation, developer-friendly `README.md`
**Reviewer:** Automated code review

---

## Review Summary

| Severity      | Count |
| ------------- | ----- |
| 🔴 Blocking   | 0     |
| 🟡 Should fix | 2     |
| 🟢 Consider   | 3     |

---

## Files Changed

| File | Status | Lines |
|------|--------|-------|
| `packages/prelysia/cli/templates/project.ts` | Modified | +26/−1 |
| `packages/prelysia/cli/generator/scaffold.ts` | Modified | +16/−3 |
| `packages/prelysia/cli/templates/USER_README.md` | **New** | +164 |

Also included in diff (pre-existing, not part of this feature):
| `CONTRIBUTE.md` | Modified | +52 |

---

## 🟡 Should Fix

### W1. DB path inconsistency in USER_README.md

**File:** `packages/prelysia/cli/templates/USER_README.md:123`
**Severity:** Should fix

**What's wrong:** The Database section of the Tech Stack Details says:

> The database file lives at `server/data/app.db` (configurable via `DB_PATH`).

But the actual default in `.env` and `drizzle.config.ts` is `server/data/todos.db`. The Environment Variables table (line 143) correctly documents `server/data/todos.db`. These two references contradict each other.

**Fix:** Change line 123 to use the actual default:

```diff
- The database file lives at `server/data/app.db` (configurable via `DB_PATH`).
+ The database file lives at `server/data/todos.db` (configurable via `DB_PATH`).
```

---

### W2. `.env.example` default mismatches `.env` default

**File:** `packages/prelysia/cli/templates/project.ts` — `envExampleTemplate()`
**Severity:** Should fix

**What's wrong:** The `.env.example` uses `DB_PATH=server/data/app.db` while the actual `.env` uses `DB_PATH=server/data/todos.db`. If a user copies `.env.example` → `.env` directly (a common workflow), the DB path won't match the default fallback in `drizzle.config.ts` and `server/config.ts`:

```ts
// drizzle.config.ts
dbCredentials: { url: process.env.DB_PATH ?? 'server/data/todos.db' }

// server/config.ts
dbPath: process.env.DB_PATH || 'server/data/todos.db',
```

Since `.env.example` is meant to document the expected variables, it should either:
- Use the same default values as `.env` (alignment), or
- Use placeholder values like `your-database-path-here` and add a comment explaining how to set it

**Fix (Option A — alignment):**

```diff
- DB_PATH=server/data/app.db
+ DB_PATH=server/data/todos.db
```

**Fix (Option B — placeholders):**

```
# Database (SQLite file path, relative to project root)
# Default: server/data/todos.db
DB_PATH=your-database-path-here
```

---

## 🟢 Consider

### C1. `__filename` variable name in ESM context

**File:** `packages/prelysia/cli/generator/scaffold.ts:38`
**Severity:** Consider

**What's wrong:** The variable `__filename` is a Node.js CommonJS convention. In an ESM file (using `import.meta.url`), using this name is misleading — there is no real `__filename` in ESM. The code is functionally correct but could confuse readers.

```ts
const __filename = fileURLToPath(import.meta.url)
```

**Suggestion:** Use a name that reflects ESM semantics:

```ts
const cliEntryPath = fileURLToPath(import.meta.url)
const readmePath = join(dirname(cliEntryPath), '../templates/USER_README.md')
```

---

### C2. `.replace()` only replaces first occurrence

**File:** `packages/prelysia/cli/generator/scaffold.ts:40`
**Severity:** Consider

**What's wrong:** `String.prototype.replace()` with a string argument only replaces the first match. Currently `{{projectName}}` appears only once in `USER_README.md` (in the title), so this works fine. But if someone later adds another `{{projectName}}` in the template, only the first one would be replaced — silently leaving the second placeholder verbatim.

```ts
files['README.md'] = readFileSync(readmePath, 'utf-8').replace('{{projectName}}', projectName)
```

**Suggestion:** Use a global regex for robustness:

```ts
files['README.md'] = readFileSync(readmePath, 'utf-8').replace(/{{projectName}}/g, projectName)
```

---

### C3. No `.gitignore` comments

**File:** `packages/prelysia/cli/templates/project.ts` — `gitignoreTemplate()`
**Severity:** Consider

**What's wrong:** The `.gitignore` is generated without comments, which reduces readability for developers unfamiliar with the project structure. Major frameworks typically annotate each section.

**Before:**
```
node_modules
dist
.env
*.db
```

**Suggestion:** Add section comments:

```
# Dependencies
node_modules

# Build output
dist

# Environment
.env

# Database files
*.db
*.db-wal
*.db-shm

# Drizzle migration artifacts
drizzle/

# OS files
*.local
.DS_Store
```

---

## ✅ Things Done Well

### Architecture & Maintainability

- **Three dedicated template functions** (`envExampleTemplate`, `envLocalTemplate`, `gitignoreTemplate`) keep concerns separated rather than inlining.
- **Physical `USER_README.md` file** is the right approach for a large Markdown document — avoids embedding 164 lines in a template string.
- **`server/data/` directory** is created with `recursive: true` between `bun install` and `drizzle-kit push`, ensuring the SQLite file target exists before migration runs.
- **The `{{projectName}}` interpolation pattern** is lightweight and avoids a full templating engine.

### Correctness

- **Scaffold verified end-to-end**: ran `prelysia init /tmp/test-init-features` — all four new files (`.env`, `.env.example`, `.gitignore`, `README.md`) were created with correct content, and the SQLite database was generated with tables.
- **Error handling**: `readFileSync` failure on `USER_README.md` will be caught by the outer `try/catch` in `scaffoldProject()` — graceful failure message rather than a crash.
- **Import hygiene**: uses `import type` for type-only imports (none in the changed code), consistent with `verbatimModuleSyntax: true`.
- **No `any` usage**: all template functions are fully typed.

### Developer Experience

- **Comprehensive README**: covers tech stack, quick start, all commands, project structure, module generation, env reference, and deployment — comparable to major framework generated READMEs.
- **`.env.example`** is documented with section comments, making it clear which variables are needed.
- **`.gitignore`** covers database files (`*.db`, `*.db-wal`, `*.db-shm`) which would otherwise leak data if committed.

---

## Priority Action Items

| Priority | Issue | File(s) | Effort |
| -------- | ----- | ------- | ------ |
| **P1** | Fix DB path inconsistency (W1) | `USER_README.md:123` | 1 min |
| **P1** | Align `.env.example` default with actual default (W2) | `project.ts` — `envExampleTemplate()` | 1 min |
| **P3** | Rename `__filename` variable (C1) | `scaffold.ts:38` | 1 min |
| **P3** | Use global regex for `{{projectName}}` (C2) | `scaffold.ts:40` | 1 min |
| **P3** | Add comments to `.gitignore` template (C3) | `project.ts` — `gitignoreTemplate()` | 2 min |

---

_Generated 2026-07-16 via automated code review for `feat/init-enhancements` branch._
