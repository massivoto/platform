/**
 * Tests for FileRunner workspace integration — R-WORKSPACE-02, R-WORKSPACE-06,
 * R-WORKSPACE-21, R-WORKSPACE-41, R-WORKSPACE-43.
 *
 * Theme: Cabinet de conseil. Émilie writes a single OTO program and runs it
 * three times — once per client (acme-corp, beta-industries, gamma-group) —
 * by passing `--project` from the CLI (modelled here as `RunOptions.project`).
 *
 * Scenario:
 *   - workspace/ contains acme-corp/ and beta-industries/, each with a
 *     `brief.md` whose body identifies the client.
 *   - Émilie's program reads `~/brief.md` and stores it as `output=brief`.
 *   - `_project` is also injected into the root scope so the program can
 *     log `Building deck for {_project}` (validated separately in the
 *     interpreter spec).
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { promises as fs, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { FileRunner } from './file-runner.js'
import { WorkspaceConfigError } from '../errors/workspace-config-error.js'

describe('FileRunner — workspace integration', () => {
  let tempDir: string
  let workspaceRoot: string
  let scriptPath: string
  const originalCwd = process.cwd()

  beforeAll(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'oto-workspace-'))

    // <tempDir>/workspace/{acme-corp,beta-industries}/brief.md
    workspaceRoot = path.join(tempDir, 'workspace')
    mkdirSync(workspaceRoot)
    mkdirSync(path.join(workspaceRoot, 'acme-corp'))
    mkdirSync(path.join(workspaceRoot, 'beta-industries'))
    writeFileSync(
      path.join(workspaceRoot, 'acme-corp', 'brief.md'),
      'Acme: launch the new SaaS platform.',
    )
    writeFileSync(
      path.join(workspaceRoot, 'beta-industries', 'brief.md'),
      'Beta: optimize the manufacturing supply chain.',
    )

    // Programs live alongside the temp dir; they're regular .oto files.
    scriptPath = path.join(tempDir, 'pipeline.oto')
    await fs.writeFile(
      scriptPath,
      '@utils/set input="ok" output=status',
      'utf-8',
    )
  })

  afterAll(async () => {
    process.chdir(originalCwd)
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    delete process.env.MASSIVOTO_PROJECT
    delete process.env.MASSIVOTO_WORKSPACE_ROOT
  })

  describe('R-WORKSPACE-41: projectRoot computed when project option is set', () => {
    it('points fileSystem.projectRoot at <workspaceRoot>/<project>', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath, {
        project: 'acme-corp',
      })

      expect(result.context.fileSystem?.projectRoot).toBe(
        path.join(workspaceRoot, 'acme-corp'),
      )
    })

    it('honours MASSIVOTO_PROJECT when no option is provided', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot
      process.env.MASSIVOTO_PROJECT = 'beta-industries'

      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath)

      expect(result.context.fileSystem?.projectRoot).toBe(
        path.join(workspaceRoot, 'beta-industries'),
      )
    })

    it('CLI option overrides MASSIVOTO_PROJECT (R-WORKSPACE-02 precedence)', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot
      process.env.MASSIVOTO_PROJECT = 'beta-industries'

      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath, {
        project: 'acme-corp',
      })

      expect(result.context.fileSystem?.projectRoot).toBe(
        path.join(workspaceRoot, 'acme-corp'),
      )
    })
  })

  describe('R-WORKSPACE-43: fallback to cwd when no project is configured', () => {
    it('keeps projectRoot at process.cwd() when neither option nor env var is set', async () => {
      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath)

      // R-WORKSPACE-43: legacy behaviour preserved
      expect(result.context.fileSystem?.projectRoot).toBe(process.cwd())
    })
  })

  describe('R-WORKSPACE-05: validation fail-fast on invalid configuration', () => {
    it('throws WorkspaceConfigError for path traversal', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const runner = new FileRunner()
      await expect(
        runner.runFile(scriptPath, { project: '../../../etc/passwd' }),
      ).rejects.toThrow(WorkspaceConfigError)
    })

    it('throws WorkspaceConfigError when the project directory does not exist', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const runner = new FileRunner()
      await expect(
        runner.runFile(scriptPath, { project: 'delta-systems' }),
      ).rejects.toThrow(WorkspaceConfigError)
    })
  })

  describe('R-WORKSPACE-06: boot log message', () => {
    it('logs "workspace: project=<name>, root=<absolutePath>" when project is set', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot
      const errors: string[] = []
      const originalError = console.error
      console.error = (msg: string) => {
        errors.push(typeof msg === 'string' ? msg : String(msg))
      }

      try {
        const runner = new FileRunner()
        await runner.runFile(scriptPath, { project: 'acme-corp' })
      } finally {
        console.error = originalError
      }

      const expected = `workspace: project=acme-corp, root=${path.join(
        workspaceRoot,
        'acme-corp',
      )}`
      expect(errors.some((line) => line.includes(expected))).toBe(true)
    })

    it('logs "workspace: no _project set, using cwd as projectRoot" when nothing is configured', async () => {
      const errors: string[] = []
      const originalError = console.error
      console.error = (msg: string) => {
        errors.push(typeof msg === 'string' ? msg : String(msg))
      }

      try {
        const runner = new FileRunner()
        await runner.runFile(scriptPath)
      } finally {
        console.error = originalError
      }

      const expected = 'workspace: no _project set, using cwd as projectRoot'
      expect(errors.some((line) => line.includes(expected))).toBe(true)
    })
  })

  describe('R-WORKSPACE-21: _project injected at root scope', () => {
    it('exposes _project on context.scopeChain.current after the run', async () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath, {
        project: 'acme-corp',
      })

      // The scope chain must carry _project at its root so user code can
      // read {_project} anywhere in the program.
      let scope = result.context.scopeChain
      while (scope.parent) scope = scope.parent
      expect(scope.current['_project']).toBe('acme-corp')
    })

    it('does not inject _project when no project is configured', async () => {
      const runner = new FileRunner()
      const result = await runner.runFile(scriptPath)

      let scope = result.context.scopeChain
      while (scope.parent) scope = scope.parent
      expect(scope.current['_project']).toBeUndefined()
    })
  })
})
