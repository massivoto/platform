/**
 * Tests for resolveWorkspaceConfig().
 *
 * Covers R-WORKSPACE-04 (workspaceRoot resolution) and the happy paths of
 * R-WORKSPACE-05 (validation). Edge cases (path traversal, missing dir,
 * empty values) live in workspace-config.edge.spec.ts.
 *
 * Theme: Cabinet de conseil. Émilie owns the acme-corp project, Marc has
 * beta-industries, Sofia drives gamma-group.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { resolveWorkspaceConfig } from './workspace-config.js'

describe('resolveWorkspaceConfig (R-WORKSPACE-04, R-WORKSPACE-05)', () => {
  let workspaceRoot: string

  beforeAll(() => {
    // Create a fake workspace root with three client directories.
    workspaceRoot = mkdtempSync(path.join(tmpdir(), 'massivoto-workspace-'))
    mkdirSync(path.join(workspaceRoot, 'acme-corp'))
    mkdirSync(path.join(workspaceRoot, 'beta-industries'))
    mkdirSync(path.join(workspaceRoot, 'gamma-group'))
  })

  afterAll(() => {
    rmSync(workspaceRoot, { recursive: true, force: true })
  })

  beforeEach(() => {
    delete process.env.MASSIVOTO_PROJECT
    delete process.env.MASSIVOTO_WORKSPACE_ROOT
  })

  describe('precedence: option > env var > undefined', () => {
    it('uses the constructor option even when MASSIVOTO_PROJECT is set', () => {
      process.env.MASSIVOTO_PROJECT = 'beta-industries'
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const config = resolveWorkspaceConfig({ project: 'acme-corp' })

      expect(config.project).toBe('acme-corp')
      expect(config.projectRoot).toBe(path.join(workspaceRoot, 'acme-corp'))
    })

    it('falls back to MASSIVOTO_PROJECT when no option is provided', () => {
      process.env.MASSIVOTO_PROJECT = 'gamma-group'
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const config = resolveWorkspaceConfig({})

      expect(config.project).toBe('gamma-group')
      expect(config.projectRoot).toBe(path.join(workspaceRoot, 'gamma-group'))
    })

    it('returns project=undefined when neither option nor env var is set', () => {
      const config = resolveWorkspaceConfig({})

      expect(config.project).toBeUndefined()
      expect(config.projectRoot).toBeUndefined()
    })
  })

  describe('workspaceRoot resolution (R-WORKSPACE-04)', () => {
    it('defaults workspaceRoot to <cwd>/workspace when MASSIVOTO_WORKSPACE_ROOT is unset', () => {
      const config = resolveWorkspaceConfig({})

      expect(config.workspaceRoot).toBe(path.join(process.cwd(), 'workspace'))
    })

    it('honours MASSIVOTO_WORKSPACE_ROOT when defined and resolves it absolutely', () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const config = resolveWorkspaceConfig({})

      expect(config.workspaceRoot).toBe(path.resolve(workspaceRoot))
    })

    it('resolves a relative MASSIVOTO_WORKSPACE_ROOT against the current cwd', () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = './my-workspace'

      const config = resolveWorkspaceConfig({})

      expect(path.isAbsolute(config.workspaceRoot)).toBe(true)
      expect(config.workspaceRoot).toBe(
        path.resolve(process.cwd(), './my-workspace'),
      )
    })
  })

  describe('happy path: project resolves to an absolute directory inside workspaceRoot', () => {
    it('returns project, workspaceRoot and projectRoot when the directory exists', () => {
      process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot

      const config = resolveWorkspaceConfig({ project: 'acme-corp' })

      expect(config.project).toBe('acme-corp')
      expect(config.workspaceRoot).toBe(path.resolve(workspaceRoot))
      expect(config.projectRoot).toBe(path.join(workspaceRoot, 'acme-corp'))
      expect(path.isAbsolute(config.projectRoot!)).toBe(true)
    })
  })
})
