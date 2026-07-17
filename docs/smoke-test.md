# Smoke Test

Manual verification checklist for the prelysia scaffold. Run after `bun packages/prelysia/cli/prelysia.ts init`, after upgrades, or when unsure if things still work.

## S: Scaffold

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| S1 | Server files exist | `ls server/` | `config.ts`, `index.ts`, `plugins/db.ts`, `db/schema.ts`, `modules/todos/` present |
| S2 | Todos module files | `ls server/modules/todos/` | `schema.ts`, `types.ts`, `model.ts`, `service.ts`, `routes.ts`, `index.ts` |
| S3 | Frontend files exist | `ls src/` | `main.tsx`, `style.css`, `App.tsx`, `api/client.ts`, `hooks/useTheme.ts`, `components/ThemeToggle.tsx`, `lib/utils.ts`, `pages/Home.tsx` |
| S4 | Config files | `ls .env .env.example .gitignore README.md drizzle.config.ts vite.config.ts` | All six exist |
| S5 | Build passes | `bun run build` | Exit 0, `dist/` produced |

## D: Dev Server

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| D1 | Concurrency starts | `bun run dev` | Both vite and elysia start without errors |
| D2 | FE loads | Open `http://localhost:5173` | Dashboard page renders, no console errors |
| D3 | API proxy works | `curl http://localhost:5173/api/todos` | Returns `[]` (empty array) |
| D4 | Server live reload | Edit `server/index.ts`, save | Elysia restarts automatically |

## U: Frontend UI

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| U1 | Home page layout | Navigate to `/` | `.page__title` = "Dashboard", `.page__description` = "Welcome to your app" |
| U2 | Navbar | Top bar visible | Brand "prelysia" (rendered as `ParagraphIcon` + "relysia" text), theme toggle button |
| U3 | Sidebar | Left panel visible | "Home" link active, "Modules" group with placeholder comment |
| U4 | Sidebar collapse | Click collapse button in sidebar footer | Sidebar collapses, CaretLeft icon rotates |
| U5 | Navbar toggle (mobile) | Click navbar hamburger | Sidebar toggles open/closed |

## T: Theme

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| T1 | Toggle switches icon | Click theme toggle in navbar | Sun ↔ Moon icon swaps on each click |
| T2 | data-theme attribute | Inspect `<html>` after toggle | `data-theme="dark"` or `"light"` flips with toggle |
| T3 | Persistence | Toggle to dark, hard reload (Ctrl+F5) | `data-theme="dark"` restored from localStorage `stisla-theme` |
| T4 | OS preference fallback | Clear localStorage, reload | Matches `prefers-color-scheme` media query |
| T5 | No localStorage flash | Reload page | No theme flash (preference applied before first paint) |

## C: CRUD Module Generation

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| C1 | feat prompts | `bun cli/prelysia.ts feat categories` | Prompts for field name, type, required, default |
| C2 | Server files generated | Add field "name string required", "color string optional", then complete | 6 files under `server/modules/categories/` |
| C3 | FE files generated | After completing | `src/types/categories.ts`, `src/api/categories.ts`, `src/pages/categories/List.tsx`, `src/pages/categories/Form.tsx` |
| C4 | Module registered | Check `server/index.ts` | `.use(categoriesModule)` appended before static plugin / listen |
| C5 | Schema re-exported | Check `server/db/schema.ts` | `export { categories } from '../modules/categories/schema'` |
| C6 | App.tsx updated | Check `src/App.tsx` | Import added, sidebar link under "Modules", Route added |
| C7 | Build still passes | `bun run build` | Exit 0 |

## O: CRUD Operations

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| O1 | Empty list | Navigate to `/categories` | "No categories found." empty state |
| O2 | Create form | Click "Add New" | Form page at `/categories/new` with fields |
| O3 | Create record | Fill fields, submit | Redirects to `/categories`, new record in table |
| O4 | Validation | Submit empty required field | Form doesn't submit (HTML5 validation) or field marked invalid |
| O5 | Edit form | Click "Edit" on a row | Form pre-filled at `/categories/:id/edit` |
| O6 | Update record | Change value, submit | Redirects to list, updated value shown |
| O7 | Delete record | Click "Delete" on a row | Record removed from table (no confirmation dialog) |
| O8 | Multiple records | Create 3+ records | All display in table, scrolling works |

## P: Production Build

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| P1 | Production build | `bun run build` | Exit 0, `dist/index.html` + `.css` + `.js` produced |
| P2 | Preview serves | `bun run preview` | `localhost:3000` serves the SPA |
| P3 | SPA fallback | Navigate to `localhost:3000/categories` directly | Page loads (wouter handles routing) |
| P4 | API under preview | `curl localhost:3000/api/categories` | Returns data (not 404) |
| P5 | Static assets cached | Open DevTools → Network, reload | JS/CSS served with cache headers |

## B: Database

| # | Test Case | Steps | Expected |
|---|-----------|-------|----------|
| B1 | Migrate | `bun run db:migrate` | Tables created/updated, exit 0 |
| B2 | Generate | `bun run db:generate` | SQL files in `drizzle/` directory |
| B3 | Data persistence | Create a todo, restart server, load list | Record still present |
| B4 | SQLite file | `ls -la server/data/` | `todos.db` (or custom `DB_PATH`) exists, non-empty |
