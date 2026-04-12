import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { buildAiContext } from './build-ai-context.js'

describe('buildAiContext', () => {
  let tempDir: string
  const originalEnv = { ...process.env }

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bac-test-'))
    // Clear AI-related env vars for clean tests
    delete process.env.GEMINI_API_KEY
    delete process.env.OPENAI_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    delete process.env.AI_PROVIDERS
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    // Restore original env
    process.env = { ...originalEnv }
  })

  // R-HC-01, R-HC-02: Loads .env and builds aiConfig
  it('should load .env and populate aiConfig', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-gemini-key\nAI_PROVIDERS=gemini\n',
    )

    const result = buildAiContext(tempDir)

    expect(result.env.GEMINI_API_KEY).toBe('test-gemini-key')
    expect(result.aiConfig).toBeDefined()
    expect(result.aiConfig!.providers).toHaveLength(1)
    expect(result.aiConfig!.providers[0].name).toBe('gemini')
    expect(result.aiConfig!.providers[0].apiKey).toBe('test-gemini-key')
  })

  // R-HC-04: Auto-detect when AI_PROVIDERS not set
  it('should auto-detect providers from available keys', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\n',
    )

    const result = buildAiContext(tempDir)

    expect(result.aiConfig).toBeDefined()
    expect(result.aiConfig!.providers).toHaveLength(1)
    expect(result.aiConfig!.providers[0].name).toBe('gemini')
    expect(result.warnings.some((w) => w.includes('Auto-detected'))).toBe(true)
  })

  // R-HC-05: Zero keys warning
  it('should warn when no API keys found', () => {
    const result = buildAiContext(tempDir)

    expect(result.warnings.some((w) => w.includes('No AI API keys found'))).toBe(true)
  })

  // R-HC-03: Merges env with context
  it('should include all loaded env vars', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\nCUSTOM_VAR=hello\nAI_PROVIDERS=gemini\n',
    )

    const result = buildAiContext(tempDir)

    expect(result.env.GEMINI_API_KEY).toBe('test-key')
    expect(result.env.CUSTOM_VAR).toBe('hello')
  })

  // R-HC-17: Loads handler config
  it('should load massivoto.config.json when present', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\nOPENAI_API_KEY=openai-key\nAI_PROVIDERS=gemini,openai\n',
    )
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: {
          text: { provider: 'openai', model: 'gpt-4o' },
        },
      }),
    )

    const result = buildAiContext(tempDir)

    expect(result.handlerConfig).toBeDefined()
    expect(result.handlerConfig!.ai!.text!.provider).toBe('openai')
    expect(result.handlerConfig!.ai!.text!.model).toBe('gpt-4o')
  })

  // R-HC-15: Missing config file is fine
  it('should return undefined handlerConfig when no config file', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\nAI_PROVIDERS=gemini\n',
    )

    const result = buildAiContext(tempDir)

    expect(result.handlerConfig).toBeUndefined()
  })

  // R-HC-52: Fail-fast on config referencing provider without key
  it('should throw when config references provider without API key', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\nAI_PROVIDERS=gemini\n',
    )
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: { text: { provider: 'openai' } },
      }),
    )

    expect(() => buildAiContext(tempDir)).toThrow('OPENAI_API_KEY is not set')
  })

  it('should use process.env as fallback for API keys', async () => {
    process.env.GEMINI_API_KEY = 'process-env-key'
    process.env.AI_PROVIDERS = 'gemini'

    const result = buildAiContext(tempDir) // no .env file

    expect(result.aiConfig).toBeDefined()
    expect(result.aiConfig!.providers[0].apiKey).toBe('process-env-key')
  })

  it('should throw on invalid massivoto.config.json', async () => {
    await fs.writeFile(
      path.join(tempDir, '.env'),
      'GEMINI_API_KEY=test-key\nAI_PROVIDERS=gemini\n',
    )
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      '{ invalid json }',
    )

    expect(() => buildAiContext(tempDir)).toThrow('Invalid JSON')
  })
})
