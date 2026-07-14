---
name: create-manual-tests-doc
description: Use when a new feature is added — a new backend endpoint, socket, queue pub/sub, UI component, or 3+ new frontend functions (excluding simple helpers). Also use when the user explicitly asks to create or update a manual tests document.
---

# Create / Update Manual Tests Document

## Overview
Keep a manual tests document (`docs/manual-test.md`, `docs/smoke-test.md`, etc.) in sync with the codebase. Whenever a new feature lands, a corresponding test case row must be added. If no such document exists, create one.

## When to Use

| Trigger | Examples |
|---------|----------|
| New backend endpoint | `GET /api/orders`, `POST /api/checkout` |
| New socket / queue | WebSocket room, Bull queue, Redis pub/sub |
| New UI component | `OrderCard`, `CheckoutForm`, `Navbar` |
| 3+ new frontend functions (excluding trivial helpers) | 3+ event handlers, formatters, or utilities — but NOT one-liner `cn()`, `formatDate`, or similar |
| User explicitly asks | "write a smoke test", "create manual tests doc", "add test cases" |

**When NOT to use:**
- Simple helper function (1-2 lines, pure utility)
- Renaming or refactoring without behavior change
- Config changes (env vars, tsconfig)

## Workflow

### 1. Locate existing manual tests document

Glob for all three patterns under `docs/`:

```bash
glob docs/*test*
glob docs/*manual*
glob docs/*smoke*
```

If multiple match, prefer the one with the most recent git modification date. If none match, proceed to create.

### 2. Scan actual changes

Read `git diff --stat` (or similar) and inspect new/modified files to identify what qualifies as a new feature.

### 3. Update or create

**If document exists:**
- Add test case rows to the appropriate section(s), or add new sections if no existing section fits
- Use the same table format as existing rows (`| # | Test Case | Steps | Expected |`)
- Prefix IDs with the section initials (e.g., `A1`, `A2` for "API")

**If no document exists:**
- Create at `docs/manual-test.md`
- Template:

```markdown
# Manual Test

Manual verification checklist.

## A: API

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| A1 | ... | ... | ... |

## U: UI

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| U1 | ... | ... | ... |
```

### 4. Versioning (only when user asks)

If the user explicitly requests versioning (e.g., "version this", "add versioning", "use semver"):

- **First time:** Add YAML frontmatter with `version: 1.0.0`
- **On subsequent changes** (user must have already opted in):
  - `MAJOR` — restructure, destructive changes (split doc, change format, remove sections)
  - `MINOR` — adding new test cases or sections
  - `PATCH` — fixing typos, reordering, clarifying steps
- **Always increment** on any change once versioning is opted in

### 5. Notify the user

Tell the user:
- Location of the document
- What sections / rows were added or modified
- If versioning is active, the new version number

## Quick Reference

### Table Format

```
| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| A1 | Test name | step-by-step | expected outcome |
```

### Section Prefix Conventions

| Area | Prefix |
|------|--------|
| API / Endpoints | `A` |
| UI / Components | `U` |
| Theme | `T` |
| Database | `B` |
| Build / Deploy | `P` |
| Scaffold / Setup | `S` |
| Feature-specific | First letter of feature name |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Creating a new doc when one already exists | Always glob first, modify in place |
| Skipping because "it's just one endpoint" | Every feature gets at least one test case row |
| Adding version without being asked | Only version when user explicitly requests |
| Vague "Steps" column like "test it" | Write concrete actions ("Click X, type Y, observe Z") |

## Red Flags

- "No existing doc, I'll skip creating one" → Must create one
- "It's just a small change" → Still gets a test case row
- "I'll add version later without asking" → Versioning is opt-in only
- "This is just a helper" → Verify: is it 3+ functions? Are they truly trivial (1-2 lines)?
