import { input } from '@inquirer/prompts'
import { cleanupModule } from '../generator/module'
import { pathExists } from '../utils/fs'
import { join } from 'path'
import { toKebabCase, toPascalCase } from '../utils/name'

export async function removeAction(
  name: string,
  options: { cwd?: string } = {},
): Promise<void> {
  const targetDir = options.cwd || process.cwd()
  const moduleName = toKebabCase(name)

  const serverPath = join(targetDir, 'server', 'modules', moduleName)
  const feModulePath = join(targetDir, 'src', 'modules', moduleName)

  if (!pathExists(serverPath) && !pathExists(feModulePath)) {
    console.error(`Error: Module "${moduleName}" not found.`)
    process.exit(1)
  }

  const confirmation = await input({
    message: `Type the module name "${moduleName}" to confirm deletion:`,
    validate: (v) => (v ? true : 'Confirmation is required'),
  })

  if (confirmation !== moduleName) {
    console.log('Module name does not match. Aborted.')
    process.exit(0)
  }

  console.log(`Removing module "${moduleName}"...`)
  await cleanupModule(targetDir, moduleName)
}
