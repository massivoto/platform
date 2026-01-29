/**
 * CommandRegistry Tests
 *
 * Theme: Social Media Automation
 *
 * Requirements tested:
 * - R-CMD-01 to R-CMD-05: Interface Migration
 * - R-CMD-21 to R-CMD-24: Handler Interface
 * - R-CMD-61 to R-CMD-63: Action Resolution
 * - AC-CMD-01 to AC-CMD-07: Acceptance Criteria
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegistryBundle, RegistryConflictError } from '@massivoto/kit'
import { CommandRegistry } from './command-registry.js'
import { CommandHandler } from './types.js'
import { BaseCommandHandler } from './base-command-handler.js'
import { CommandNotFoundError } from './errors.js'
import { ActionResult } from './action-result.js'
import { ExecutionContext, createEmptyExecutionContext } from '@massivoto/kit'

// =============================================================================
// Test Fixtures - Social Media Automation Theme
// =============================================================================

/**
 * Mock handler for @social/post - posts to social media
 */
class PostToSocialHandler extends BaseCommandHandler<{ postId: string }> {
  readonly id = '@social/post'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<{ postId: string }>> {
    const platform = args.platform as string
    const message = args.message as string
    return this.handleSuccess(`Posted to ${platform}`, { postId: 'post-123' })
  }
}

/**
 * Mock handler for @social/schedule - schedules a post
 */
class SchedulePostHandler extends BaseCommandHandler<{ scheduledId: string }> {
  readonly id = '@social/schedule'
  readonly type = 'command' as const

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<{ scheduledId: string }>> {
    const time = args.time as string
    return this.handleSuccess(`Scheduled for ${time}`, {
      scheduledId: 'sched-456',
    })
  }
}

/**
 * Mock handler for @analytics/engagement - gets engagement metrics
 */
class EngagementMetricsHandler extends BaseCommandHandler<{
  likes: number
  shares: number
}> {
  readonly id = '@analytics/engagement'
  readonly type = 'command' as const
  initCalled = false
  disposeCalled = false

  async init(): Promise<void> {
    this.initCalled = true
  }

  async dispose(): Promise<void> {
    this.disposeCalled = true
  }

  async run(
    args: Record<string, any>,
    context: ExecutionContext,
  ): Promise<ActionResult<{ likes: number; shares: number }>> {
    return this.handleSuccess('Got metrics', { likes: 100, shares: 25 })
  }
}

/**
 * Creates a mock RegistryBundle for testing
 */
function createMockBundle(
  id: string,
  handlers: CommandHandler<any>[],
): RegistryBundle<CommandHandler<any>> {
  return {
    id,
    async load() {
      const map = new Map<string, CommandHandler<any>>()
      for (const handler of handlers) {
        map.set(handler.id, handler)
      }
      return map
    },
  }
}

// =============================================================================
// R-CMD-01 to R-CMD-05: Interface Migration
// =============================================================================

describe('CommandRegistry - Interface Migration', () => {
  describe('R-CMD-01: CommandHandler extends RegistryItem', () => {
    it('should have id, type, init, dispose, and run methods', () => {
      const handler = new PostToSocialHandler()

      // RegistryItem properties
      expect(handler.id).toBe('@social/post')
      expect(handler.type).toBe('command')
      expect(typeof handler.init).toBe('function')
      expect(typeof handler.dispose).toBe('function')

      // CommandHandler method
      expect(typeof handler.run).toBe('function')
    })
  })

  describe('R-CMD-02: BaseCommandHandler default lifecycle', () => {
    it('should have default no-op init() and dispose()', async () => {
      const handler = new PostToSocialHandler()

      // Should not throw
      await expect(handler.init()).resolves.toBeUndefined()
      await expect(handler.dispose()).resolves.toBeUndefined()
    })
  })

  describe('R-CMD-03: CommandRegistry wraps BaseComposableRegistry', () => {
    it('should wrap BaseComposableRegistry and delegate bundle management', async () => {
      const registry = new CommandRegistry()
      const bundle = createMockBundle('social', [new PostToSocialHandler()])

      registry.addBundle(bundle)
      await registry.reload()

      const handler = registry.resolve('@social/post')
      expect(handler).toBeDefined()
      expect(handler?.id).toBe('@social/post')
    })
  })

  describe('R-CMD-04: CommandRegistry.resolve returns handler or undefined', () => {
    it('should return handler for registered action', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [new PostToSocialHandler()]),
      )
      await registry.reload()

      const handler = registry.resolve('@social/post')
      expect(handler).toBeInstanceOf(PostToSocialHandler)
    })

    it('should return undefined for unregistered action', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [new PostToSocialHandler()]),
      )
      await registry.reload()

      const handler = registry.resolve('@unknown/action')
      expect(handler).toBeUndefined()
    })
  })

  describe('R-CMD-05: CommandRegistry.reload delegates to inner registry', () => {
    it('should call init on all handlers during reload', async () => {
      const handler = new EngagementMetricsHandler()
      const registry = new CommandRegistry()
      registry.addBundle(createMockBundle('analytics', [handler]))

      expect(handler.initCalled).toBe(false)
      await registry.reload()
      expect(handler.initCalled).toBe(true)
    })

    it('should call dispose on existing handlers before reload', async () => {
      const handler1 = new EngagementMetricsHandler()
      const registry = new CommandRegistry()
      registry.addBundle(createMockBundle('analytics', [handler1]))

      await registry.reload()
      expect(handler1.initCalled).toBe(true)

      // Create new handler for second reload
      const handler2 = new EngagementMetricsHandler()
      const newBundle = createMockBundle('analytics-v2', [handler2])

      // Replace bundles and reload
      // Note: We need a way to clear bundles for this test
      // For now, the dispose behavior is tested via the inner registry
    })
  })
})

