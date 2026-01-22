/**
 * LocalAppletTerminator Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LocalAppletTerminator } from './local-applet-terminator.js'
import { PortAllocator } from './port-allocator.js'
import { AppletTerminatedError } from '../errors.js'

// Mock interface matching what LocalAppletInstance exposes internally
interface MockAppletInstance {
  id: string
  port: number
  _stopServer: () => void
  _rejectResponse: (error: Error) => void
}

describe('LocalAppletTerminator', () => {
  let mockInstance: MockAppletInstance
  let portAllocator: PortAllocator
  let terminator: LocalAppletTerminator

  beforeEach(() => {
    mockInstance = {
      id: 'test-instance-123',
      port: 12345,
      _stopServer: vi.fn(),
      _rejectResponse: vi.fn(),
    }

    portAllocator = new PortAllocator(10000, 20000)
    // Simulate that port is already allocated
    ;(portAllocator as any).allocatedPorts = new Set([12345])

    terminator = new LocalAppletTerminator(mockInstance as any, portAllocator)
  })

  describe('isTerminated', () => {
    it('should be false initially', () => {
      expect(terminator.isTerminated).toBe(false)
    })

    it('should be true after terminate() is called', async () => {
      await terminator.terminate()
      expect(terminator.isTerminated).toBe(true)
    })
  })

  describe('terminate', () => {
    it('should stop the server', async () => {
      await terminator.terminate()
      expect(mockInstance._stopServer).toHaveBeenCalledOnce()
    })

    it('should release the port', async () => {
      expect(portAllocator.isAllocated(12345)).toBe(true)

      await terminator.terminate()

      expect(portAllocator.isAllocated(12345)).toBe(false)
    })

    it('should reject pending response with AppletTerminatedError', async () => {
      await terminator.terminate()

      expect(mockInstance._rejectResponse).toHaveBeenCalledOnce()
      const error = (mockInstance._rejectResponse as any).mock.calls[0][0]
      expect(error).toBeInstanceOf(AppletTerminatedError)
      expect(error.instanceId).toBe('test-instance-123')
    })

    it('should be idempotent - second call does nothing', async () => {
      await terminator.terminate()
      await terminator.terminate()

      expect(mockInstance._stopServer).toHaveBeenCalledOnce()
      expect(mockInstance._rejectResponse).toHaveBeenCalledOnce()
    })

    it('should set isTerminated to true', async () => {
      expect(terminator.isTerminated).toBe(false)
      await terminator.terminate()
      expect(terminator.isTerminated).toBe(true)
    })
  })
})
