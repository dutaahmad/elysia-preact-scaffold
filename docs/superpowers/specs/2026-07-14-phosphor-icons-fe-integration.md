# Phosphor Icons FE Integration

## Objective

Integrate `@phosphor-icons/react` into the `prelysia` CLI templates and scaffolded project so all FE surfaces have icons. Generated module pages get a generic icon with a swap comment; scaffold pages get relatable icons.

## Package

- `@phosphor-icons/react` (React package, works via Preact compat aliases already in `tsconfig.app.json`)
- Import convention: `import { HouseIcon, CubeIcon } from '@phosphor-icons/react'`
- All icons: PascalCase + `Icon` suffix, props: `size`, `color`, `weight`, etc.
- Tree-shakeable — only imported icons end up in the bundle.

## Changes

### Dependencies

| File | Change |
|------|--------|
| `package.json` | Add `"@phosphor-icons/react": "^2.1.?"` to dependencies |
| `cli/generators/scaffold.ts` | Add `@phosphor-icons/react` to the scaffold deps map |

### Templates (`cli/templates/fe.ts`)

| Template | Changes |
|---|---|
| `feAppTemplate()` | HouseIcon on "Home" sidebar link; CubeIcon (with swap comment) on generated module sidebar links; CaretLeftIcon on collapse button |
| `feHomeTemplate()` | RocketIcon in welcome card header; CheckCircleIcon on each quick-start step |
| `feListPageTemplate()` | PlusIcon before "Add New" link; PencilIcon inside Edit button; TrashIcon inside Delete button |
| `feFormPageTemplate()` | XIcon before Cancel link; CheckIcon before submit button |

### Module generator (`cli/generators/module.ts`)

- `sidebarItem` string (~line 124) updated to include `<CubeIcon size={20} />` with swap comment

### Source files (current repo)

| File | Changes |
|---|---|
| `src/App.tsx` | Sync with `feAppTemplate()` icons |
| `src/pages/Home.tsx` | Sync with `feHomeTemplate()` icons |

## Generic icon convention

- Generated module sidebar links use `CubeIcon` with: `{/* Icon: swap CubeIcon for a module-specific icon from @phosphor-icons/react */}`
- Action buttons (Plus, Pencil, Trash, Check, X) use specific icons — they're framework-level, not module-specific.

## Out of scope

- Server-side templates (no UI)
- API client, types templates (no UI)
- `style.css`, `main.tsx`, `drizzle.config.ts`, etc.
