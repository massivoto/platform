/**
 * Tests for WorkspaceConfigError.
 *
 * R-WORKSPACE-05: New error class thrown by the runner at boot when
 * workspace project configuration is invalid (missing dir, path traversal,
 * non-directory target).
 */
import { describe, it, expect } from 'vitest'
import { WorkspaceConfigError } from './workspace-config-error.js'

describe('WorkspaceConfigError', () => {
  it('exists as a real class', () => {
    expect(WorkspaceConfigError).toBeDefined()
    expect(typeof WorkspaceConfigError).toBe('function')
  })

  it('is an Error subclass', () => {
    const err = new WorkspaceConfigError({
      value: 'acme-corp',
      resolvedPath: '/abs/workspace/acme-corp',
      reason: 'directory not found',
    })
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(WorkspaceConfigError)
  })

  it('has the correct name property', () => {
    const err = new WorkspaceConfigError({
      value: 'acme-corp',
      resolvedPath: '/abs/workspace/acme-corp',
      reason: 'directory not found',
    })
    expect(err.name).toBe('WorkspaceConfigError')
  })

  it('exposes the value, resolvedPath and reason fields', () => {
    const err = new WorkspaceConfigError({
      value: '../etc/passwd',
      resolvedPath: '/etc/passwd',
      reason: 'path traversal rejected',
    })
    expect(err.value).toBe('../etc/passwd')
    expect(err.resolvedPath).toBe('/etc/passwd')
    expect(err.reason).toBe('path traversal rejected')
  })

  it('produces a user-oriented message that mentions the value, the path and the reason', () => {
    const err = new WorkspaceConfigError({
      value: 'acme-corp',
      resolvedPath: '/home/emilie/workspace/acme-corp',
      reason: 'directory not found',
    })
    expect(err.message).toContain('acme-corp')
    expect(err.message).toContain('/home/emilie/workspace/acme-corp')
    expect(err.message).toContain('directory not found')
  })

  it('does not include a raw stack-trace prefix in the message', () => {
    const err = new WorkspaceConfigError({
      value: 'acme-corp',
      resolvedPath: '/x/y',
      reason: 'directory not found',
    })
    expect(err.message.startsWith('at ')).toBe(false)
    expect(err.message).not.toContain('node_modules')
  })
})
