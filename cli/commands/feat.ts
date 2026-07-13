import { generateModule } from '../generators/module'
import { pathExists, readText } from '../utils/fs'
import { join } from 'path'

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

  await generateModule(targetDir, name, { feOnly: options.feOnly ?? false })
}
