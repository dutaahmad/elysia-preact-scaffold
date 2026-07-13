import { join, resolve } from 'path'
import { confirm } from '@inquirer/prompts'
import { scaffoldProject } from '../generators/scaffold'
import { pathExists, listDir } from '../utils/fs'
import { toKebabCase } from '../utils/name'

async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
  try {
    const entries = await listDir(dirPath)
    return entries.length === 0
  } catch {
    return true
  }
}

export async function initAction(
  projectName?: string,
  options: { cwd?: string } = {},
): Promise<void> {
  let targetDir: string

  if (projectName) {
    const name = toKebabCase(projectName)
    targetDir = resolve(options.cwd || process.cwd(), name)
  } else {
    targetDir = resolve(options.cwd || process.cwd())
  }

  if (!(await isDirectoryEmpty(targetDir))) {
    const proceed = await confirm({
      message: `Directory ${targetDir} is not empty. Continue anyway?`,
      default: false,
    })
    if (!proceed) {
      console.log('Aborted.')
      process.exit(0)
    }
  }

  const name = projectName || 'elysia-preact-app'

  console.log(`Scaffolding project at ${targetDir}...`)
  await scaffoldProject(targetDir, name)
}
