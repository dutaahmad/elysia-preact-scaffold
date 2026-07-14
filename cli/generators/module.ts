import { input, select, confirm } from '@inquirer/prompts'
import { toKebabCase, toPascalCase } from '../utils/name'
import { writeFileTree, readText, writeText, pathExists } from '../utils/fs'
import {
  schemaTemplate,
  typesTemplate,
  modelTemplate,
  serviceTemplate,
  routesTemplate,
  indexTemplate,
  type FieldDef,
} from '../templates/module'
import {
  feTypesTemplate,
  feApiTemplate,
  feListPageTemplate,
  feFormPageTemplate,
} from '../templates/fe'
import { join } from 'path'

async function collectFields(): Promise<FieldDef[]> {
  const fields: FieldDef[] = []
  let addMore = true

  while (addMore) {
    const name = await input({
      message: 'Field name (snake_case):',
      validate: (v) => (v ? true : 'Field name is required'),
    })

    const type = await select<'string' | 'number' | 'boolean'>({
      message: `Field type for "${name}":`,
      choices: [
        { name: 'string (text)', value: 'string' },
        { name: 'number (integer)', value: 'number' },
        { name: 'boolean', value: 'boolean' },
      ],
    })

    const required = await confirm({
      message: `Is "${name}" required?`,
      default: true,
    })

    let defaultVal: string | boolean | number | undefined
    if (!required) {
      const defaultRaw = await input({
        message: `Default value for "${name}" (leave empty for none):`,
      })
      if (defaultRaw) {
        defaultVal = type === 'number' ? Number(defaultRaw) : type === 'boolean' ? defaultRaw === 'true' : defaultRaw
      }
    }

    fields.push({ name, type, required, default: defaultVal })

    addMore = await confirm({
      message: 'Add another field?',
      default: false,
    })
  }

  return fields
}

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

  const lastImportIdx = lines.reduce((max, line, i) => {
    return line.startsWith('import ') ? i : max
  }, -1)

  if (lastImportIdx >= 0) {
    lines.splice(lastImportIdx + 1, 0, importLine)
  }

  const listenIdx = lines.findIndex((l) => l.includes('.listen('))
  const staticIdx = lines.findIndex((l) => l.includes('staticPlugin'))

  const insertIdx = staticIdx >= 0 ? staticIdx : listenIdx >= 0 ? listenIdx : -1

  if (insertIdx > 0) {
    lines.splice(insertIdx, 0, useLine)
  }

  await writeText(indexPath, lines.join('\n'))
  return true
}

async function updateAppFile(basePath: string, moduleName: string, pascalName: string): Promise<boolean> {
  const appPath = join(basePath, 'src', 'App.tsx')
  if (!pathExists(appPath)) return false

  const content = await readText(appPath)
  const lines = content.split('\n')

  const importLine = `import { ${pascalName}List, ${pascalName}Form } from './pages/${moduleName}'`

  const sidebarItem = `                <SidebarLink href="/${moduleName}">${pascalName}</SidebarLink>`

  const routeLines = [
    `          <Route path="/${moduleName}" component={${pascalName}List} />`,
    `          <Route path="/${moduleName}/new" component={${pascalName}Form} />`,
    `          <Route path="/${moduleName}/:id/edit" component={${pascalName}Form} />`,
  ]

  if (content.includes(importLine)) return false

  let modified = false

  const importMarkerIdx = lines.findIndex((l) => l.includes('@prelysia-imports'))
  if (importMarkerIdx >= 0) {
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
    lines.splice(routesMarkerIdx, 0, ...routeLines)
    modified = true
  }

  if (!modified) return false

  await writeText(appPath, lines.join('\n'))
  return true
}

export async function generateModule(
  basePath: string,
  featureName: string,
  options?: { feOnly?: boolean },
): Promise<void> {
  const moduleName = toKebabCase(featureName)
  const serverPath = join(basePath, 'server')
  const moduleDir = join('modules', moduleName)
  const fields = await collectFields()

  const camelName = moduleName.replace(/-([a-z])/g, (_, c) => c.toUpperCase())
  const pascalName = toPascalCase(moduleName)

  // Server files
  if (!options?.feOnly) {
    const files: Record<string, string> = {
      [join(moduleDir, 'schema.ts')]: schemaTemplate(moduleName, fields),
      [join(moduleDir, 'types.ts')]: typesTemplate(moduleName),
      [join(moduleDir, 'model.ts')]: modelTemplate(moduleName, fields),
      [join(moduleDir, 'service.ts')]: serviceTemplate(moduleName),
      [join(moduleDir, 'routes.ts')]: routesTemplate(moduleName),
      [join(moduleDir, 'index.ts')]: indexTemplate(moduleName),
    }
    await writeFileTree(serverPath, files)

    await updateDbSchema(serverPath, moduleName)
    await updateServerIndex(serverPath, moduleName, camelName)
  }

  // FE files
  const feFiles: Record<string, string> = {
    [`src/types/${moduleName}.ts`]: feTypesTemplate(moduleName, fields),
    [`src/api/${moduleName}.ts`]: feApiTemplate(moduleName, fields),
    [`src/pages/${moduleName}/List.tsx`]: feListPageTemplate(moduleName, fields),
    [`src/pages/${moduleName}/Form.tsx`]: feFormPageTemplate(moduleName, fields),
  }
  await writeFileTree(basePath, feFiles)

  await updateAppFile(basePath, moduleName, pascalName)

  // Console output
  if (!options?.feOnly) {
    console.log(`\nGenerated module: ${moduleName}`)
    for (const [rel] of Object.entries(files)) {
      console.log(`  \u2713 ${join(serverPath, rel)}`)
    }
  } else {
    console.log(`\nGenerated FE assets: ${moduleName}`)
  }
  for (const [rel] of Object.entries(feFiles)) {
    console.log(`  \u2713 ${join(basePath, rel)}`)
  }
  if (!options?.feOnly) {
    console.log('  \u2713 Updated server/db/schema.ts')
    console.log('  \u2713 Updated server/index.ts')
  }
  console.log('  \u2713 Updated src/App.tsx')
}
