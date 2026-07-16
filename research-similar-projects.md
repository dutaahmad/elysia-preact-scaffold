# Research: Similar Projects & Historical Parallels

**Date:** July 16, 2026
**Context:** Researching the competitive landscape for the Elysia + Preact fullstack scaffold/code generator (`prelysia` CLI).

---

## TL;DR

The project occupies a unique niche — opinionated fullstack scaffold for **Elysia + Preact + Stisla + SQLite** — in a rapidly expanding Bun scaffolding ecosystem (15+ competing projects emerged in 2025-2026). The closest analogues historically are early Rails (2004), Laravel (2011), and Django (2005), all of which started as personal tools solving a specific pain.

The Preact+Stisla combination is genuinely distinctive: almost everyone else uses React+shadcn/ui. However, the "CLI `feat` command generates CRUD modules" pattern is becoming a commodity feature — nearly every competitor has one.

---

## Direct Elysia Framework Peers (Most Similar)

### 1. Bosia (`bosapi/bosia`)

- **Stack:** Bun + Svelte 5 + ElysiaJS
- **Status:** v0.8, active development
- **Description:** Fullstack framework with SvelteKit-like DX — file-based routing (`+page.svelte`, `+server.ts`), streaming SSR, load functions, layouts, hooks.
- **CLI Commands:** `bosia create`, `bosia dev`, `bosia build`, `bosia add`, `bosia feat`
- **Notable:** Uses Bun.build instead of Vite. Has a component registry (60+ shadcn-style components). Tailwind CSS v4. Security features (CSRF, XSS) out of the box.
- **Key difference from our project:** Uses Svelte 5 (not Preact), has SSR, uses Bun.build as bundler.
- **Source:** https://github.com/bosapi/bosia | https://bosia.dev/

### 2. Elysium.js (`workbud/elysium`)

- **Stack:** Bun + ElysiaJS (framework-agnostic frontend)
- **Status:** v0.6.0, active development
- **Description:** Super-charged Elysia framework with dependency injection, modular organization, background jobs, CLI tooling, observability, caching, Redis, multi-tenant support.
- **CLI:** `bun create elysium`, CLI code generators for controllers, services, models, jobs, middlewares, modules.
- **Notable:** Most ambitious Elysia-based framework. Turborepo monorepo. Requires Redis for some features.
- **Source:** https://github.com/workbud/elysium

### 3. create-ely (`truehazker/create-ely`)

- **Stack:** ElysiaJS + React (for monorepo template)
- **Status:** Active
- **Description:** Scaffolds production-ready ElysiaJS projects. Two templates: Backend Only (PostgreSQL + Drizzle ORM + OpenAPI) or Monorepo (adds React + TanStack Router + Vite frontend).
- **Features:** Global error handling, Pino structured logging, Docker support, environment validation.
- **Source:** https://github.com/truehazker/create-ely

### 4. MantiqJS

- **Stack:** Bun (framework-agnostic frontend, Vite integration available)
- **Status:** Active
- **Description:** "Laravel-inspired" batteries-included framework for Bun. Container, router, middleware, HTTP kernel, config, encryption, hashing, cache, sessions.
- **CLI:** 17 generators (`make:model`, `make:controller`, `make:middleware`, `migrate`, `seed`, `route:list`, `tinker`, `about`)
- **Modules:** Core, Database (Eloquent-style ORM with SQLite/Postgres/MySQL/MongoDB), Auth, Validation (40+ rules), Filesystem (S3/GCS/Azure/FTP), Logging, Events, Queue (sync/SQLite/Redis/SQS/Kafka), Realtime (WebSocket/SSE/pub-sub), Heartbeat (APM dashboard), Vite integration.
- **Source:** https://github.com/Genmin/mantiq

### 5. fullstack-bun (`cdleveille`)

- **Stack:** Bun + Elysia + React + TanStack Router + Socket.IO + TanStack Query
- **Status:** Active
- **Description:** Single-page web app template focused on performance, DX, and type safety. Type-safe server/client interaction, Scalar API docs, PWA support, service worker, Docker deployment to Fly.io.
- **Notable:** Includes real-time communication via Socket.IO. No database, auth, or CSS framework.
- **Source:** https://github.com/cdleveille/fullstack-bun

