# prelysia-cli

Elysia + Preact fullstack scaffold CLI.

## Prerequisites

- [Bun](https://bun.sh) >= 1.3

## Install

```bash
bun install -g prelysia-cli
```

## Usage

```bash
# Scaffold a new fullstack project
prelysia init my-project

# Add a CRUD module
prelysia feat todos

# Add frontend-only assets (skip server module)
prelysia feat --fe-only widgets

# Add backend-only module (skip frontend assets)
prelysia feat --be-only widgets

# Remove a module
prelysia remove todos
```

## What you get

- **Backend**: Elysia 1.4 with modular monolith (plugin per domain), Bun SQLite + Drizzle ORM, validation via drizzle-typebox
- **Frontend**: Preact 10 + Vite 8 + wouter + TanStack Query, Stisla CSS, Tailwind v4, Phosphor icons

## License

MIT
