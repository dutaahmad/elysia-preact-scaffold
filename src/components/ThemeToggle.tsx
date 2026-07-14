import { Sun, Moon } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()

  return (
    <button class={cn('button', 'button--ghost', 'button--sm')} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  )
}
