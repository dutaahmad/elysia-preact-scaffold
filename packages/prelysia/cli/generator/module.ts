import { join } from 'path'
import { toKebabCase, toPascalCase } from '../utils/name'
import { writeFileTree, readText, writeText, pathExists, removeDir } from '../utils/fs'
import {
  schemaTemplate,
} from '../templates/server-schema'
import { typesTemplate } from '../templates/server-types'
import { modelTemplate } from '../templates/server-model'
import { serviceTemplate } from '../templates/server-service'
import { routesTemplate, indexTemplate } from '../templates/server-routes'
import { feTypesTemplate } from '../templates/fe-types'
import { feApiTemplate } from '../templates/fe-api'
import {
  feListPageTemplate,
  feCreatePageTemplate,
  feEditPageTemplate,
  fePagesBarrelTemplate,
} from '../templates/fe-pages'
import type { FieldDef } from '../types'

async function updateDbSchema(serverPath: string, tableName: string): Promise<boolean> {
  const schemaPath = join(serverPath, 'db', 'schema.ts')
  if (!pathExists(schemaPath)) {
    await writeText(schemaPath, `export { ${tableName} } from '../modules/${tableName}/schema'\n`)
    return true
  }

  const content = await readText(schemaPath)
  const exportLine = `export { ${tableName} } from '../modules/${tableName}/schema'`
  if (!content.includes(tableName)) {
    await writeText(schemaPath, content.trimEnd() + '\n' + exportLine + '\n')
  }
  return true
}

async function updateServerIndex(serverPath: string, moduleName: string, camelName: string): Promise<boolean> {
  const indexPath = join(serverPath, 'index.ts')
  if (!pathExists(indexPath)) return false

  const content = await readText(indexPath)
  const lines = content.split('\n')

  const importLine = `import { ${camelName}Module } from './modules/${moduleName}'`

  const useLine = `  .use(${camelName}Module)`

  if (content.includes(importLine)) return false
  if (content.includes(useLine)) return false

  const lastImportIdx = lines.reduce((max, line, i) => {
    return line.startsWith('import ') ? i : max
  }, -1)

  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine)
  }

  const lastUseIdx = lines.reduce((max, line, i) => {
    return line.trimStart().startsWith('.use(') ? i : max
  }, -1)
  const insertIdx = lastUseIdx >= 0 ? lastUseIdx + 1 : -1

  if (insertIdx > 0) {
    lines.splice(insertIdx, 0, useLine)
  }

  await writeText(indexPath, lines.join('\n'))
  return true
}

function ensureCubeIconImport(lines: string[]): boolean {
  const idx = lines.findIndex((l) => l.includes("from '@phosphor-icons/react'"))
  if (idx < 0) return false
  const line = lines[idx]
  if (line.includes('CubeIcon')) return false

  const match = line.match(/\{([^}]+)\}/)
  if (!match) return false

  const existing = match[1].trim()
  const indent = line.match(/^(\s*)/)?.[1] || ''
  if (existing.endsWith(',')) {
    lines[idx] = line.replace(/\{[^}]+\}/, `{ ${existing} CubeIcon }`)
  } else {
    lines[idx] = line.replace(/\{[^}]+\}/, `{ ${existing}, CubeIcon }`)
  }
  return true
}

