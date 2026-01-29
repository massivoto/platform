import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ConfirmHandler } from './confirm.handler.js'
import type {
  AppletLauncher,
  AppletInstance,
  AppletTerminator,
} from '@massivoto/kit'
import { createEmptyExecutionContext } from '../../context/core-context.js'

/**
 * Test file: confirm.handler.spec.ts
 * Theme: Social Media Automation (Emma, Carlos, tweet, followers)
 *
 * Tests for @human/confirm handler (R-CONFIRM-101 to R-CONFIRM-106)
 */

function createMockTerminator(): AppletTerminator {
  return {
    terminate: vi.fn().mockResolvedValue(undefined),
    isTerminated: false,
  }
}

function createMockInstance(
  response: { approved: boolean },
  terminator?: AppletTerminator,
): AppletInstance {
  return {
    id: 'instance-123',
    url: 'http://localhost:3456',
    appletId: 'confirm',
    terminator: terminator ?? createMockTerminator(),
    waitForResponse: vi.fn().mockResolvedValue(response),
  }
}

function createMockLauncher(instance: AppletInstance): AppletLauncher {
  return {
    launch: vi.fn().mockResolvedValue(instance),
  }
}

describe('ConfirmHandler', () => {
  describe('R-CONFIRM-101: handler registration', () => {
    it('should have id property set to @human/confirm', () => {
      const handler = new ConfirmHandler()

      expect(handler.id).toBe('@human/confirm')
    })

    it('should have type property set to command', () => {
      const handler = new ConfirmHandler()

      expect(handler.type).toBe('command')
    })

    it('should have init() method', async () => {
      const handler = new ConfirmHandler()

      await expect(handler.init()).resolves.toBeUndefined()
    })

    it('should have dispose() method', async () => {
      const handler = new ConfirmHandler()

      await expect(handler.dispose()).resolves.toBeUndefined()
    })
  })

  describe('R-CONFIRM-102: validates required message argument', () => {
    it('should fail when message is missing', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({}, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Message is required')
    })

    it('should fail when message is undefined', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')

      const result = await handler.run({ message: undefined }, context)

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('Message is required')
    })

    it('should succeed with valid message', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.success).toBe(true)
    })

    it('should accept optional title argument', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run(
        { message: 'Do you confirm?', title: 'Tweet Approval' },
        context,
      )

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'confirm',
        expect.objectContaining({ title: 'Tweet Approval' }),
        context,
      )
    })

    it('should accept optional resourceUrl argument', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run(
        {
          message: 'Do you confirm?',
          resourceUrl: 'https://example.com/image.png',
        },
        context,
      )

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'confirm',
        expect.objectContaining({
          resourceUrl: 'https://example.com/image.png',
        }),
        context,
      )
    })
  })

  describe('R-CONFIRM-103: retrieves appletLauncher from context', () => {
    it('should fail when appletLauncher is not configured', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      // appletLauncher is undefined by default

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.success).toBe(false)
      expect(result.fatalError).toBe('AppletLauncher not configured')
    })

    it('should use appletLauncher from context when available', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run({ message: 'Do you confirm tweet?' }, context)

      expect(mockLauncher.launch).toHaveBeenCalled()
    })
  })

  describe('R-CONFIRM-104: calls appletLauncher.launch', () => {
    it('should call launch with confirm applet id', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run({ message: 'Do you confirm tweet?' }, context)

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'confirm',
        expect.any(Object),
        context,
      )
    })

    it('should pass input with message, title, and resourceUrl', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      await handler.run(
        {
          message: 'Approve this content?',
          title: 'Content Review',
          resourceUrl: 'https://example.com/video.mp4',
        },
        context,
      )

      expect(mockLauncher.launch).toHaveBeenCalledWith(
        'confirm',
        {
          message: 'Approve this content?',
          title: 'Content Review',
          resourceUrl: 'https://example.com/video.mp4',
        },
        context,
      )
    })

    it('should log the applet URL', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:4567',
        appletId: 'confirm',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockResolvedValue({ approved: true }),
      }
      const mockLauncher = createMockLauncher(mockInstance)
      context.appletLauncher = mockLauncher

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      await handler.run({ message: 'Do you confirm?' }, context)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('http://localhost:4567'),
      )

      consoleSpy.mockRestore()
    })
  })

  describe('R-CONFIRM-105: sets context.status during wait', () => {
    it('should set status to waitingHumanValidation before waiting', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      let statusDuringWait: string | undefined

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:3456',
        appletId: 'confirm',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockImplementation(async () => {
          statusDuringWait = context.status
          return { approved: true }
        }),
      }
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ message: 'Do you confirm?' }, context)

      expect(statusDuringWait).toBe('waitingHumanValidation')
    })

    it('should restore status to running after successful response', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ message: 'Do you confirm?' }, context)

      expect(context.status).toBe('running')
    })

    it('should set status to error when applet fails', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')

      const mockTerminator = createMockTerminator()
      const mockInstance: AppletInstance = {
        id: 'instance-123',
        url: 'http://localhost:3456',
        appletId: 'confirm',
        terminator: mockTerminator,
        waitForResponse: vi.fn().mockRejectedValue(new Error('Timeout')),
      }
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run({ message: 'Do you confirm?' }, context)

      expect(result.success).toBe(false)
      expect(context.status).toBe('error')
    })
  })

  describe('R-CONFIRM-106: returns approved boolean as value', () => {
    it('should return true when user approves', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.success).toBe(true)
      expect(result.value).toBe(true)
    })

    it('should return false when user rejects', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: false })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.success).toBe(true)
      expect(result.value).toBe(false)
    })

    it('should have cost 0', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.cost).toBe(0)
    })

    it('should include descriptive message on approval', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: true })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.messages).toContainEqual(
        expect.stringContaining('Approved'),
      )
    })

    it('should include descriptive message on rejection', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockInstance = createMockInstance({ approved: false })
      context.appletLauncher = createMockLauncher(mockInstance)

      const result = await handler.run(
        { message: 'Do you confirm tweet?' },
        context,
      )

      expect(result.messages).toContainEqual(
        expect.stringContaining('Rejected'),
      )
    })

    it('should terminate the applet instance after response', async () => {
      const handler = new ConfirmHandler()
      const context = createEmptyExecutionContext('emma-123')
      const mockTerminator = createMockTerminator()
      const mockInstance = createMockInstance(
        { approved: true },
        mockTerminator,
      )
      context.appletLauncher = createMockLauncher(mockInstance)

      await handler.run({ message: 'Do you confirm tweet?' }, context)

      expect(mockTerminator.terminate).toHaveBeenCalled()
    })
  })
})
