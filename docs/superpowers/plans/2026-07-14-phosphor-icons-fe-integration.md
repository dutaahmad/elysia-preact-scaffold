# Phosphor Icons FE Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate `@phosphor-icons/react` into prelysia CLI templates and scaffolded project so all FE surfaces have icons.

**Architecture:** Add `@phosphor-icons/react` as a dependency. Import icons directly in each template function and source file. Generated module sidebar links get `CubeIcon` with a swap comment; scaffold pages get relatable icons. Tree-shaking ensures only used icons are bundled.

**Tech Stack:** Preact 10 (via compat aliases), Vite 8, TypeScript 6.0

## Global Constraints

- `@phosphor-icons/react` version `^2.1.7` (latest stable)
- Import convention: `import { IconName } from '@phosphor-icons/react'` (singular, no `Icon` suffix on import names — e.g. `House`, not `HouseIcon`)
- Icons are PascalCase components, props include `size` (number), `color`, `weight`
- All icons used: `House`, `Cube`, `CaretLeft`, `Rocket`, `CheckCircle`, `Plus`, `Pencil`, `Trash`, `X`, `Check`, `FloppyDisk`
- Swap comment format: `{/* Icon: swap Cube for a module-specific icon from @phosphor-icons/react */}`
- `verbatimModuleSyntax: true` — use `import { ... } from` not `import * as`
- No enums, no parameter properties (`erasableSyntaxOnly: true`)

---
