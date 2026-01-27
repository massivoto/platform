import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GridHandler } from './grid.handler.js'
import { createEmptyExecutionContext } from '../../../domain/execution-context.js'
import type {
  AppletLauncher,
  AppletInstance,
  AppletTerminator,
} from '../../../applets/types.js'

/**
 * Test file: grid.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet curation)
 *
 * Tests for @human/grid handler (R-GRID-81 to R-GRID-84)
 */

interface GridItem {
  id: string
  text: string
  resource?: { url: string; type?: 'image' | 'video' | 'audio' }
  metadata?: Record<string, string>
}

function createMockTerminator(): AppletTerminator {
  return {
    terminate: vi.fn().mockResolvedValue(undefined),
    isTerminated: false,
  }
}

function createMockInstance(
  response: { selected: GridItem[] },
  terminator?: AppletTerminator,
): AppletInstance {
  return {
    id: 'instance-123',
    url: 'http://localhost:3456',
    appletId: 'grid',
    terminator: terminator ?? createMockTerminator(),
    waitForResponse: vi.fn().mockResolvedValue(response),
  }
}

function createMockLauncher(instance: AppletInstance): AppletLauncher {
  return {
    launch: vi.fn().mockResolvedValue(instance),
  }
}

describe('GridHandler', () => {
  const testItems: GridItem[] = [
    { id: '1', text: 'Tweet A' },
    { id: '2', text: 'Tweet B' },
    { id: '3', text: 'Tweet C' },
  ]

  describe('R-GRID-81: handler registration', () => {
    it('should have id property set to @human/grid', () => {
      const handler = new GridHandler()

      expect(handler.id).toBe('@human/grid')
    })

    it('should have type property set to command', () => {
      const handler = new GridHandler()

      expect(handler.type).toBe('command')
    })

    it('should have init() method', async () => {
      const handler = new GridHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new GridHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })
  })

  describe('R-GRID-82: validates required items argument', () => {
    it('should fail when items is missing', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('Items')
    })

    it('should fail when items is undefined', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ items: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('Items')
    })

    it('should fail when items is not an array', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ items: 'not-an-array' }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('Items')
    })

    it('should fail when items array is empty', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ items: [] }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('empty')
    })

    it('should fail when item is missing id field', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run(
        { items: [{ text: 'Tweet A' }] },
        context,
      )

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('id')
    })

    it('should fail when item is missing text field', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ items: [{ id: '1' }] }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toContain('text')
    })

    it('should succeed with valid items', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.success).toBe(true)
    })

    it('should accept optional title argument', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run(
        { items: testItems, title: 'Select tweets to publish' },
        context,
      )

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'grid',
        expect.objectContaining({ title: 'Select tweets to publish' }),
        context,
      )
    })
  })

  describe('R-GRID-83: retrieves appletLauncher from context', () => {
    it('should fail when appletLauncher is not configured', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      // appletLauncher is undefined by default

      const result = await handler.run({ items: testItems }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('AppletLauncher not configured')
    })

    it('should use appletLauncher from context when available', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run({ items: testItems }, context)

      expect(mockLauncher.launch).toHaveBeenCalled()
    })
  })

  describe('R-GRID-83: sets context.status during wait', () => {
    it('should set status to waitingHumanValidation before waiting', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      let statusDuringWait: string | undefined

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:3456',
        appletId: 'grid',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockImplementation(async () => {
          statusDuringWait = context.status
          return { selected: [] }
        }),
      }
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ items: testItems }, context)

      expect(statusDuringWait).toBe('waitingHumanValidation')
    })

    it('should restore status to running after successful response', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ items: testItems }, context)

      expect(context.status).toBe('running')
    })

    it('should set status to error when applet fails', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:3456',
        appletId: 'grid',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockRejectedValue(new Error('Timeout')),
      }
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.success).toBe(false)
      expect(context.status).toBe('error')
    })
  })

  describe('R-GRID-84: returns selected GridItem[] as value', () => {
    it('should return selected items array when user selects items', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const selectedItems = [testItems[0], testItems[2]]
      const mockInstance = createMockInstance({ selected: selectedItems })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.success).toBe(true)
      expect(result.value).toEqual(selectedItems)
    })

    it('should return empty array when user selects nothing', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.success).toBe(true)
      expect(result.value).toEqual([])
    })

    it('should have cost 0', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [testItems[0]] })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.cost).toBe(0)
    })

    it('should include descriptive message with selection count', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const selectedItems = [testItems[0], testItems[1]]
      const mockInstance = createMockInstance({ selected: selectedItems })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ items: testItems }, context)

      expect(result.messages).toContainEqual(
        expect.stringContaining('2'),
      )
    })

    it('should terminate the applet instance after response', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockTerminator = createMockTerminator()
      const mockInstance = createMockInstance({ selected: [] }, mockTerminator)
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ items: testItems }, context)

      expect(mockTerminator.terminate).toHaveBeenCalled()
    })
  })

  describe('calls appletLauncher.launch correctly', () => {
    it('should call launch with grid applet id', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run({ items: testItems }, context)

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'grid',
        expect.any(Object),
        context,
      )
    })

    it('should pass input with items and title', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ selected: [] })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run(
        {
          items: testItems,
          title: 'Select tweets to publish',
        },
        context,
      )

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'grid',
        {
          items: testItems,
          title: 'Select tweets to publish',
        },
        context,
      )
    })

    it('should log the applet URL', async () => {
      const handler = new GridHandler()
      const context = createEmptyExecutionContext('emma-123')

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:4567',
        appletId: 'grid',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockResolvedValue({ selected: [] }),
      }
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await handler.run({ items: testItems }, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:4567'),
      )

      consoleSpy.mockRestore()
    })
  })
})
