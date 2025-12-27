import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { startTestServer, stopTestServer, resetHandlers, setLatency } from '@/mocks/http/server'

// R-FOUNDATION-104: Start/stop mock server automatically for unit tests
// Silence jsdom canvas warning used by axe-core color-contrast rule
// Not relevant in jsdom; we only need a stub to avoid noisy logs
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: () => null,
})

beforeAll(() => {
  setLatency(0)
  startTestServer()
})

afterEach(() => {
  resetHandlers()
})

afterAll(() => {
  stopTestServer()
})
