/**
 * Edge cases for resolveWorkspaceConfig().
 *
 * Covers R-WORKSPACE-05 rejection paths: missing directory, path traversal,
 * non-directory target, and "workspaceRoot set but no project" no-op.
 *
 * Theme: Cabinet de conseil. Sofia is the unlucky one — she keeps trying
 * weird values in her .env: typos, traversals, and pointing at a file.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { resolveWorkspaceConfig } from './workspace-config.js'
import { WorkspaceConfigError } from '../errors/workspace-config-error.js'

describe('resolveWorkspaceConfig — edge cases (R-WORKSPACE-05)', () => {
  let workspaceRoot: string

  beforeAll(() => {
    workspaceRoot = mkdtempSync(path.join(tmpdir(), 'massivoto-workspace-edge-'))
    mkdirSync(path.join(workspaceRoot, 'acme-corp'))
    // Sofia put a file where a project directory should be.
    writeFileSync(
      path.join(workspaceRoot, 'gamma-group'),
      'this is a file, not a directory',
    )
  })

  afterAll(() => {
    rmSync(workspaceRoot, { recursive: true, force: true })
  })

  beforeEach(() => {
    delete process.env.MASSIVOTO_PROJECT
    delete process.env.MASSIVOTO_WORKSPACE_ROOT
    process.env.MASSIVOTO_WORKSPACE_ROOT = workspaceRoot
  })

  it('throws WorkspaceConfigError when the project directory does not exist', () => {
    expect(() =>
      resolveWorkspaceConfig({ project: 'delta-systems' }),
    ).toThrow(WorkspaceConfigError)
  })

  it('error mentions the absolute resolved path so the user can act on it', () => {
    try {
      resolveWorkspaceConfig({ project: 'delta-systems' })
      expect.fail('expected WorkspaceConfigError to be thrown')
    } catch (error) {
      const err = error as WorkspaceConfigError
      expect(err).toBeInstanceOf(WorkspaceConfigError)
      expect(err.value).toBe('delta-systems')
      expect(err.resolvedPath).toBe(
        path.join(workspaceRoot, 'delta-systems'),
      )
      expect(err.reason.toLowerCase()).toContain('not found')
    }
  })

  it('rejects path traversal (../etc) before checking existence', () => {
    expect(() =>
      resolveWorkspaceConfig({ project: '../etc' }),
    ).toThrow(WorkspaceConfigError)

    try {
      resolveWorkspaceConfig({ project: '../etc' })
    } catch (error) {
      const err = error as WorkspaceConfigError
      expect(err.reason.toLowerCase()).toContain('outside')
    }
  })

  it('rejects nested path traversal (../../etc/passwd)', () => {
    expect(() =>
      resolveWorkspaceConfig({ project: '../../etc/passwd' }),
    ).toThrow(WorkspaceConfigError)
  })

  it('rejects when the resolved target is a file, not a directory', () => {
    // gamma-group exists but is a file, not a directory.
    expect(() =>
      resolveWorkspaceConfig({ project: 'gamma-group' }),
    ).toThrow(WorkspaceConfigError)

    try {
      resolveWorkspaceConfig({ project: 'gamma-group' })
    } catch (error) {
      const err = error as WorkspaceConfigError
      expect(err.reason.toLowerCase()).toContain('not a directory')
    }
  })

  it('rejects an empty project value', () => {
    expect(() => resolveWorkspaceConfig({ project: '' })).toThrow(
      WorkspaceConfigError,
    )
  })

  it('treats whitespace-only project as invalid', () => {
    expect(() => resolveWorkspaceConfig({ project: '   ' })).toThrow(
      WorkspaceConfigError,
    )
  })

  it('returns project=undefined and projectRoot=undefined when only MASSIVOTO_WORKSPACE_ROOT is set', () => {
    // Workspace root is set in beforeEach, but no project.
    const config = resolveWorkspaceConfig({})

    expect(config.project).toBeUndefined()
    expect(config.projectRoot).toBeUndefined()
    expect(config.workspaceRoot).toBe(path.resolve(workspaceRoot))
  })
})