### 6. Elysia Production Template (`ibrahim-eshag`)

- **Stack:** ElysiaJS + PostgreSQL + Drizzle ORM
- **Status:** Active
- **Description:** Production-ready boilerplate with Better Auth, OpenAPI/Scalar docs, rate limiting, Pino logging, CORS, Docker Compose, optional Resend + React Email.
- **Structure:** Clean architecture — common/ (config, db, logger, middleware), modules/ (auth, health, posts as example CRUD).
- **Source:** https://github.com/ibrahim-eshag/elysia-production-template

### 7. bun-api (`laoer536`)

- **Stack:** Bun + ElysiaJS + React + Vite + PostgreSQL + Prisma
- **Status:** Active
- **Description:** Monorepo with Bun Workspaces. Backend follows Controller-Service-Model architecture. Has a CRUD generator script (`bun run scripts/generate-crud.ts Post`). Redis caching, Docker.
- **Source:** https://github.com/laoer536/bun-api

---

## Broader Bun Scaffolder Ecosystem (Indirect Competitors)

### 8. devstack (`pedronauck/devstack`)

- **Stack:** Bun + Hono + React 19 (or TanStack Start) + Drizzle + PostgreSQL
- **Status:** Active, most polished in the space
- **Description:** CLI scaffold generator for production-ready monorepos. Two stack models: Separated API+SPA or TanStack Start SSR. 9 optional modules (auth, Stripe payments, email/Resend, S3 storage, Inngest background jobs, OpenTelemetry observability, Redis, Storybook).
- **Tooling:** Turborepo, Oxlint, Oxfmt, Vitest, Husky, Commitlint, GitHub Actions, Docker Compose.
- **Notable:** Most complete "product" experience. Generates AI-native projects with `CLAUDE.md`, agent skills. Template overlays merge cleanly.
- **Source:** https://github.com/pedronauck/devstack

### 9. bunkit (Archived)

- **Stack:** Multiple presets (Next.js, Hono API, Bun Fullstack, Monorepos)
- **Status:** **Archived** — creator said: "The Bun scaffolding space is well-served by `bun create`, `create-next-app`, and maintained community templates."
- **Notable:** 8 presets, shadcn/ui integration, dependency catalogs, 36 versions before archival.
- **Source:** https://github.com/Arakiss/bunkit

### 10. Mandu

- **Stack:** Bun + React 19 + Elysia? (uses Bun native)
- **Status:** Active
- **Description:** "Bun-native fullstack framework built for AI-assisted teams." Island hydration, Zod contracts, OpenAPI output, guard rules that prevent architecture drift.
- **Notable:** Explicitly designed for AI agents to edit. MCP tools, Mandu-aware skills, release checks. Guard rules catch architecture drift before it spreads.
- **Source:** https://github.com/konamgil/mandu

### 11. Better Fullstack

- **Stack:** Multi-ecosystem (TypeScript, Rust, Python, Go, Java, Elixir)
- **Status:** Active
- **Description:** Cross-ecosystem scaffolder. Supports Elysia as one of many backend options. Compat matrix validation. CLI wizard, stack builder, explicit flags, MCP server.
- **Notable:** Not Bun-specific — spans 7 ecosystems. Generated projects include `bts.jsonc` with selected stack.
- **Source:** https://better-fullstack.dev/

### 12. Foundation CLI (`ronak-create`)

- **Stack:** Multi (Next.js, Express, NestJS, FastAPI, Django + multiple DBs)
- **Status:** Active, v0.1.0
- **Description:** Dependency-aware project assembler with DAG-based conflict resolution. Can add modules to existing projects (`foundation add stripe`). Atomic writes with rollback.
- **Features:** 7 presets (SaaS, AI App, E-commerce, API Backend, Internal Tool, CRM, Dashboard). Plugin ecosystem for community modules. ORM-aware code generation.
- **Source:** https://github.com/ronak-create/Foundation-Cli

### 13. create-better-t-stack

