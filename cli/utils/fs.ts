import { existsSync, mkdirSync } from 'fs'
import { readFile, writeFile, readdir as fsReaddir } from 'fs/promises'
import { dirname, join } from 'path'

export function ensureDir(filePath: string): void {
  const dir = dirname(filePath)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
}

export async function writeFileTree(
  basePath: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = join(basePath, relativePath)
    ensureDir(fullPath)
    await writeFile(fullPath, content, 'utf-8')
  }
}

export function pathExists(filePath: string): boolean {
  return existsSync(filePath)
}

export async function readJson(filePath: string): Promise<Record<string, unknown>> {
  const content = await readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

export async function writeJson(filePath: string, data: Record<string, unknown>): Promise<void> {
  ensureDir(filePath)
  await writeFile(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8')
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, 'utf-8')
}

export async function listDir(dirPath: string): Promise<string[]> {
  return fsReaddir(dirPath)
}

export async function writeText(filePath: string, content: string): Promise<void> {
  ensureDir(filePath)
  await writeFile(filePath, content, 'utf-8')
}

export async function updateProjectFile(
  filePath: string,
  marker: string,
  newLine: string,
): Promise<boolean> {
  const content = await readText(filePath)
  const lines = content.split('\n')
  const markerIndex = lines.findIndex((l) => l.includes(marker))
  if (markerIndex === -1) return false

  const indent = lines[markerIndex].match(/^\s*/)?.[0] ?? ''
  lines.splice(markerIndex + 1, 0, indent + newLine)
  await writeText(filePath, lines.join('\n'))
  return true
}
