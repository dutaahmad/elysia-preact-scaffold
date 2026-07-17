import { mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { writeFileTree, writeJson, readJson, pathExists } from '../utils/fs'
import {
  serverIndexTemplate,
  serverConfigTemplate,
  loggerPluginTemplate,
  dbPluginTemplate,
  drizzleConfigTemplate,
  envExampleTemplate,
  envLocalTemplate,
  gitignoreTemplate,
  indexHtmlTemplate,
  viteConfigTemplate,
} from '../templates/project'
import { schemaTemplate } from '../templates/server-schema'
import { typesTemplate } from '../templates/server-types'
import { modelTemplate } from '../templates/server-model'
import { serviceTemplate } from '../templates/server-service'
import { routesTemplate, indexTemplate } from '../templates/server-routes'
import { feClientTemplate } from '../templates/fe-client'
import { feAppTemplate, feMainTemplate, feHomeTemplate } from '../templates/fe-entry'
import { feStyleTemplate, feUseThemeTemplate, feThemeToggleTemplate, feUtilsTemplate } from '../templates/fe-theme'

export async function scaffoldProject(targetDir: string, projectName: string): Promise<void> {
  try {
    const files: Record<string, string> = {}

    files['server/index.ts'] = serverIndexTemplate()
    files['server/config.ts'] = serverConfigTemplate()
    files['server/db/schema.ts'] = `export { todos } from '../modules/todos/schema'\n`
    files['server/plugins/db.ts'] = dbPluginTemplate()
    files['server/plugins/logger.ts'] = loggerPluginTemplate()
    files['drizzle.config.ts'] = drizzleConfigTemplate()
    files['.env'] = envLocalTemplate()
    files['.env.example'] = envExampleTemplate()
    files['.gitignore'] = gitignoreTemplate()
    files['index.html'] = indexHtmlTemplate(projectName)
    files['vite.config.ts'] = viteConfigTemplate()

    const __filename = fileURLToPath(import.meta.url)
    const readmePath = join(dirname(__filename), '../templates/USER_README.md')
    files['README.md'] = readFileSync(readmePath, 'utf-8').replace('{{projectName}}', projectName)

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

    files['src/main.tsx'] = feMainTemplate()
    files['src/style.css'] = feStyleTemplate()
    files['src/hooks/useTheme.ts'] = feUseThemeTemplate()
    files['src/components/ThemeToggle.tsx'] = feThemeToggleTemplate()
    files['src/lib/utils.ts'] = feUtilsTemplate()
    files['src/api/client.ts'] = feClientTemplate()
    files['src/pages/Home.tsx'] = feHomeTemplate()
    files['src/App.tsx'] = feAppTemplate()

    await writeFileTree(targetDir, files)

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
      'db:studio': 'drizzle-kit studio --host 0.0.0.0',
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
      '@stisla/style': '^3.0.1',
      '@stisla/vanilla': '^3.0.2',
      clsx: '^2.1.1',
      logixlysia: '^6.6.0',
      preact: '^10.29.3',
      'tailwind-merge': '^3.6.0',
    }
    pkg.dependencies = { ...deps, ...(pkg.dependencies as Record<string, string> || {}) }

    const devDeps: Record<string, string> = {
      '@libsql/client': '^0.17.4',
      '@preact/preset-vite': '^2.10.5',
      '@tailwindcss/vite': '^4.1.7',
      'drizzle-kit': '^0.31.10',
      '@types/bun': '^1.3.14',
      concurrently: '^10.0.3',
      tailwindcss: '^4.1.7',
      typescript: '~6.0.2',
      vite: '^8.1.1',
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

    mkdirSync(join(targetDir, 'server/data'), { recursive: true })
    console.log('  \u2713 Created server/data/ directory')

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
  } catch (err) {
    console.error('  \u2717 Scaffold failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}