- **Stack:** Multi (React/TanStack/Next.js, Hono/Elysia/Express, Drizzle/Prisma)
- **Status:** Active
- **Description:** CLI for end-to-end type-safe TypeScript projects. Supports Elysia as a backend option. Better Auth or Clerk. Many addons (Turborepo, Nx, PWA, Tauri, Electrobun, Biome, MCP tools, etc.).
- **Source:** https://github.com/Blackmamoth/create-better-t-stack

### 14. precast-app

- **Stack:** Multi (React/Vue/Angular/Svelte/Solid, Express/Fastify/Hono/Nest)
- **Status:** Active
- **Description:** Visual builder at precast.dev/builder + CLI scaffolder. Supports many frameworks, databases, ORMs, auth providers, AI integrations.
- **Source:** https://github.com/BuunGroupCore/precast-app

### 15. Keel (`Chafficui/keel`)

- **Stack:** Express 5 + React 19 + PostgreSQL + Drizzle + Capacitor (mobile)
- **Status:** v0.2.4
- **Description:** "Full-stack framework built for AI." Auth (BetterAuth), email (Resend + React Email), mobile (Capacitor 8). Generates AI instruction files for Claude, Cursor, Copilot, Windsurf.
- **Structure:** Monorepo with shared/, email/, frontend/, backend/ packages. "Sails" system for optional add-ons (Google OAuth, Stripe, GDPR, R2 storage, push notifications, analytics, admin dashboard, i18n).
- **Source:** https://github.com/Chafficui/keel

### 16. create-start-kit-dev

- **Stack:** TanStack Start + Bun + Drizzle + Better Auth + Stripe
- **Status:** v0.1.12
- **Description:** SaaS starter kit scaffolder. Wizard guides through branding, features, database, environment, infrastructure setup.
- **Source:** https://github.com/CarlosZiegler/start-kit.dev

---

## Preact-Specific Projects

### 17. create-electrobun-stack (`TDanks2000`)

- **Stack:** Bun + Electrobun (desktop) + React/Preact/Svelte + Vite
- **Status:** Active
- **Description:** Scaffolds desktop apps with Electrobun. **Preact is offered as a frontend option** (the only other project found doing this). Optional TanStack Router, Query, Tailwind, shadcn, SQLite, Drizzle, Turborepo.
- **Key difference:** Desktop apps via Electrobun, not web apps. This is the only other project in the entire Bun ecosystem that offers Preact.
- **Source:** https://github.com/TDanks2000/create-electrobun-stack

### 18. bun-preact-ts (`johanneslil`)

- **Stack:** Bun + Preact + TypeScript
- **Status:** Simple template
- **Description:** Minimal Preact starter using Bun's built-in dev server and bundler (no Vite). Not a scaffolder with code generation — just a basic project template.
- **Source:** https://github.com/johanneslil/bun-preact-ts

---

## Other Elysia-Specific Scaffolders/CLIs

### 19. xRiot45/elysia-js-cli

- **Description:** CLI tool for scaffolding Elysia projects. Has schematics for controller, service, route, repository, validation, model, interface, resources, config, middleware, util, enum.
- **Structure:** REST API only. Uses Drizzle, Husky, Commitlint, ESLint.
- **Source:** https://github.com/xRiot45/elysia-js-cli

### 20. kravetsone/create-elysiajs

- **Description:** Interactive scaffolder for Elysia projects. Select from linters (Biome/ESLint), ORMs (Prisma/Drizzle), plugins (CORS, Swagger, JWT, Autoload, OAuth2, HTML/JSX, Logger, Static, Bearer, Server Timing).
- **Source:** https://github.com/kravetsone/create-elysiajs

### 21. bogeychan/create-elysia

- **Description:** Official-create-elysia template. Minimal templates for bun, deno, node, node-ts, plugin.
- **Source:** https://github.com/bogeychan/create-elysia

---

## Historical Analogies (Early "Alpha State" of Fullstack Frameworks)

### Ruby on Rails (2004)