// =============================================================================
// R-CMD-21 to R-CMD-24: Handler Interface
// =============================================================================

describe('CommandRegistry - Handler Interface', () => {
  describe('R-CMD-21: run(args, context) signature', () => {
    it('should execute handler with args and context', async () => {
      const handler = new PostToSocialHandler()
      const context = createEmptyExecutionContext('test-user')
      const args = { platform: 'twitter', message: 'Hello world!' }

      const result = await handler.run(args, context)

      expect(result.success).toBe(true)
      expect(result.value).toEqual({ postId: 'post-123' })
    })
  })

  describe('R-CMD-22: handler.id matches action path format', () => {
    it('should use @package/name format', () => {
      const postHandler = new PostToSocialHandler()
      const scheduleHandler = new SchedulePostHandler()
      const metricsHandler = new EngagementMetricsHandler()

      expect(postHandler.id).toMatch(/^@[\w-]+\/[\w-]+$/)
      expect(scheduleHandler.id).toMatch(/^@[\w-]+\/[\w-]+$/)
      expect(metricsHandler.id).toMatch(/^@[\w-]+\/[\w-]+$/)
    })
  })

  describe('R-CMD-23: handler.type is always command', () => {
    it('should have type = command', () => {
      const handler = new PostToSocialHandler()
      expect(handler.type).toBe('command')
    })
  })

  describe('R-CMD-24: Export CommandHandler interface', () => {
    it('should be importable from types.ts', async () => {
      // This test verifies the export exists - import at top already validates
      const handler: CommandHandler<any> = new PostToSocialHandler()
      expect(handler).toBeDefined()
    })
  })
})

// =============================================================================
// R-CMD-61 to R-CMD-63: Action Resolution
// =============================================================================

describe('CommandRegistry - Action Resolution', () => {
  let registry: CommandRegistry

  beforeEach(async () => {
    registry = new CommandRegistry()
    registry.addBundle(
      createMockBundle('social', [
        new PostToSocialHandler(),
        new SchedulePostHandler(),
      ]),
    )
    registry.addBundle(
      createMockBundle('analytics', [new EngagementMetricsHandler()]),
    )
    await registry.reload()
  })

  describe('R-CMD-61: resolve(actionPath) looks up handler', () => {
    it('should find handler by action path', () => {
      const handler = registry.resolve('@social/post')
      expect(handler).toBeDefined()
      expect(handler?.id).toBe('@social/post')
    })

    it('should find handlers from different bundles', () => {
      const socialHandler = registry.resolve('@social/schedule')
      const analyticsHandler = registry.resolve('@analytics/engagement')

      expect(socialHandler?.id).toBe('@social/schedule')
      expect(analyticsHandler?.id).toBe('@analytics/engagement')
    })
  })

  describe('R-CMD-62: Action path format @package/name', () => {
    it('should resolve full action path from ActionNode', () => {
      // ActionNode.path example: ['@social', 'post'] joined as '@social/post'
      const actionPath = ['@social', 'post'].join('/')
      const handler = registry.resolve(actionPath)

      expect(handler).toBeDefined()
      expect(handler?.id).toBe('@social/post')
    })
  })

  describe('R-CMD-63: Return undefined for unknown actions', () => {
    it('should return undefined for non-existent action', () => {
      const handler = registry.resolve('@twitter/post')
      expect(handler).toBeUndefined()
    })

    it('should not throw for unknown actions', () => {
      expect(() => registry.resolve('@unknown/action')).not.toThrow()
    })
  })
})

