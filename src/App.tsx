import { CaretLeftIcon, ParagraphIcon, ListIcon, CubeIcon } from '@phosphor-icons/react'
import { cn } from './lib/utils'
import { QueryClient, QueryClientProvider } from '@tanstack/preact-query'
import { Route, Switch, Link, useRoute } from 'wouter'
import { Home } from './pages/Home'
import { ThemeToggle } from './components/ThemeToggle'
// @prelysia-imports
import { TodoList, TodoCreate, TodoEdit } from './pages/todo'

const queryClient = new QueryClient()

function SidebarLink({ href, children, className }: { href: string; children: preact.ComponentChildren, className?: string }) {
  const [isActive] = useRoute(href === '/' ? '/' : href + '/:rest*')
  return (
    <li class="sidebar__item">
      <Link
        href={href}
        class={cn('sidebar__button', isActive && 'sidebar__button--active')}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className={cn(`flex gap-3 ${className}`)}>{children}</span>
      </Link>
    </li>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <nav class="navbar border-b border-border" data-stisla-navbar>
        <a class="navbar__brand flex gap-0 p-0" href="/">
          <ParagraphIcon size={20} />
          <p>relysia</p>
        </a>
        <button class="navbar__toggle" data-stisla-navbar-toggle aria-label="Toggle navigation">
          <ListIcon size={20} />
        </button>
        <div class="navbar__menu">
          <div class="navbar__nav w-full md:flex md:flex-row md:justify-end">
              <ThemeToggle />
            </div>
        </div>
      </nav>
      <div class="app-layout">
        <aside class="sidebar border-r border-border" id="sidebar" data-stisla-sidebar>
          {/*<div class="sidebar__header">
            <a class="sidebar__brand" href="/">

            </a>
          </div>*/}
          <div class="sidebar__content">
            <div class="sidebar__menu">
              {/*<div class="sidebar__group">
                <div class="sidebar__group-title">Main</div>
                <ul class="sidebar__list">
                  <SidebarLink href="/">
                    <HouseIcon size={20} />
                  </SidebarLink>
                </ul>
              </div>*/}
              <div class="sidebar__group">
                <div class="sidebar__group-title">Modules</div>
                <ul class="sidebar__list">
                <SidebarLink href="/todo">
                  <CubeIcon size={20} /> {/* Icon: swap CubeIcon for a module-specific icon from @phosphor-icons/react */}
                  Todo
                </SidebarLink>
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
        <main class="page app-main p-6">
          <Switch>
            <Route path="/" component={Home} />
          <Route path="/todo" component={TodoList} />
          <Route path="/todo/new" component={TodoCreate} />
          <Route path="/todo/:id/edit" component={TodoEdit} />
            {/* @prelysia-routes */}
          </Switch>
        </main>
      </div>
    </QueryClientProvider>
  )
}
