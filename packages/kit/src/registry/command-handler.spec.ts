/**
 * Command Handler execution tests.
 *
 * Theme: Record Store
 * Testing that command handlers loaded from modules can be executed.
 * This validates the full flow: load module → get handler → call execute().
 */

import { describe, it, expect, vi } from 'vitest'
import { BaseComposableRegistry } from './base-composable-registry.js'
import { ModuleSource } from './module-source.js'
import {
  FixtureCommandHandler,
  commandHandlerAdapter,
} from './fixtures/types.js'

const COMMAND_HANDLERS = new URL(
  './fixtures/command-handlers.js',
  import.meta.url,
).href

function createCommandSource() {
  return new ModuleSource<FixtureCommandHandler>({
    id: 'core-commands',
    modulePath: COMMAND_HANDLERS,
    adapter: commandHandlerAdapter,
  })
}

describe('Command Handler Execution', () => {
  describe('when store clerk Emma runs the echo command', () => {
    it('executes and returns the echoed message', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const entry = await registry.get('@utils/echo')
      expect(entry).toBeDefined()
      expect(entry!.value.type).toBe('command')

      const result = await entry!.value.execute({
        message: 'Hello, Record Store!',
      })

      expect(result.success).toBe(true)
      expect(result.value).toBe('Hello, Record Store!')
    })
  })

  describe('when store clerk Emma runs the add command', () => {
    it('executes and returns the sum of two numbers', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const entry = await registry.get('@utils/add')
      const result = await entry!.value.execute({ a: 10, b: 32 })

      expect(result.success).toBe(true)
      expect(result.value).toBe(42)
    })
  })

  describe('when a command fails', () => {
    it('returns a failure result with error message', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const entry = await registry.get('@utils/fail')
      const result = await entry!.value.execute({})

      expect(result.success).toBe(false)
      expect(result.error).toBe('This command always fails')
    })
  })

  describe('when executing a slow command with options', () => {
    it('respects the timeout option', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const entry = await registry.get('@utils/slow')

      // Fast execution succeeds
      const fastResult = await entry!.value.execute(
        { delay: 10 },
        { timeout: 1000 },
      )
      expect(fastResult.success).toBe(true)
      expect(fastResult.value).toBe('Completed after 10ms')

      // Execution that would exceed timeout fails
      const slowResult = await entry!.value.execute(
        { delay: 2000 },
        { timeout: 100 },
      )
      expect(slowResult.success).toBe(false)
      expect(slowResult.error).toContain('timeout')
    })
  })

  describe('lifecycle integration with execute', () => {
    it('calls init() before execute becomes available', async () => {
      const initSpy = vi.fn().mockResolvedValue(undefined)
      const executeSpy = vi
        .fn()
        .mockResolvedValue({ success: true, value: 'done' })

      const mockSource = {
        id: 'mock',
        load: async () =>
          new Map<string, FixtureCommandHandler>([
            [
              '@mock/cmd',
              {
                id: '@mock/cmd',
                type: 'command',
                init: initSpy,
                dispose: vi.fn(),
                execute: executeSpy,
              },
            ],
          ]),
      }

      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(mockSource)
      await registry.reload()

      // init should have been called during reload
      expect(initSpy).toHaveBeenCalledTimes(1)

      // Now execute should work
      const entry = await registry.get('@mock/cmd')
      await entry!.value.execute({ foo: 'bar' })

      expect(executeSpy).toHaveBeenCalledTimes(1)
      expect(executeSpy).toHaveBeenCalledWith({ foo: 'bar' })
    })

    it('calls dispose() before reload, then init() on new handlers', async () => {
      const firstDisposeSpy = vi.fn().mockResolvedValue(undefined)
      const secondInitSpy = vi.fn().mockResolvedValue(undefined)
      const secondExecuteSpy = vi
        .fn()
        .mockResolvedValue({ success: true, value: 'v2' })

      let loadCount = 0
      const mockSource = {
        id: 'mock',
        load: async () => {
          loadCount++
          if (loadCount === 1) {
            return new Map<string, FixtureCommandHandler>([
              [
                '@mock/cmd',
                {
                  id: '@mock/cmd',
                  type: 'command',
                  init: vi.fn(),
                  dispose: firstDisposeSpy,
                  execute: vi
                    .fn()
                    .mockResolvedValue({ success: true, value: 'v1' }),
                },
              ],
            ])
          } else {
            return new Map<string, FixtureCommandHandler>([
              [
                '@mock/cmd',
                {
                  id: '@mock/cmd',
                  type: 'command',
                  init: secondInitSpy,
                  dispose: vi.fn(),
                  execute: secondExecuteSpy,
                },
              ],
            ])
          }
        },
      }

      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(mockSource)

      // First load
      await registry.reload()
      const v1Entry = await registry.get('@mock/cmd')
      const v1Result = await v1Entry!.value.execute({})
      expect(v1Result.value).toBe('v1')

      // Reload - should dispose old, init new
      await registry.reload()
      expect(firstDisposeSpy).toHaveBeenCalledTimes(1)
      expect(secondInitSpy).toHaveBeenCalledTimes(1)

      // Execute new version
      const v2Entry = await registry.get('@mock/cmd')
      const v2Result = await v2Entry!.value.execute({})
      expect(v2Result.value).toBe('v2')
    })
  })

  describe('source provenance with commands', () => {
    it('tracks which source provided each command', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const entry = await registry.get('@utils/echo')

      expect(entry?.sourceId).toBe('core-commands')
      expect(entry?.key).toBe('@utils/echo')
    })
  })

  describe('listing available commands', () => {
    it('returns all registered command keys', async () => {
      const registry = new BaseComposableRegistry<FixtureCommandHandler>()
      registry.addSource(createCommandSource())
      await registry.reload()

      const keys = await registry.keys()

      expect(keys).toContain('@utils/echo')
      expect(keys).toContain('@utils/add')
      expect(keys).toContain('@utils/fail')
      expect(keys).toContain('@utils/slow')
      expect(keys).toHaveLength(4)
    })
  })
})
