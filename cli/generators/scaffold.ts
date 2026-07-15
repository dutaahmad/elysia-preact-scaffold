import { join } from 'path'
import { writeFileTree, writeJson, writeText, readJson, pathExists, readText } from '../utils/fs'
import { serverIndexTemplate, serverConfigTemplate, dbPluginTemplate } from '../templates/project'
import { schemaTemplate, typesTemplate, modelTemplate, serviceTemplate, routesTemplate, indexTemplate } from '../templates/module'
import { feClientTemplate, feAppTemplate, feHomeTemplate } from '../templates/fe'

export async function scaffoldProject(targetDir: string, projectName: string): Promise<void> {
  const files: Record<string, string> = {}

  files['server/index.ts'] = serverIndexTemplate()
  files['server/config.ts'] = serverConfigTemplate()

  files['server/db/schema.ts'] = `export { todos } from '../modules/todos/schema'\n`

  files['server/plugins/db.ts'] = dbPluginTemplate()

  const todoFields = [
    { name: 'title', type: 'string' as const, required: true },
    { name: 'completed', type: 'boolean' as const, required: false, default: false },
  ]
  files['server/modules/todos/schema.ts'] = schemaTemplate('todos', todoFields)
  files['server/modules/todos/types.ts'] = typesTemplate('todos')
  files['server/modules/todos/model.ts'] = modelTemplate('todos', todoFields)
  files['server/modules/todos/service.ts'] = serviceTemplate('todos')
  files['server/modules/todos/routes.ts'] = routesTemplate('todos')
  files['server/modules/todos/index.ts'] = indexTemplate('todos')

  files['drizzle.config.ts'] = `import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  schema: './server/db/schema.ts',
  dbCredentials: {
    url: process.env.DB_PATH ?? 'server/data/todos.db',
  },
})
`

  files['.env'] = `PORT=3000
DB_PATH=server/data/todos.db
NODE_ENV=development
`

  files['src/main.tsx'] = `// @ts-expect-error - no type declarations for vanilla JS package
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './app'

render(<App />, document.getElementById('app')!)
`

  files['src/style.css'] = `@import "tailwindcss";
@import "@stisla/style/theme.css";
@import "@stisla/style/components.css";
@source "./src";

html, body, #app {
  height: 100%;
  margin: 0;
}
#app {
  display: flex;
  flex-direction: column;
}
.app-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
.app-main {
  flex: 1;
  overflow-y: auto;
}

`

  files['src/hooks/useTheme.ts'] = `import { useState, useEffect } from 'preact/hooks'

const STORAGE_KEY = 'stisla-theme'

function getInitialTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return [theme, toggle]
}
`
  files['src/components/ThemeToggle.tsx'] = `import { Sun, Moon } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()

  return (
    <button class={cn('button', 'button--ghost', 'button--sm')} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
`

  files['src/lib/utils.ts'] = `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
  files['src/api/client.ts'] = feClientTemplate()
  files['src/pages/Home.tsx'] = feHomeTemplate()
  files['src/App.tsx'] = feAppTemplate()

  await writeFileTree(targetDir, files)

  const viteConfigPath = join(targetDir, 'vite.config.ts')
  if (pathExists(viteConfigPath)) {
    let viteContent = await readText(viteConfigPath)
    if (!viteContent.includes('proxy')) {
      viteContent = viteContent.replace(
        /(plugins:\s*\[.*?\],)/,
        `$1
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },`,
      )
      await writeText(viteConfigPath, viteContent)
    }
    console.log('  \u2713 Updated vite.config.ts')
  }

  const pkgPath = join(targetDir, 'package.json')
  let pkg: Record<string, unknown>

  if (pathExists(pkgPath)) {
    pkg = await readJson(pkgPath)
  } else {
    pkg = {
      name: projectName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {},
      dependencies: {},
      devDependencies: {},
    }
  }

  pkg.scripts = {
    dev: `concurrently -n "vite,elysia" -c "cyan,green" "vite" "bun run --watch server/index.ts"`,
    'dev:fe': 'vite',
    'dev:be': 'bun run --watch server/index.ts',
    build: 'vite build',
    preview: 'NODE_ENV=production bun run server/index.ts',
    'db:generate': 'drizzle-kit generate',
    'db:migrate': 'drizzle-kit push',
    'db:studio': 'drizzle-kit studio',
    ...(pkg.scripts as Record<string, string> || {}),
  }

  const deps: Record<string, string> = {
    '@elysia/cors': '^1.4.2',
    '@elysia/static': '^1.4.11',
    'drizzle-orm': '^0.45.2',
    'drizzle-typebox': '^0.3.3',
    elysia: '^1.4.29',
    wouter: '^3.10.0',
    '@tanstack/preact-query': '^5.101.2',
    '@phosphor-icons/react': '^2.1.7',
    '@stisla/css': '^3.0.1',
    '@stisla/vanilla': '^3.0.0',
  }
  pkg.dependencies = { ...deps, ...(pkg.dependencies as Record<string, string> || {}) }

  const devDeps: Record<string, string> = {
    '@libsql/client': '^0.17.4',
    '@tailwindcss/vite': '^4.1.7',
    'drizzle-kit': '^0.31.10',
    '@types/bun': '^1.3.14',
    concurrently: '^10.0.3',
    tailwindcss: '^4.1.7',
  }
  pkg.devDependencies = { ...(pkg.devDependencies as Record<string, string> || {}), ...devDeps }

  await writeJson(pkgPath, pkg)
  console.log('  \u2713 Updated package.json')

  console.log('\nRunning bun install...')
  const install = Bun.spawnSync(['bun', 'install'], { cwd: targetDir })
  if (install.exitCode === 0) {
    console.log('  \u2713 Dependencies installed')
  } else {
    console.error('  \u2717 bun install failed:', install.stderr.toString())
  }

  console.log('\nRunning database migration...')
  const migrate = Bun.spawnSync(['bunx', 'drizzle-kit', 'push'], { cwd: targetDir })
  if (migrate.exitCode === 0) {
    console.log('  \u2713 Database tables created')
  } else {
    const stderr = migrate.stderr.toString()
    if (stderr.includes('no such table') || stderr.includes('already exists')) {
      console.log('  \u2192 Database already set up')
    } else {
      console.error('  \u2717 Migration failed:', stderr)
    }
  }

  console.log(`\nProject scaffolded at ${targetDir}`)
  console.log('Run: bun run dev')
}
