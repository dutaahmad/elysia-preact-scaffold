---
name: generate-daily-report
description: >-
  Use when the user requests a daily report of git activity with a specific
  date — phrases like "generate report 26 June 2026", "report for 26 June 2026",
  "generate report DD MMMM YYYY", or similar patterns where a date is explicitly
  mentioned alongside "report".
---

# Generate Daily Report

Generate a daily git activity report for Nahdi Duta Ahmad from the repo root and all its submodules.

## Workflow

### 1. Parse the date

Extract the date from the user's message. Expected format: `DD MMMM YYYY` (e.g., "26 June 2026").
- Convert to `YYYY-MM-DD` format for git queries
- If the date is ambiguous or unparseable, ask the user to clarify

### 2. Discover submodules

Read `.gitmodules` from the repo root to find all active submodules:

```bash
# Extract active submodule paths (skip commented-out entries)
git config --file .gitmodules --get-regexp ^submodule\..*\.path$ | awk '{print $2}'
```

Also include the root repo itself.

### 3. Collect commits from root repo + each submodule

For each location, run:

```bash
git -C <path> log --all \
  --author="Nahdi Duta Ahmad" \
  --since="YYYY-MM-DD 00:00:00 +0700" \
  --until="YYYY-MM-DD 23:59:59 +0700" \
  --format="* %h %s (%ai)"
```

- Use `--all` to include all branches
- Search for exact author name `Nahdi Duta Ahmad`. If no results, try alternative name variants like `nahdi.duta` or `nahdi duta ahmad` in a second pass
- Always use `+0700` as the timezone (Asia/Jakarta)
- Use `git -C <path>` so it works with submodule `.git` files
- If a submodule directory doesn't exist or isn't a git repo, skip it gracefully

### 4. Compile the report

Write the report to `docs/reports/YYYY-MM-DD.md` relative to the repo root.

**Format:**

```markdown
# Daily Report — DD MMMM YYYY
**Author:** Nahdi Duta Ahmad

## <repo-name>
<commits or "No activity">

## <submodule-name>
<commits or "No activity">
...
```

- Sort submodules alphabetically
- If a submodule has no matching commits, show `No activity` — do not omit it
- If the `docs/reports/` directory doesn't exist, create it

### 5. Notify the user

After writing the file, tell the user the report was saved at `docs/reports/YYYY-MM-DD.md`.

## Examples

**User:** generate report 26 June 2026
**Agent:** Parses 2026-06-26, scans root + all submodules, writes `docs/reports/2026-06-26.md`, reports back.

**User:** report for 30 May 2026
**Agent:** Same workflow, uses 2026-05-30.

## Edge cases

- **Submodule not initialized** — `git -C <path>` will fail. Catch the error and show "Not initialized" instead of "No activity"
- **No commits in any repo** — Report still generated with all submodules showing "No activity"
- **Date in different format** — If the date doesn't match `DD MMMM YYYY`, ask for clarification rather than guessing
- **Not in a git repo root** — If this isn't a git repo root (no `.gitmodules`), use only the current repo
