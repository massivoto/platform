/**
 * PortAllocator Tests
 *
 * Tests for dynamic port allocation in the 10000-20000 range.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as net from 'node:net'
import { PortAllocator } from './port-allocator.js'

describe('PortAllocator', () => {
  let allocator: PortAllocator

  beforeEach(() => {
    allocator = new PortAllocator(10000, 20000)
  })

  afterEach(async () => {
    // Clean up any allocated ports
    await allocator.releaseAll()
  })

  describe('allocate', () => {
    it('should allocate a port in the specified range', async () => {
      const port = await allocator.allocate()

      expect(port).toBeGreaterThanOrEqual(10000)
      expect(port).toBeLessThanOrEqual(20000)
    })

    it('should allocate different ports on consecutive calls', async () => {
      const port1 = await allocator.allocate()
      const port2 = await allocator.allocate()

      expect(port1).not.toBe(port2)
    })

    it('should allocate an available port that can be bound', async () => {
      const port = await allocator.allocate()

      // Verify we can actually bind to the port
      const server = net.createServer()
      await new Promise<void>((resolve, reject) => {
        server.listen(port, '127.0.0.1', () => resolve())
        server.on('error', reject)
      })

      // Clean up
      await new Promise<void>((resolve) => server.close(() => resolve()))
    })

    it('should track allocated ports', async () => {
      const port = await allocator.allocate()

      expect(allocator.isAllocated(port)).toBe(true)
    })

    it('should not reallocate a port that is already allocated', async () => {
      const ports: number[] = []
      for (let i = 0; i < 5; i++) {
        ports.push(await allocator.allocate())
      }

      // All ports should be unique
      const uniquePorts = new Set(ports)
      expect(uniquePorts.size).toBe(5)
    })
  })

  describe('release', () => {
    it('should release an allocated port', async () => {
      const port = await allocator.allocate()
      expect(allocator.isAllocated(port)).toBe(true)

      allocator.release(port)

      expect(allocator.isAllocated(port)).toBe(false)
    })

    it('should not throw when releasing an unallocated port', () => {
      expect(() => allocator.release(15000)).not.toThrow()
    })
  })

  describe('releaseAll', () => {
    it('should release all allocated ports', async () => {
      const port1 = await allocator.allocate()
      const port2 = await allocator.allocate()

      expect(allocator.isAllocated(port1)).toBe(true)
      expect(allocator.isAllocated(port2)).toBe(true)

      await allocator.releaseAll()

      expect(allocator.isAllocated(port1)).toBe(false)
      expect(allocator.isAllocated(port2)).toBe(false)
    })
  })

  describe('custom range', () => {
    it('should allocate ports in a custom range', async () => {
      const customAllocator = new PortAllocator(30000, 30100)
      const port = await customAllocator.allocate()

      expect(port).toBeGreaterThanOrEqual(30000)
      expect(port).toBeLessThanOrEqual(30100)

      await customAllocator.releaseAll()
    })
  })

  describe('edge cases', () => {
    it('should find available port when some ports are in use', async () => {
      // Block a port manually
      const blockedServer = net.createServer()
      const blockedPort = await new Promise<number>((resolve, reject) => {
        blockedServer.listen(0, '127.0.0.1', () => {
          const addr = blockedServer.address() as net.AddressInfo
          resolve(addr.port)
        })
        blockedServer.on('error', reject)
      })

      // Allocator should still work - it will find a different port
      const port = await allocator.allocate()
      expect(port).not.toBe(blockedPort)

      // Clean up
      await new Promise<void>((resolve) => blockedServer.close(() => resolve()))
    })
  })
})
