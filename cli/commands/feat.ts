import { generateModule } from '../generators/module'
import { pathExists } from '../utils/fs'
import { join } from 'path'

export async function featAction(
  name: string,
  options: { cwd?: string } = {},
): Promise<void> {
  const targetDir = options.cwd || process.cwd()
  const serverPath = join(targetDir, 'server')

  if (!pathExists(serverPath)) {
    console.error('Error: No server/ directory found. Run prelysia init first.')
    process.exit(1)
  }

  await generateModule(targetDir, name)
}
