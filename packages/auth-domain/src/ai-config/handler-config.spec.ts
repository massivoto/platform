import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'
import { loadHandlerConfig, validateHandlerConfig } from './handler-config.js'

describe('loadHandlerConfig', () => {
  let tempDir: string

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hc-test-'))
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  // R-HC-15: Missing file returns undefined
  it('should return undefined when config file does not exist', () => {
    const result = loadHandlerConfig(tempDir)
    expect(result).toBeUndefined()
  })

  // R-HC-14: Reads valid config
  it('should load a valid config file', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: {
          text: { provider: 'openai', model: 'gpt-4o' },
          image: { provider: 'gemini' },
        },
      }),
    )

    const result = loadHandlerConfig(tempDir)
    expect(result).toBeDefined()
    expect(result!.ai!.text!.provider).toBe('openai')
    expect(result!.ai!.text!.model).toBe('gpt-4o')
    expect(result!.ai!.image!.provider).toBe('gemini')
  })

  // R-HC-25: Normalizes provider names
  it('should normalize provider names', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: {
          text: { provider: 'OpenAI' },
          image: { provider: 'GEMINI' },
        },
      }),
    )

    const result = loadHandlerConfig(tempDir)
    expect(result!.ai!.text!.provider).toBe('openai')
    expect(result!.ai!.image!.provider).toBe('gemini')
  })

  it('should load config with handler overrides', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: {
          text: { provider: 'openai' },
          handlers: {
            '@ai/prompt/reverseImage': { provider: 'anthropic', model: 'claude-sonnet-4-20250514' },
          },
        },
      }),
    )

    const result = loadHandlerConfig(tempDir)
    expect(result!.ai!.handlers!['@ai/prompt/reverseImage'].provider).toBe('anthropic')
    expect(result!.ai!.handlers!['@ai/prompt/reverseImage'].model).toBe('claude-sonnet-4-20250514')
  })

  it('should load config with fallback', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: {
          text: { provider: 'openai', fallback: 'gemini' },
        },
      }),
    )

    const result = loadHandlerConfig(tempDir)
    expect(result!.ai!.text!.fallback).toBe('gemini')
  })

  it('should return empty config when ai section is absent', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({}),
    )

    const result = loadHandlerConfig(tempDir)
    expect(result).toEqual({})
  })

  // R-HC-16: Throws on invalid JSON
  it('should throw on invalid JSON', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      '{ invalid json }',
    )

    expect(() => loadHandlerConfig(tempDir)).toThrow('Invalid JSON')
  })

  it('should throw on non-object root', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      '"just a string"',
    )

    expect(() => loadHandlerConfig(tempDir)).toThrow('must contain a JSON object')
  })

  it('should accept unknown provider names (normalized)', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: { text: { provider: 'huggingface' } },
      }),
    )

    const config = loadHandlerConfig(tempDir)
    expect(config?.ai?.text?.provider).toBe('huggingface')
  })

  it('should throw on missing provider field', async () => {
    await fs.writeFile(
      path.join(tempDir, 'massivoto.config.json'),
      JSON.stringify({
        ai: { text: { model: 'gpt-4o' } },
      }),
    )

    expect(() => loadHandlerConfig(tempDir)).toThrow('provider')
  })
})

describe('validateHandlerConfig', () => {
  // R-HC-51: Validates API keys exist
  it('should not throw when all API keys are present', () => {
    const config = {
      ai: {
        text: { provider: 'openai' },
        image: { provider: 'gemini' },
      },
    }
    const env = {
      OPENAI_API_KEY: 'sk-test',
      GEMINI_API_KEY: 'test-key',
    }

    expect(() => validateHandlerConfig(config, env)).not.toThrow()
  })

  // R-HC-52: Fails on missing API key
  it('should throw when a configured provider has no API key', () => {
    const config = {
      ai: {
        text: { provider: 'openai' },
      },
    }
    const env: Record<string, string | undefined> = {}

    expect(() => validateHandlerConfig(config, env)).toThrow('OPENAI_API_KEY is not set')
  })

  it('should validate fallback provider keys too', () => {
    const config = {
      ai: {
        text: { provider: 'openai', fallback: 'anthropic' },
      },
    }
    const env = {
      OPENAI_API_KEY: 'sk-test',
    }

    expect(() => validateHandlerConfig(config, env)).toThrow('ANTHROPIC_API_KEY is not set')
  })

  it('should validate handler override keys', () => {
    const config = {
      ai: {
        handlers: {
          '@ai/text': { provider: 'anthropic' },
        },
      },
    }
    const env: Record<string, string | undefined> = {}

    expect(() => validateHandlerConfig(config, env)).toThrow('ANTHROPIC_API_KEY is not set')
  })

  it('should not throw when config has no ai section', () => {
    expect(() => validateHandlerConfig({}, {})).not.toThrow()
  })
})