- **Origin:** David Heinemeier Hansson (DHH) extracted Rails from Basecamp (37signals). He was building PHP apps and kept redoing the same work. Discovered Ruby and built Basecamp + Rails simultaneously.
- **Killer feature:** `script/generate scaffold` — the first CRUD code generator. This was revolutionary in 2004.
- **Early state:** Frameworks were in their infancy. A 2004 Ruby mailing list roundup shows dozens of "alpha" frameworks (Borges, Arrow, Mortar, Cerise, NARF) — most are forgotten today. Rails won on **developer happiness** and **convention over configuration**.
- **Monetization:** Basecamp (the product) came first. Rails was open-source byproduct. DHH was already funded by 37signals.
- **Lesson:** Being opinionated and making developers happy > being flexible.
- **Source:** https://hipster-inc.ai/difference-between-django-laravel-and-ruby-on-rails/

### Django (2005)

- **Origin:** Adrian Holovaty and Simon Willison were building web apps for the Lawrence Journal-World newspaper. Got tired of maintaining PHP sites. Discovered Python, built Django to meet their CMS needs.
- **Killer feature:** Auto-generated admin interface from models. "Batteries included" philosophy — ORM, auth, admin, templates all built in.
- **Early state:** Extracted from a real product used in production. This gave it immediate credibility.
- **Lesson:** Building a framework from real product needs > building from theory. Django solved the newspaper's actual problems.
- **Source:** https://hipster-inc.ai/difference-between-django-laravel-and-ruby-on-rails/

### Laravel (2011)

- **Origin:** Taylor Otwell was using CodeIgniter but couldn't include functionality without radically altering code. Built Laravel in his free time (late 2010-2011) as his "own way to create web apps faster."
- **Killer feature:** Excellent documentation was the key differentiator. Elegant syntax (inspired by Rails). Built-in auth, routing, sessions, ORM (Eloquent).
- **Early state:** One person working evenings/weekends. PHP was in a "dark place" — Node was ascending, people questioned PHP's future. Otwell didn't make money until Laravel Forge launched in 2014 (3 years later).
- **Employment:** UserScape hired him and let him work on Laravel full-time for 4-6 months to build foundational features.
- **Lesson:** Documentation matters enormously. Solve a real pain (CodeIgniter inflexibility). The framework creator doesn't need to monetize the framework itself — complementary services (Forge, Vapor, Nova) are where the business lives.
- **Source:** https://workos.com/blog/taylor-otwell-laravel-interview-reinvent-2025

### Meteor (2012)

- **Origin:** Full-stack JavaScript framework with real-time by default. "One language everywhere."
- **Status:** Niche/declining. Acquired by Tiny. Lost to React + separate backend.
- **Lesson:** Full-stack JS was too early for its time. Real-time everywhere added complexity most apps don't need.

### Blitz.js / RedwoodJS (2020-2021)

- **Origin:** Rails-style conventions for React. Blitz = "Rails for React." Redwood = opinionated React fullstack with GraphQL.
- **Status:** Both still exist but niche. Blitz pivoted. Redwood continues.
- **Lesson:** Recreating Rails conventions in JS is hard. The JS ecosystem moves too fast for stability. Framework churn hurts adoption.

---

## Competitive Landscape Analysis

### Where Our Project Stands Out

| Dimension | Our Project | Most Competitors |
|-----------|-------------|------------------|
| **Frontend** | Preact | React (overwhelmingly dominant) |
| **CSS** | Stisla + Tailwind v4 | shadcn/ui + Tailwind |
| **Database** | Bun SQLite + Drizzle | PostgreSQL + Drizzle |
| **Runtime** | Bun only | Bun only (or multi-runtime) |
| **Stack flexibility** | Fixed & opinionated | User-selectable |
| **Code generation** | `feat <name>` command | Similar `generate` patterns |
| **SSR** | None (SPA) | Many have SSR |
| **Auth module** | Not yet included | Most include Better Auth or similar |
| **AI-native features** | Not yet | Emerging trend (Mandu, Keel, devstack) |

### Key Insights

1. **The space is crowded.** 15+ active projects in Bun scaffolding. Several are well-funded (devstack) or have significant traction. The creator of bunkit archived their project explicitly citing market saturation.

