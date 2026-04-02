import { describe, it, expect, afterEach } from 'vitest'
import { findEnvFile, loadEnvChain } from './load-env.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

/**
 * Theme: Formula One Racing Workshop
 *
 * Marco has his F1 workspace at workspace/f1/. The dotenv priority chain
 * looks for .env files walking up from the project directory:
 * workspace/f1/.env > workspace/.env > root .env
 * First file found wins entirely -- no merging.
 */

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'ai-config-test-'))
}

function cleanup(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true })
}

describe('findEnvFile', () => {
  let tempDir: string

  afterEach(() => {
    if (tempDir) cleanup(tempDir)
  })

  describe('R-AIC-61: dotenv priority chain', () => {
    it('should find .env in the project directory (highest priority)', () => {
      tempDir = createTempDir()
      const projectDir = path.join(tempDir, 'workspace', 'f1')
      fs.mkdirSync(projectDir, { recursive: true })
      fs.writeFileSync(path.join(projectDir, '.env'), 'AI_PROVIDERS=gemini')

      const result = findEnvFile(projectDir, tempDir)

      expect(result).toBe(path.join(projectDir, '.env'))
    })

    it('should fall back to workspace/.env if project .env missing', () => {
      tempDir = createTempDir()
      const workspaceDir = path.join(tempDir, 'workspace')
      const projectDir = path.join(workspaceDir, 'f1')
      fs.mkdirSync(projectDir, { recursive: true })
      fs.writeFileSync(path.join(workspaceDir, '.env'), 'AI_PROVIDERS=openai')

      const result = findEnvFile(projectDir, tempDir)

      expect(result).toBe(path.join(workspaceDir, '.env'))
    })

    it('should fall back to root .env if no workspace .env', () => {
      tempDir = createTempDir()
      const projectDir = path.join(tempDir, 'workspace', 'f1')
      fs.mkdirSync(projectDir, { recursive: true })
      fs.writeFileSync(path.join(tempDir, '.env'), 'AI_PROVIDERS=anthropic')

      const result = findEnvFile(projectDir, tempDir)

      expect(result).toBe(path.join(tempDir, '.env'))
    })

    it('should return undefined when no .env exists anywhere', () => {
      tempDir = createTempDir()
      const projectDir = path.join(tempDir, 'workspace', 'f1')
      fs.mkdirSync(projectDir, { recursive: true })

      const result = findEnvFile(projectDir, tempDir)

      expect(result).toBeUndefined()
    })

    it('should stop at root boundary and not search above it', () => {
      tempDir = createTempDir()
      const parentDir = path.dirname(tempDir)
      const projectDir = path.join(tempDir, 'workspace', 'f1')
      fs.mkdirSync(projectDir, { recursive: true })
      // Put .env ABOVE the root boundary -- should not be found
      // (we can't reliably create there, so just verify undefined is returned)

      const result = findEnvFile(projectDir, tempDir)

      expect(result).toBeUndefined()
    })
  })
})

describe('loadEnvChain', () => {
  let tempDir: string

  afterEach(() => {
    if (tempDir) cleanup(tempDir)
  })

  it('should load env vars from the found .env file', () => {
    tempDir = createTempDir()
    const projectDir = path.join(tempDir, 'workspace', 'f1')
    fs.mkdirSync(projectDir, { recursive: true })
    fs.writeFileSync(
      path.join(projectDir, '.env'),
      'AI_PROVIDERS=gemini\nGEMINI_API_KEY=marco-f1-key\n',
    )

    const env = loadEnvChain(projectDir, tempDir)

    expect(env.AI_PROVIDERS).toBe('gemini')
    expect(env.GEMINI_API_KEY).toBe('marco-f1-key')
  })

  it('should not merge across .env files (first file wins entirely)', () => {
    tempDir = createTempDir()
    const workspaceDir = path.join(tempDir, 'workspace')
    const projectDir = path.join(workspaceDir, 'f1')
    fs.mkdirSync(projectDir, { recursive: true })
    // Project .env has only AI_PROVIDERS
    fs.writeFileSync(path.join(projectDir, '.env'), 'AI_PROVIDERS=gemini\n')
    // Workspace .env has the API key
    fs.writeFileSync(path.join(workspaceDir, '.env'), 'GEMINI_API_KEY=workspace-key\n')

    const env = loadEnvChain(projectDir, tempDir)

    // Project .env wins entirely -- workspace .env is not loaded
    expect(env.AI_PROVIDERS).toBe('gemini')
    expect(env.GEMINI_API_KEY).toBeUndefined()
  })

  it('should return empty object when no .env found', () => {
    tempDir = createTempDir()
    const projectDir = path.join(tempDir, 'workspace', 'f1')
    fs.mkdirSync(projectDir, { recursive: true })

    const env = loadEnvChain(projectDir, tempDir)

    expect(env).toEqual({})
  })
})
