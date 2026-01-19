/**
 * Registry error tests.
 *
 * Verifying error messages are LLM-readable and actionable.
 */

import { describe, it, expect } from 'vitest'
import {
  RegistryConflictError,
  RegistryNotLoadedError,
  ModuleLoadError,
} from './errors.js'

describe('RegistryConflictError', () => {
  it('includes all conflicting keys in the message', () => {
    const error = new RegistryConflictError([
      { key: '@utils/log', sourceIds: ['core', '@acme/custom'] },
      { key: '@utils/set', sourceIds: ['core', '@acme/custom', '@other/pkg'] },
    ])

    expect(error.message).toContain('@utils/log')
    expect(error.message).toContain('@utils/set')
  })

  it('includes all source IDs for each conflict', () => {
    const error = new RegistryConflictError([
      { key: '@utils/log', sourceIds: ['core', '@acme/custom'] },
    ])

    expect(error.message).toContain('core')
    expect(error.message).toContain('@acme/custom')
  })

  it('provides actionable fix suggestions', () => {
    const error = new RegistryConflictError([
      { key: '@utils/log', sourceIds: ['core', '@acme/custom'] },
    ])

    expect(error.message).toContain('namespace')
    expect(error.message).toContain('remove')
  })

  it('exposes conflicts array for programmatic access', () => {
    const conflicts = [
      { key: '@utils/log', sourceIds: ['core', '@acme/custom'] },
    ]
    const error = new RegistryConflictError(conflicts)

    expect(error.conflicts).toEqual(conflicts)
  })

  it('has correct error name', () => {
    const error = new RegistryConflictError([])
    expect(error.name).toBe('RegistryConflictError')
  })
})

describe('RegistryNotLoadedError', () => {
  it('explains that reload() must be called first', () => {
    const error = new RegistryNotLoadedError()

    expect(error.message).toContain('reload()')
    expect(error.message).toContain('must be called')
  })

  it('provides code example for fix', () => {
    const error = new RegistryNotLoadedError()

    expect(error.message).toContain('await registry.reload()')
  })

  it('has correct error name', () => {
    const error = new RegistryNotLoadedError()
    expect(error.name).toBe('RegistryNotLoadedError')
  })
})

describe('ModuleLoadError', () => {
  it('includes the module path in the message', () => {
    const error = new ModuleLoadError(
      './path/to/module.js',
      new Error('Module not found'),
    )

    expect(error.message).toContain('./path/to/module.js')
    expect(error.modulePath).toBe('./path/to/module.js')
  })

  it('includes the cause message', () => {
    const error = new ModuleLoadError(
      './module.js',
      new Error('Cannot find module'),
    )

    expect(error.message).toContain('Cannot find module')
  })

  it('provides troubleshooting suggestions', () => {
    const error = new ModuleLoadError('./module.js', new Error('Failed'))

    expect(error.message).toContain('module path')
    expect(error.message).toContain('syntax error')
  })

  it('preserves the original cause', () => {
    const cause = new Error('Original error')
    const error = new ModuleLoadError('./module.js', cause)

    expect(error.cause).toBe(cause)
  })

  it('handles non-Error causes', () => {
    const error = new ModuleLoadError('./module.js', 'string error')

    expect(error.message).toContain('string error')
  })

  it('has correct error name', () => {
    const error = new ModuleLoadError('./module.js', new Error('Failed'))
    expect(error.name).toBe('ModuleLoadError')
  })
})
