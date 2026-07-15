import { SunIcon, MoonIcon } from '@phosphor-icons/react'
import { cn } from '../lib/utils'
import { useTheme } from '../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()

  return (
    <button class={cn('button', 'button--ghost', 'button--sm')} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  )
}
