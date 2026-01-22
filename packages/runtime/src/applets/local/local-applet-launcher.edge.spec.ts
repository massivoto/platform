/**
 * LocalAppletLauncher Edge Case Tests
 *
 * Tests for edge cases: validation failures and error details.
 * Uses MinimalTestServerFactory - no real applet packages.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { LocalAppletLauncher } from './local-applet-launcher.js'
import { MinimalTestServerFactory } from './server-factories/minimal-test-factory.js'
import { PortAllocator } from './port-allocator.js'
import { AppletValidationError } from '../errors.js'
import { createEmptyExecutionContext } from '../../domain/execution-context.js'
import type {
  AppletRegistry,
  AppletDefinition,
  AppletInstance,
} from '../types.js'

/**
 * Create a mock registry for testing.
 */
function createMockRegistry(
  definitions: Record<string, AppletDefinition> = {},
): AppletRegistry {
  const map = new Map(Object.entries(definitions))

  return {
    async get(key: string) {
      const value = map.get(key)
      if (!value) return undefined
      return { key, value, bundleId: 'test-bundle' }
    },
    async has(key: string) {
      return map.has(key)
    },
    async keys() {
      return Array.from(map.keys())
    },
  }
}

describe('LocalAppletLauncher edge cases', () => {
  let launcher: LocalAppletLauncher
  let portAllocator: PortAllocator
  let instances: AppletInstance[] = []

  const strictConfirmDefinition: AppletDefinition = {
    id: 'strict-confirm',
    type: 'applet',
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.object({
      approved: z.boolean(),
      reason: z.string().min(5),
    }),
    timeoutMs: 500,
    init: async () => {},
    dispose: async () => {},
  }

  beforeEach(() => {
    portAllocator = new PortAllocator(10000, 20000)

    const registry = createMockRegistry({
      'strict-confirm': strictConfirmDefinition,
    })

    launcher = new LocalAppletLauncher({
      registry,
      portAllocator,
      serverFactoryResolver: () => new MinimalTestServerFactory(),
      defaultTimeoutMs: 500,
    })

    instances = []
  })

  afterEach(async () => {
    for (const instance of instances) {
      await instance.terminator.terminate()
    }
    await portAllocator.releaseAll()
  })

  describe('output schema validation', () => {
    it('should reject with AppletValidationError when response does not match outputSchema', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'strict-confirm',
        { message: 'Test' },
        ctx,
      )
      instances.push(instance)

      // Start waiting BEFORE sending response - attach rejection handler immediately
      const responsePromise = instance.waitForResponse().catch((e) => e)

      // Send response that violates schema (missing required 'reason' field)
      await fetch(`${instance.url}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const result = await responsePromise
      expect(result).toBeInstanceOf(AppletValidationError)

      // Remove from instances since we already handled the rejection
      instances.pop()
      await instance.terminator.terminate()
    }, 2000)

    it('should include instanceId and Zod error details in AppletValidationError', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'strict-confirm',
        { message: 'Test' },
        ctx,
      )
      instances.push(instance)

      // Start waiting BEFORE sending response - attach rejection handler immediately
      const responsePromise = instance.waitForResponse().catch((e) => e)

      // Send response with invalid data (reason too short)
      await fetch(`${instance.url}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true, reason: 'abc' }),
      })

      const error = await responsePromise
      expect(error).toBeInstanceOf(AppletValidationError)

      const validationError = error as AppletValidationError
      expect(validationError.instanceId).toBe(instance.id)
      expect(validationError.zodError).toBeDefined()
      expect(validationError.zodError.issues).toHaveLength(1)
      expect(validationError.zodError.issues[0].path).toContain('reason')
      expect(validationError.zodError.issues[0].code).toBe('too_small')

      // Remove from instances since we already handled the rejection
      instances.pop()
      await instance.terminator.terminate()
    }, 2000)
  })
})
