import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { Route, Switch, Link, useRoute } from 'wouter'
import { Home } from './pages/Home'
// @prelysia-imports

const queryClient = new QueryClient()

function SidebarLink({ href, children }: { href: string; children: preact.ComponentChildren }) {
  const [isActive] = useRoute(href === '/' ? '/' : href + '/:rest*')
  return (
    <div class="sidebar__item">
      <Link href={href} class="sidebar__button" aria-current={isActive ? 'page' : undefined}>
        <span>{children}</span>
      </Link>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav class="navbar" data-stisla-navbar>
        <a class="navbar__brand" href="/">prelysia</a>
        <button class="navbar__toggle" data-stisla-navbar-toggle aria-label="Toggle navigation">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 5h14M3 10h14M3 15h14" />
          </svg>
        </button>
        <div class="navbar__menu">
          <div class="navbar__nav" />
        </div>
      </nav>
      <div class="app-layout">
        <aside class="sidebar" data-stisla-sidebar>
          <div class="sidebar__header">
            <a class="sidebar__brand" href="/">
              <span>prelysia</span>
            </a>
          </div>
          <div class="sidebar__content">
            <div class="sidebar__group">
              <div class="sidebar__group-title">Main</div>
              <div class="sidebar__list">
                <SidebarLink href="/">Home</SidebarLink>
              </div>
            </div>
            <div class="sidebar__group">
              <div class="sidebar__group-title">Modules</div>
              <div class="sidebar__list">
                {/* @prelysia-sidebar */}
              </div>
            </div>
          </div>
          <div class="sidebar__footer">
            <button data-stisla-sidebar-toggle="collapse" class="button button--ghost button--sm" style="width:100%">
              Collapse
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
