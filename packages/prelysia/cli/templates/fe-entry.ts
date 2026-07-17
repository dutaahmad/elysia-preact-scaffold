export function feAppTemplate(): string {
  return `import type { ComponentChildren } from 'preact'
import { HouseIcon, CubeIcon, CaretLeftIcon, ListIcon } from '@phosphor-icons/react'
import { cn } from './lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { Route, Switch, Link, useRoute } from 'wouter'
import { Home } from './pages/Home'
import { ThemeToggle } from './components/ThemeToggle'
// @prelysia-imports

const queryClient = new QueryClient()

function SidebarLink({ href, children }: { href: string; children: ComponentChildren }) {
  const [isActive] = useRoute(href === '/' ? '/' : href + '/:rest*')
  return (
    <li class="sidebar__item">
      <Link
        href={href}
        class={cn('sidebar__button', isActive && 'sidebar__button--active')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span>{children}</span>
      </Link>
    </li>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav class="navbar" data-stisla-navbar>
        <a class="navbar__brand" href="/">prelysia</a>
        <button class="navbar__toggle" data-stisla-navbar-toggle aria-label="Toggle navigation">
          <ListIcon size={20} />
        </button>
        <div class="navbar__menu">
          <div class="navbar__nav">
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <div class="app-layout">
        <aside class="sidebar" id="sidebar" data-stisla-sidebar>
          <div class="sidebar__header">
            <a class="sidebar__brand" href="/">
              <span>prelysia</span>
            </a>
          </div>
          <div class="sidebar__content">
            <div class="sidebar__menu">
              <div class="sidebar__group">
                <div class="sidebar__group-title">Main</div>
                <ul class="sidebar__list">
                  <SidebarLink href="/">
                    <HouseIcon size={20} />
                    Home
                  </SidebarLink>
                </ul>
              </div>
              <div class="sidebar__group">
                <div class="sidebar__group-title">Modules</div>
                <ul class="sidebar__list">
                  {/* @prelysia-sidebar */}
                  {/* Icon: generated links include a Cube icon — swap it for a module-specific icon */}
                </ul>
              </div>
            </div>
          </div>
          <div class="sidebar__footer">
            <button data-stisla-sidebar-toggle="collapse" class="sidebar__button" aria-controls="sidebar">
              <CaretLeftIcon size={16} />
              <span>Collapse</span>
            </button>
          </div>
        </aside>
        <main class="page app-main">
          <Switch>
            <Route path="/" component={Home} />
            {/* @prelysia-routes */}
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  )
}
`
}

export function feMainTemplate(): string {
  return `// @ts-expect-error - no type declarations for vanilla JS package
import '@stisla/vanilla'
import './style.css'
import { render } from 'preact'
import { App } from './App'

render(<App />, document.getElementById('app')!)
`
}

export function feHomeTemplate(): string {
  return `import { RocketIcon, CheckCircleIcon } from '@phosphor-icons/react'
import { Link } from 'wouter'

export function Home() {
  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Dashboard</h1>
          <p class="page__description">Welcome to your app</p>
        </div>
        <div class="page__action">
          <RocketIcon size={32} />
        </div>
      </div>
      <div class="page__body">
        <section class="page__section">
          <div class="card">
            <div class="card__body">
              <p>Your app is ready.</p>
              <p>Run <code>prelysia feat &lt;name&gt;</code> to add a new CRUD module.</p>
            </div>
          </div>
        </section>
        <section class="page__section">
          <div class="card">
            <div class="card__header">
              <div class="card__title">Quick Start</div>
            </div>
            <div class="card__body">
              <ol style="margin:0;padding-inline-start:1.25rem">
                <li><CheckCircleIcon size={20} /> <code>prelysia feat categories</code> — add a Categories module</li>
                <li><CheckCircleIcon size={20} /> <code>bun run dev</code> — start the dev server</li>
                <li><CheckCircleIcon size={20} /> Navigate to <a href="/categories">/categories</a> to see the CRUD UI</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
`
}