2. **Preact + Stisla is genuinely unique.** No other web scaffolder offers Preact. Stisla (Bootstrap-based admin theme) vs shadcn/ui is a different aesthetic target. This could be a real differentiator or a niche too small to sustain.

3. **Auth is the #1 feature gap.** Every established competitor includes auth (Better Auth, JWT, or similar). This may be the single feature that determines whether a user adopts our scaffolder vs someone else's.

4. **The "generate CRUD" pattern is commoditized.** Almost every competitor has a `feat`, `generate`, `make:model`, or `scaffold` command. This alone won't differentiate.

5. **AI-native features are emerging as table stakes.** Mandu, devstack, and Keel all generate `CLAUDE.md`, MCP tools, and agent instructions. This is a 2026 trend that will likely become expected.

6. **No monetization model is proven yet.** None of the Elysia/Bun scaffolders have a business model. devstack is the most polished but still free. The Laravel model (free framework → paid complementary services) is the most proven path.

7. **SQLite is pragmatically smart.** Most competitors target PostgreSQL. Bun SQLite + Drizzle is lighter, faster to set up, and aligns with Bun's "single process" philosophy. This appeals to the prototyping/small-project crowd.

### Open Questions

1. **Auth integration:** Is Better Auth on the roadmap? This is the most impactful feature to add.
2. **PostgreSQL support:** Needed for production adoption, or is SQLite-only acceptable?
3. **Target audience:** Is the target "Preact+Stisla developers specifically" or "anyone who wants a quick scaffold"? If the latter, the fixed stack is a limitation.
4. **Monetization:** Free forever, consulting, deployment service (Forge-like), or paid add-ons?
5. **AI features:** `CLAUDE.md` generation, MCP tools, agent instructions — becoming expected in 2026.
6. **Sustainability:** The bunkit cautionary tale suggests maintaining a scaffolder is significant work with unclear rewards.

---

## References

### Elysia/Bun Scaffolders
- Bosia: https://github.com/bosapi/bosia | https://bosia.dev/
- Elysium.js: https://github.com/workbud/elysium
- create-ely: https://github.com/truehazker/create-ely
- MantiqJS: https://github.com/Genmin/mantiq
- fullstack-bun: https://github.com/cdleveille/fullstack-bun
- Elysia Production Template: https://github.com/ibrahim-eshag/elysia-production-template
- bun-api: https://github.com/laoer536/bun-api
- devstack: https://github.com/pedronauck/devstack
- bunkit: https://github.com/Arakiss/bunkit
- Mandu: https://github.com/konamgil/mandu
- Better Fullstack: https://better-fullstack.dev/
- Foundation CLI: https://github.com/ronak-create/Foundation-Cli
- create-better-t-stack: https://github.com/Blackmamoth/create-better-t-stack
- precast-app: https://github.com/BuunGroupCore/precast-app
- Keel: https://github.com/Chafficui/keel
- create-electrobun-stack: https://github.com/TDanks2000/create-electrobun-stack
- bun-preact-ts: https://github.com/johanneslil/bun-preact-ts
- xRiot45/elysia-js-cli: https://github.com/xRiot45/elysia-js-cli
- kravetsone/create-elysiajs: https://github.com/kravetsone/create-elysiajs
- bogeychan/create-elysia: https://github.com/bogeychan/create-elysia

### Guides & Analysis
- StarterPick: Best ElysiaJS Bun Boilerplates 2026: https://starterpick.com/guides/best-elysiajs-bun-boilerplates-2026
- ElysiaJS fullstack dev server: https://elysiajs.com/patterns/fullstack-dev-server

### Historical
- Rails vs Django vs Laravel history: https://hipster-inc.ai/difference-between-django-laravel-and-ruby-on-rails/
- Taylor Otwell interview on Laravel origins: https://workos.com/blog/taylor-otwell-laravel-interview-reinvent-2025
- Taylor Otwell on Laravel's early days (Syntax FM): https://syntax.fm/show/824/taylor-otwell-s-opinions-on-php-react-laravel-and-lamborghini-memes/transcript
- 2004 Ruby framework roundup (alpha state): https://rubytalk.org/t/ruby-web-application-framework-roundup/9970
