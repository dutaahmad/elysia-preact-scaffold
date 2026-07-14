---
name: suggest-commit-message
description: Use when asked to suggest commit messages, write commit messages, or help with git commits - analyzes staged/unstaged changes and provides context-aware commit message suggestions without executing commits
---

# Suggest Commit Message

## Overview
Analyze git changes and suggest appropriate commit messages based on actual code changes. Never execute commits - only suggest.

## When to Use
- User asks "suggest commit" or "commit message"
- User asks "what should I commit as"
- User asks for help writing a commit message
- User says "suggest commit <submodule>"

## Core Rules

1. **NEVER execute git commit** - only suggest messages
2. **Always read actual changes** - staged, unstaged, and untracked
3. **Provide context** - explain why this message fits the changes
4. **Handle submodules** - detect and work in correct directory

## Quick Reference

### Command Patterns
- `suggest commit` - current directory
- `suggest commit auth` - specific submodule
- `suggest commit message` - current directory

### Commit Message Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore, perf, ci, build, revert

## Implementation

### Step 1: Detect Context
```bash
# Check if in git repo
git rev-parse --git-dir

# Check if submodule
git rev-parse --show-superproject-working-tree
```

### Step 2: Read Changes
```bash
# Staged changes
git diff --cached

# Unstaged changes
git diff

# Untracked files
git ls-files --others --exclude-standard

# Summary of changes
git status --short
```

### Step 3: Analyze and Suggest
- Identify change patterns
- Determine commit type
- Write clear description
- Add body if needed

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Committing without suggesting | Only suggest, never execute |
| Generic messages like "update code" | Analyze actual changes |
| Ignoring unstaged changes | Read both staged and unstaged |
| Not handling submodules | Detect and cd into correct directory |

## Examples

### Example 1: Simple bug fix
```bash
$ git diff --cached
--- a/src/auth.ts
+++ b/src/auth.ts
@@ -45,6 +45,7 @@
   if (!token) {
+    logger.warn('Missing token');
     return null;
   }
```

**Suggestion:**
```
fix(auth): add warning log for missing token

Adds logger.warn() when token is missing to help with debugging
authentication issues in production.
```

### Example 2: Feature with multiple files
```bash
$ git status --short
M  src/components/UserProfile.vue
M  src/api/user.ts
A  src/types/user.ts
```

**Suggestion:**
```
feat(user): add user profile component

- Add UserProfile.vue component with edit functionality
- Add user API endpoints for fetching/updating profile
- Add TypeScript types for user data
```

## Red Flags - STOP

- About to run `git commit` → STOP, only suggest
- No changes detected → inform user, don't suggest empty message
- In wrong directory → detect and correct before analyzing
