import { expect, describe, it } from 'vitest'

// R-FOUNDATION-105: Validate MSW-like mock server via global fetch

describe('mock http server', () => {
  console.log('====> mock http server')
  it('supports token GET/PUT flow', async () => {
    // initial: null
    const r1 = await fetch('/api/storage/openai/token')
    expect(r1.ok).toBe(true)
    const j1 = (await r1.json()) as { token: unknown | null }
    expect(j1.token).toBeNull()

    // set token
    const put = await fetch('/api/storage/openai/token', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: { type: 'apiKey', key: 'mv_fake_openai_abc' } }),
    })
    expect(put.ok).toBe(true)
    const jput = (await put.json()) as { ok: boolean }
    expect(jput.ok).toBe(true)

    // read back
    const r2 = await fetch('/api/storage/openai/token')
    expect(r2.ok).toBe(true)
    const j2 = (await r2.json()) as { token: { type: string; key: string } | null }
    expect(j2.token).toEqual({ type: 'apiKey', key: 'mv_fake_openai_abc' })
  })

  it('supports config GET/PUT flow', async () => {
    const g1 = await fetch('/api/storage/openai/config')
    expect(g1.ok).toBe(true)
    const jg1 = (await g1.json()) as { config: unknown | null }
    expect(jg1.config).toBeNull()

    const set = await fetch('/api/storage/openai/config', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ config: { theme: 'dark', retries: 2 } }),
    })
    expect(set.ok).toBe(true)

    const g2 = await fetch('/api/storage/openai/config')
    expect(g2.ok).toBe(true)
    const jg2 = (await g2.json()) as { config: { theme: string; retries: number } | null }
    expect(jg2.config).toEqual({ theme: 'dark', retries: 2 })
  })
})