async function updateAppFile(basePath: string, moduleName: string, pascalName: string): Promise<boolean> {
  const appPath = join(basePath, 'src', 'App.tsx')
  if (!pathExists(appPath)) return false

  const content = await readText(appPath)
  const lines = content.split('\n')

  ensureCubeIconImport(lines)

  const importLine = `import { ${pascalName}List, ${pascalName}Create, ${pascalName}Edit } from './modules/${moduleName}'`

  const sidebarItem = `                <SidebarLink href="/${moduleName}">
                  <CubeIcon size={20} /> {/* Icon: swap CubeIcon for a module-specific icon from @phosphor-icons/react */}
                  ${pascalName}
                </SidebarLink>`

  const routeLines = [
    `          <Route path="/${moduleName}" component={${pascalName}List} />`,
    `          <Route path="/${moduleName}/new" component={${pascalName}Create} />`,
    `          <Route path="/${moduleName}/:id/edit" component={${pascalName}Edit} />`,
  ]

  if (content.includes(importLine)) return false

  let modified = false

  const importMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-imports'))
  if (importMarkerIdx >= 0) {
    const oldImportPattern = new RegExp(`^import \\{ [^}]*\\} from ['"].\\/modules\\/${moduleName}['"]$`)
    const oldImportIdx = lines.findIndex((l) => oldImportPattern.test(l.trim()))
    if (oldImportIdx >= 0) {
      lines.splice(oldImportIdx, 1)
    }
    lines.splice(importMarkerIdx + 1, 0, importLine)
    modified = true
  }

  const sidebarMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-sidebar'))
  if (sidebarMarkerIdx >= 0) {
    lines.splice(sidebarMarkerIdx, 0, sidebarItem)
    modified = true
  }

  const routesMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-routes'))
  if (routesMarkerIdx >= 0) {
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes(`/${moduleName}`) && lines[i].includes(`${pascalName}Form`)) {
        lines.splice(i, 1)
      }
    }
    lines.splice(routesMarkerIdx, 0, ...routeLines)
    modified = true
  }

  if (!modified) return false

  await writeText(appPath, lines.join('\n'))
  return true
}

export async function generateModule(
  basePath: string,
  moduleName: string,
  fields: FieldDef[],
  options?: { feOnly?: boolean; beOnly?: boolean },
): Promise<void> {
  try {
    const serverPath = join(basePath, 'server')
    const moduleDir = join('modules', moduleName)

    const camelName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
    const pascalName = toPascalCase(moduleName)

    // Server files
    if (!options?.feOnly) {
      const serverFiles: Record<string, string> = {
        [join(moduleDir, 'schema.ts')]: schemaTemplate(moduleName, fields),
        [join(moduleDir, 'types.ts')]: typesTemplate(moduleName),
        [join(moduleDir, 'model.ts')]: modelTemplate(moduleName, fields),
        [join(moduleDir, 'service.ts')]: serviceTemplate(moduleName),
        [join(moduleDir, 'routes.ts')]: routesTemplate(moduleName),
        [join(moduleDir, 'index.ts')]: indexTemplate(moduleName),
      }
      await writeFileTree(serverPath, serverFiles)
      await updateDbSchema(serverPath, moduleName)
      await updateServerIndex(serverPath, moduleName, camelName)

      console.log(`\n${options?.beOnly ? 'Generated BE assets' : 'Generated module'}: ${moduleName}`)
      for (const [rel] of Object.entries(serverFiles)) {
        console.log(`  \u2713 ${join(serverPath, rel)}`)
      }
      console.log('  \u2713 Updated server/db/schema.ts')
      console.log('  \u2713 Updated server/index.ts')
    }

    // FE files
    if (!options?.beOnly) {
      const feFiles: Record<string, string> = {
        [`src/modules/${moduleName}/types/index.ts`]: feTypesTemplate(moduleName, fields),
        [`src/modules/${moduleName}/fetchers/index.ts`]: feApiTemplate(moduleName, fields),
        [`src/modules/${moduleName}/page.tsx`]: feListPageTemplate(moduleName, fields),
        [`src/modules/${moduleName}/create/page.tsx`]: feCreatePageTemplate(moduleName, fields),
        [`src/modules/${moduleName}/edit/page.tsx`]: feEditPageTemplate(moduleName, fields),
        [`src/modules/${moduleName}/index.ts`]: fePagesBarrelTemplate(moduleName),
      }
      await writeFileTree(basePath, feFiles)

      await updateAppFile(basePath, moduleName, pascalName)

      if (options?.feOnly) {
        console.log(`\nGenerated FE assets: ${moduleName}`)
      }
      for (const [rel] of Object.entries(feFiles)) {
        console.log(`  \u2713 ${join(basePath, rel)}`)
      }
      console.log('  \u2713 Updated src/App.tsx')
    }
  } catch (err) {
    console.error('  \u2717 Module generation failed:', err instanceof Error ? err.message : err)
    process.exit(1)
  }
}