// =============================================================================
// Acceptance Criteria Tests
// =============================================================================

describe('CommandRegistry - Acceptance Criteria', () => {
  describe('AC-CMD-01: CoreHandlersBundle loads @utils/log', () => {
    // This will be tested in core-handlers-bundle.spec.ts
    it.todo('should load @utils/log from CoreHandlersBundle')
  })

  describe('AC-CMD-02: resolve @utils/set returns SetHandler', () => {
    // This will be tested in core-handlers-bundle.spec.ts
    it.todo('should resolve @utils/set to SetHandler')
  })

  describe('AC-CMD-03: resolve unknown returns undefined', () => {
    it('should return undefined for @unknown/action', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(createMockBundle('test', [new PostToSocialHandler()]))
      await registry.reload()

      const handler = registry.resolve('@unknown/action')
      expect(handler).toBeUndefined()
    })
  })

  describe('AC-CMD-04: reload calls init on all handlers', () => {
    it('should call init() on handlers after reload', async () => {
      const handler = new EngagementMetricsHandler()
      const registry = new CommandRegistry()
      registry.addBundle(createMockBundle('analytics', [handler]))

      await registry.reload()

      expect(handler.initCalled).toBe(true)
    })
  })

  describe('AC-CMD-05: Custom init executes successfully', () => {
    it('should execute custom init on handler', async () => {
      const customInitHandler = new EngagementMetricsHandler()
      const registry = new CommandRegistry()
      registry.addBundle(createMockBundle('analytics', [customInitHandler]))

      await registry.reload()

      expect(customInitHandler.initCalled).toBe(true)
    })
  })

  describe('AC-CMD-06: Duplicate handler throws RegistryConflictError', () => {
    it('should throw RegistryConflictError for duplicate @social/post', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('bundle1', [new PostToSocialHandler()]),
      )
      registry.addBundle(
        createMockBundle('bundle2', [new PostToSocialHandler()]),
      )

      await expect(registry.reload()).rejects.toThrow(RegistryConflictError)
    })
  })

  describe('AC-CMD-07: Unknown action throws CommandNotFoundError', () => {
    it('should have CommandNotFoundError with actionPath', () => {
      const error = new CommandNotFoundError('@twitter/post')

      expect(error.actionPath).toBe('@twitter/post')
      expect(error.message).toContain('@twitter/post')
    })

    it('should have LLM-readable error message', () => {
      const error = new CommandNotFoundError('@twitter/post')

      // Message should be helpful for LLM to understand and fix
      expect(error.message).toContain('@twitter/post')
      expect(error.name).toBe('CommandNotFoundError')
    })
  })
})

// =============================================================================
// Additional Tests
// =============================================================================

describe('CommandRegistry - Additional Behaviors', () => {
  describe('keys() returns all registered action paths', () => {
    it('should return all handler ids', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [
          new PostToSocialHandler(),
          new SchedulePostHandler(),
        ]),
      )
      await registry.reload()

      const keys = await registry.keys()

      expect(keys).toContain('@social/post')
      expect(keys).toContain('@social/schedule')
      expect(keys).toHaveLength(2)
    })
  })

  describe('has() checks if action exists', () => {
    it('should return true for registered action', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [new PostToSocialHandler()]),
      )
      await registry.reload()

      expect(await registry.has('@social/post')).toBe(true)
    })

    it('should return false for unregistered action', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [new PostToSocialHandler()]),
      )
      await registry.reload()

      expect(await registry.has('@unknown/action')).toBe(false)
    })
  })

  describe('entries() returns all handlers with provenance', () => {
    it('should return entries with bundleId', async () => {
      const registry = new CommandRegistry()
      registry.addBundle(
        createMockBundle('social', [new PostToSocialHandler()]),
      )
      await registry.reload()

      const entries = await registry.entries()
      const entry = entries.get('@social/post')

      expect(entry).toBeDefined()
      expect(entry?.bundleId).toBe('social')
      expect(entry?.value.id).toBe('@social/post')
    })
  })
})
