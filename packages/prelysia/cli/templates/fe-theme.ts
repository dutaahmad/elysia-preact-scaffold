export function feStyleTemplate(): string {
  return `@import "tailwindcss";
@import "@stisla/style/theme.css";
@import "@stisla/style/components.css";
@source "./src";

html, body, #app {
  height: 100%;
  margin: 0;
}
#app {
  display: flex;
  flex-direction: column;
}
.app-layout {
  display: flex;
  flex: 1;
  min-height: 0;
}
.app-main {
  flex: 1;
  overflow-y: auto;
}

`
}

export function feUseThemeTemplate(): string {
  return `import { useState, useEffect } from 'preact/hooks'

const STORAGE_KEY = 'stisla-theme'

function getInitialTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'dark' || stored === 'light') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const toggle = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }

  return [theme, toggle]
}
`
}

export function feThemeToggleTemplate(): string {
  return `import { SunIcon, MoonIcon } from '@phosphor-icons/react'
import { cn } from '../../helpers/cn'
import { useTheme } from '../../hooks/useTheme'

export function ThemeToggle() {
  const [theme, toggle] = useTheme()

  return (
    <button class={cn('button', 'button--ghost', 'button--sm')} onClick={toggle} aria-label="Toggle theme">
      {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
    </button>
  )
}
`
}

export function feUtilsTemplate(): string {
  return `import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`
}
