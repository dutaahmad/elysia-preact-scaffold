import { input, select, confirm } from '@inquirer/prompts'
import { generateModule } from '../generator/module'
import { pathExists, readText } from '../utils/fs'
import { join } from 'path'
import type { FieldDef } from '../types'

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

export async function featAction(
  name: string,
  options: { cwd?: string; feOnly?: boolean } = {},
): Promise<void> {
  const targetDir = options.cwd || process.cwd()
  const serverPath = join(targetDir, 'server')

  if (!options.feOnly) {
    if (!pathExists(serverPath)) {
      console.error('Error: No server/ directory found. Run prelysia init first.')
      process.exit(1)
    }
  }

  const srcPath = join(targetDir, 'src')
  if (!pathExists(srcPath)) {
    console.error('Error: No src/ directory found. Run prelysia init first.')
    process.exit(1)
  }

  const appPath = join(srcPath, 'App.tsx')
  if (pathExists(appPath)) {
    const content = await readText(appPath)
    if (!content.includes('@prelysia-routes')) {
      console.error('Error: src/App.tsx is missing FE foundation markers. Run prelysia init first.')
      process.exit(1)
    }
  } else {
    console.error('Error: No src/App.tsx found. Run prelysia init first.')
    process.exit(1)
  }

  const fields = await collectFields()
  await generateModule(targetDir, name, fields, { feOnly: options.feOnly ?? false })
}
