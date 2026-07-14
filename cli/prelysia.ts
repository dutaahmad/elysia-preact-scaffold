#!/usr/bin/env bun

import { Command } from 'commander'
import { initAction } from './commands/init'
import { featAction } from './commands/feat'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url)
    const pkg = JSON.parse(
      readFileSync(join(dirname(__filename), '..', 'package.json'), 'utf-8'),
    )
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

const program = new Command()

program
  .name('prelysia')
  .description('Elysia + Preact fullstack scaffold CLI')
  .version(getVersion())

program
  .command('init')
  .description('Scaffold a new fullstack project')
  .argument('[project-name]', 'Project name (creates directory)')
  .action(initAction)

program
  .command('feat')
  .description('Generate a new module with CRUD routes')
  .argument('<name>', 'Feature name (kebab-case)')
  .option('--fe-only', 'Only generate FE assets (types, api, pages)')
  .action(featAction)

program.parse()
