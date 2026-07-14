import { CheckCircleIcon } from '@phosphor-icons/react'

export function Home() {
  return (
    <div class="page">
      <div class="page__header">
        <div class="page__headline">
          <h1 class="page__title">Dashboard</h1>
          <p class="page__description">Welcome to your app</p>
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
