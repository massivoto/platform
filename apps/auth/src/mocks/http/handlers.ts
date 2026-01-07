// R-FOUNDATION-103: MSW-like handlers (no real network)

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type MockRequest = {
  method: HttpMethod
  url: URL
  params: Record<string, string>
  headers: Headers
  json: <T = unknown>() => Promise<T>
}

export type MockResponse<T = unknown> = {
  status?: number
  headers?: Record<string, string>
  body?: T
}

export type Handler = {
  method: HttpMethod
  path: string // supports ":param" segments
  handle: (req: MockRequest) => Promise<MockResponse> | MockResponse
}

// In-memory DB for tokens/configs used by storage routes
export const db = {
  tokens: new Map<string, unknown>(),
  configs: new Map<string, unknown>(),
}

export function json<T>(
  body: T,
  init?: { status?: number; headers?: Record<string, string> },
): MockResponse<T> {
  return {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    body,
  }
}

// Simple path matcher supporting ":param" segments
export function matchPath(
  template: string,
  pathname: string,
): { ok: boolean; params: Record<string, string> } {
  const tpl = template.split('/').filter(Boolean)
  const act = pathname.split('/').filter(Boolean)
  if (tpl.length !== act.length) return { ok: false, params: {} }
  const params: Record<string, string> = {}
  for (let i = 0; i < tpl.length; i++) {
    const t = tpl[i]!
    const a = act[i]!
    if (t.startsWith(':')) {
      params[t.slice(1)] = decodeURIComponent(a)
    } else if (t !== a) {
      return { ok: false, params: {} }
    }
  }
  return { ok: true, params }
}

// Storage contract (front-only mock)
// GET    /api/storage/:providerId/token  -> { token: Token|null }
// PUT    /api/storage/:providerId/token  -> { ok: true }
// GET    /api/storage/:providerId/config -> { config: any|null }
// PUT    /api/storage/:providerId/config -> { ok: true }

export const handlers: Handler[] = [
  {
    method: 'GET',
    path: '/api/storage/:providerId/token',
    handle: async ({ params }) => {
      const token = db.tokens.get(params.providerId!) ?? null
      return json({ token })
    },
  },
  {
    method: 'PUT',
    path: '/api/storage/:providerId/token',
    handle: async (req) => {
      const { params } = req
      const body = await req.json<{ token: unknown }>()
      db.tokens.set(params.providerId!, body?.token ?? null)
      return json({ ok: true as const })
    },
  },
  {
    method: 'GET',
    path: '/api/storage/:providerId/config',
    handle: async ({ params }) => {
      const config = db.configs.get(params.providerId!) ?? null
      return json({ config })
    },
  },
  {
    method: 'PUT',
    path: '/api/storage/:providerId/config',
    handle: async (req) => {
      const { params } = req
      const body = await req.json<{ config: unknown }>()
      db.configs.set(params.providerId!, body?.config ?? null)
      return json({ ok: true as const })
    },
  },
]
