const BASE_URL = ''

const devLog = import.meta.env.DEV
  ? (msg: string, data?: unknown) => console.log(`[API] ${msg}`, data ?? '')
  : () => {}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const method = options?.method || 'GET'
  const body = options?.body
  devLog(`${method} ${path}`, body ? JSON.parse(body as string) : undefined)

  const start = performance.now()
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const duration = ((performance.now() - start) / 1000).toFixed(3)

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }))
    devLog(`${method} ${path} → ${res.status} (${duration}s)`, error)
    throw new Error(error.message || res.statusText)
  }

  const data: T = await res.json()
  devLog(`${method} ${path} → ${res.status} (${duration}s)`, data)
  return data
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) => request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
