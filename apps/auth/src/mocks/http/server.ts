// R-FOUNDATION-103: Lightweight mock server that patches global fetch
import { handlers, matchPath, type Handler, type MockRequest } from '@/mocks/http/handlers'

let originalFetch: typeof globalThis.fetch | null = null
let latencyMs = 0
let activeHandlers: Handler[] = [...handlers]

export function setLatency(ms: number) {
  latencyMs = Math.max(0, ms)
}

export function useHandlers(next: Handler[]) {
  activeHandlers = [...next]
}

export function resetHandlers() {
  activeHandlers = [...handlers]
}

export function resetDb() {
  // Consumers can import db directly if needed; noop placeholder for symmetry
}

export function startTestServer() {
  if (originalFetch) return // already started
  originalFetch = globalThis.fetch

  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = new URL(
      typeof input === 'string' ? input : (input as URL | Request).toString(),
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost',
    )
    const method = (
      init?.method ||
      (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET') ||
      'GET'
    ).toUpperCase() as any

    const matching = findMatchingHandler(method, url.pathname)
    if (!matching) {
      // No network allowed in Foundations
      throw new Error(`Mock server: no handler for ${method} ${url.pathname}`)
    }

    const params = matchPath(matching.path, url.pathname).params
    const headers = new Headers(
      init?.headers ||
        (typeof input === 'object' && 'headers' in input ? (input as Request).headers : undefined),
    )
    const req: MockRequest = {
      method,
      url,
      params,
      headers,
      json: async <T = unknown>() => {
        if (init?.body instanceof ReadableStream)
          throw new Error('Stream body not supported in mock fetch')
        const raw =
          typeof init?.body === 'string'
            ? init.body
            : typeof input === 'object' && 'body' in input
              ? (input as Request).body
              : null
        if (typeof raw === 'string') return JSON.parse(raw) as T
        // If using Request object
        if (typeof input === 'object' && input instanceof Request) {
          return (await input.clone().json()) as T
        }
        return {} as T
      },
    }

    const result = await matching.handle(req)
    if (latencyMs) await new Promise((r) => setTimeout(r, latencyMs))
    const body = result?.body !== undefined ? JSON.stringify(result.body) : undefined
    const headersObj = {
      ...(result.headers ?? {}),
      'content-type': result.headers?.['content-type'] ?? (body ? 'application/json' : undefined),
    }
    const headersFiltered = Object.fromEntries(
      Object.entries(headersObj).filter(([, v]) => v !== undefined),
    ) as Record<string, string>
    return new Response(body, { status: result.status ?? 200, headers: headersFiltered })
  }
}

export function stopTestServer() {
  if (!originalFetch) return
  globalThis.fetch = originalFetch
  originalFetch = null
}

function findMatchingHandler(method: string, pathname: string): Handler | undefined {
  for (const h of activeHandlers) {
    if (h.method !== (method as any)) continue
    const m = matchPath(h.path, pathname)
    if (m.ok) return h
  }
  return undefined
}