async function removeDbSchema(serverPath: string, tableName: string): Promise<boolean> {
  const schemaPath = join(serverPath, 'db', 'schema.ts')
  if (!pathExists(schemaPath)) return false

  const content = await readText(schemaPath)
  const exportLine = `export { ${tableName} } from '../modules/${tableName}/schema'`
  if (!content.includes(exportLine)) return false

  const lines = content.split('\n').filter((l) => l !== exportLine)
  await writeText(schemaPath, lines.join('\n'))
  return true
}

async function removeServerIndex(serverPath: string, moduleName: string, camelName: string): Promise<boolean> {
  const indexPath = join(serverPath, 'index.ts')
  if (!pathExists(indexPath)) return false

  const content = await readText(indexPath)
  const lines = content.split('\n')

  const importLine = `import { ${camelName}Module } from './modules/${moduleName}'`
  const useLine = `  .use(${camelName}Module)`

  const filtered = lines.filter((l) => {
    const trimmed = l.trim()
    return trimmed !== importLine.trim() && trimmed !== useLine.trim()
  })

  if (filtered.length === lines.length) return false

  await writeText(indexPath, filtered.join('\n'))
  return true
}

async function removeAppFileRefs(basePath: string, moduleName: string, pascalName: string): Promise<boolean> {
  const appPath = join(basePath, 'src', 'App.tsx')
  if (!pathExists(appPath)) return false

  const content = await readText(appPath)
  const lines = content.split('\n')

  const importPattern = new RegExp(`^import \\{ [^}]*\\} from ['"]./modules/${moduleName}['"]$`)
  const sidebarOpenPattern = new RegExp(`^\\s*<SidebarLink href="/${moduleName}">`)

  const result: string[] = []
  let insideSidebarBlock = false
  let modified = false

  for (const line of lines) {
    if (sidebarOpenPattern.test(line)) {
      insideSidebarBlock = true
      modified = true
      continue
    }
    if (insideSidebarBlock) {
      if (line.trim() === '</SidebarLink>') {
        insideSidebarBlock = false
        continue
      }
      continue
    }
    if (importPattern.test(line.trim())) {
      modified = true
      continue
    }
    if (line.includes(`<Route path="/${moduleName}"`)) {
      modified = true
      continue
    }
    if (line.includes(`<Route path="/${moduleName}/new"`)) {
      modified = true
      continue
    }
    if (line.includes(`<Route path="/${moduleName}/:id/edit"`)) {
      modified = true
      continue
    }
    result.push(line)
  }

  if (!modified) return false

  await writeText(appPath, result.join('\n'))
  return true
}

export async function cleanupModule(
  basePath: string,
  featureName: string,
): Promise<void> {
  const moduleName = toKebabCase(featureName)
  const serverPath = join(basePath, 'server')

  const camelName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const pascalName = toPascalCase(moduleName)

  const serverModulePath = join(serverPath, 'modules', moduleName)
  const feModulePath = join(basePath, 'src', 'modules', moduleName)

  // Remove server module directory
  if (pathExists(serverModulePath)) {
    removeDir(serverModulePath)
    console.log(`  \u2713 Removed server/modules/${moduleName}/`)
  }

  if (pathExists(feModulePath)) {
    removeDir(feModulePath)
    console.log(`  \u2713 Removed src/modules/${moduleName}/`)
  }

  // Update referencing files
  await removeDbSchema(serverPath, moduleName)
  console.log('  \u2713 Updated server/db/schema.ts')

  await removeServerIndex(serverPath, moduleName, camelName)
  console.log('  \u2713 Updated server/index.ts')

  await removeAppFileRefs(basePath, moduleName, pascalName)
  console.log('  \u2713 Updated src/App.tsx')

  // Run drizzle-kit push to sync database schema
  console.log('\nSyncing database schema...')
  const migrate = Bun.spawnSync(['bunx', 'drizzle-kit', 'push'], { cwd: basePath })
  if (migrate.exitCode === 0) {
    console.log('  \u2713 Database schema synced')
  } else {
    const stderr = migrate.stderr.toString()
    if (stderr.includes('no such table') || stderr.includes('nothing to migrate')) {
      console.log('  \u2192 Database already up to date')
    } else {
      console.warn('  \u26A0 Warning: DB sync had issues:', stderr)
    }
  }

  console.log(`\nModule "${moduleName}" removed.`)
}
