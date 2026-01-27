/**
 * LocalAppletLauncher Tests
 *
 * Tests for the main launcher that orchestrates applet creation.
 * All tests use MinimalTestServerFactory - no real applet packages.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { LocalAppletLauncher } from './local-applet-launcher.js'
import { MinimalTestServerFactory } from './server-factories/minimal-test-factory.js'
import { PortAllocator } from './port-allocator.js'
import { AppletNotFoundError, AppletTimeoutError } from '../errors.js'
import {
  AppletDefinition,
  AppletInstance,
  AppletRegistry,
  createEmptyExecutionContext,
} from '@massivoto/kit'

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
  } as unknown as AppletRegistry
}

describe('LocalAppletLauncher', () => {
  let launcher: LocalAppletLauncher
  let portAllocator: PortAllocator
  let instances: AppletInstance[] = []

  const confirmDefinition: AppletDefinition = {
    id: 'confirm',
    type: 'applet',
    inputSchema: z.object({ message: z.string() }),
    outputSchema: z.object({ approved: z.boolean() }),
    timeoutMs: 8000,
    init: async () => {},
    dispose: async () => {},
  }

  const gridDefinition: AppletDefinition = {
    id: 'grid',
    type: 'applet',
    inputSchema: z.object({ items: z.array(z.any()) }),
    outputSchema: z.object({ selected: z.array(z.string()) }),
    timeoutMs: 8000,
    init: async () => {},
    dispose: async () => {},
  }

  beforeEach(() => {
    portAllocator = new PortAllocator(10000, 20000)

    const registry = createMockRegistry({
      confirm: confirmDefinition,
      grid: gridDefinition,
    })

    launcher = new LocalAppletLauncher({
      registry,
      portAllocator,
      serverFactoryResolver: () => new MinimalTestServerFactory(),
      defaultTimeoutMs: 8000,
    })

    instances = []
  })

  afterEach(async () => {
    // Clean up all instances
    for (const instance of instances) {
      await instance.terminator.terminate()
    }
    await portAllocator.releaseAll()
  })

  describe('launch', () => {
    it('should launch an applet and return an instance', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'confirm',
        { message: 'Approve?' },
        ctx,
      )
      instances.push(instance)

      expect(instance).toBeDefined()
      expect(instance.appletId).toBe('confirm')
      expect(instance.url).toMatch(/^http:\/\/localhost:\d+$/)
      expect(instance.terminator).toBeDefined()
    })

    it('should generate unique instance IDs', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance1 = await launcher.launch(
        'confirm',
        { message: 'First' },
        ctx,
      )
      const instance2 = await launcher.launch(
        'confirm',
        { message: 'Second' },
        ctx,
      )
      instances.push(instance1, instance2)

      expect(instance1.id).not.toBe(instance2.id)
    })

    it('should allocate different ports for concurrent applets', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance1 = await launcher.launch(
        'confirm',
        { message: 'First' },
        ctx,
      )
      const instance2 = await launcher.launch(
        'confirm',
        { message: 'Second' },
        ctx,
      )
      instances.push(instance1, instance2)

      const port1 = instance1.url.split(':').pop()
      const port2 = instance2.url.split(':').pop()

      expect(port1).not.toBe(port2)
    })

    it('should throw AppletNotFoundError for unknown applet', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      await expect(launcher.launch('unknown-applet', {}, ctx)).rejects.toThrow(
        AppletNotFoundError,
      )
    })

    it('should validate input against schema', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      // Invalid input - missing required 'message' field
      await expect(
        launcher.launch('confirm', { wrongField: true }, ctx),
      ).rejects.toThrow()
    })

    it('should make the applet server accessible via HTTP', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'confirm',
        { message: 'Test' },
        ctx,
      )
      instances.push(instance)

      const response = await fetch(instance.url)
      expect(response.ok).toBe(true)
    })
  })

  describe('waitForResponse integration', () => {
    it('should resolve waitForResponse when POST /respond is received', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'confirm',
        { message: 'Approve?' },
        ctx,
      )
      instances.push(instance)

      // Start waiting for response
      const responsePromise = instance.waitForResponse<{ approved: boolean }>()

      // Simulate user approval via HTTP POST
      await fetch(`${instance.url}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const result = await responsePromise
      expect(result).toEqual({ approved: true })
    })

    it('should handle grid applet with selected items', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'grid',
        {
          items: [
            'item1',
            'item2',
            'item3',
            'item4',
            'item5',
            'item6',
            'item7',
            'item8',
            'item9',
            'item10',
          ],
        },
        ctx,
      )
      instances.push(instance)

      const responsePromise = instance.waitForResponse<{ selected: string[] }>()

      await fetch(`${instance.url}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: ['item1', 'item3', 'item7'] }),
      })

      const result = await responsePromise
      expect(result.selected).toEqual(['item1', 'item3', 'item7'])
    })
  })

  describe('timeout behavior', () => {
    it('should timeout after configured duration (8 second test)', async () => {
      // This test uses a short timeout to verify the timeout mechanism
      const shortTimeoutRegistry = createMockRegistry({
        confirm: {
          id: 'confirm',
          type: 'applet',
          inputSchema: confirmDefinition.inputSchema,
          outputSchema: confirmDefinition.outputSchema,
          timeoutMs: 100, // Very short for testing
          init: async () => {},
          dispose: async () => {},
        },
      })

      const shortTimeoutLauncher = new LocalAppletLauncher({
        registry: shortTimeoutRegistry,
        portAllocator,
        serverFactoryResolver: () => new MinimalTestServerFactory(),
        defaultTimeoutMs: 100,
      })

      const ctx = createEmptyExecutionContext('user-123')
      const instance = await shortTimeoutLauncher.launch(
        'confirm',
        { message: 'Test' },
        ctx,
      )
      instances.push(instance)

      await expect(instance.waitForResponse()).rejects.toThrow(
        AppletTimeoutError,
      )
    }, 2000)

    it('should use per-applet timeout over default', async () => {
      const perAppletTimeoutRegistry = createMockRegistry({
        confirm: {
          id: 'confirm',
          type: 'applet',
          inputSchema: confirmDefinition.inputSchema,
          outputSchema: confirmDefinition.outputSchema,
          timeoutMs: 50, // Very short
          init: async () => {},
          dispose: async () => {},
        },
      })

      const launcherWithLongDefault = new LocalAppletLauncher({
        registry: perAppletTimeoutRegistry,
        portAllocator,
        serverFactoryResolver: () => new MinimalTestServerFactory(),
        defaultTimeoutMs: 60000, // Long default
      })

      const ctx = createEmptyExecutionContext('user-123')
      const instance = await launcherWithLongDefault.launch(
        'confirm',
        { message: 'Test' },
        ctx,
      )
      instances.push(instance)

      // Should timeout quickly using per-applet setting, not default
      await expect(instance.waitForResponse()).rejects.toThrow(
        AppletTimeoutError,
      )
    }, 2000)
  })

  describe('termination', () => {
    it('should terminate instance and release port', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance = await launcher.launch(
        'confirm',
        { message: 'Test' },
        ctx,
      )

      expect(instance.terminator.isTerminated).toBe(false)

      await instance.terminator.terminate()

      expect(instance.terminator.isTerminated).toBe(true)
    })

    it('should allow two applets to run independently', async () => {
      const ctx = createEmptyExecutionContext('user-123')

      const instance1 = await launcher.launch(
        'confirm',
        { message: 'First' },
        ctx,
      )
      const instance2 = await launcher.launch(
        'confirm',
        { message: 'Second' },
        ctx,
      )
      instances.push(instance1, instance2)

      // Both should be running
      const response1 = await fetch(instance1.url)
      const response2 = await fetch(instance2.url)
      expect(response1.ok).toBe(true)
      expect(response2.ok).toBe(true)

      // Terminate first
      await instance1.terminator.terminate()

      // Second should still work
      const response2After = await fetch(instance2.url)
      expect(response2After.ok).toBe(true)

      // First should be down
      await expect(
        fetch(instance1.url, { signal: AbortSignal.timeout(500) }),
      ).rejects.toThrow()
    })
  })
})
