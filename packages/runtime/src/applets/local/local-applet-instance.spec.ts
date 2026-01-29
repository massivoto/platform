/**
 * LocalAppletInstance Tests
 *
 * Tests for the local applet instance with waitForResponse and timeout handling.
 * Uses real clock (not mocks) as specified in PRD.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { z } from 'zod'
import { LocalAppletInstance } from './local-applet-instance.js'
import { PortAllocator } from './port-allocator.js'
import { MinimalTestServerFactory } from './server-factories/minimal-test-factory.js'
import { AppletTimeoutError, AppletTerminatedError } from '../errors.js'

describe('LocalAppletInstance', () => {
  let portAllocator: PortAllocator
  let instance: LocalAppletInstance
  const serverFactory = new MinimalTestServerFactory()

  beforeEach(async () => {
    portAllocator = new PortAllocator(10000, 20000)
  })

  afterEach(async () => {
    if (instance) {
      await instance.terminator.terminate()
    }
    await portAllocator.releaseAll()
  })

  describe('construction', () => {
    it('should create instance with correct properties', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      expect(instance.id).toBe('ctest123456789012345678')
      expect(instance.appletId).toBe('confirm')
      expect(instance.url).toBe(`http://localhost:${port}`)
      expect(instance.terminator).toBeDefined()
      expect(instance.terminator.isTerminated).toBe(false)
    })
  })

  describe('start', () => {
    it('should start server and make it accessible', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Test' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      // Verify server is running
      const response = await fetch(`http://127.0.0.1:${port}/`)
      expect(response.ok).toBe(true)
    })

    it('should serve input data at /input', async () => {
      const port = await portAllocator.allocate()
      const inputData = { message: 'Confirm this action?', items: [1, 2, 3] }

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: inputData,
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      const response = await fetch(`http://127.0.0.1:${port}/input`)
      const json = await response.json()
      expect(json).toEqual(inputData)
    })
  })

  describe('waitForResponse', () => {
    it('should resolve when POST /respond is received', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      // Start waiting for response
      const responsePromise = instance.waitForResponse<{ approved: boolean }>()

      // Simulate user response
      await fetch(`http://127.0.0.1:${port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      const result = await responsePromise
      expect(result).toEqual({ approved: true })
    })

    it('should validate response against output schema', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({
          approved: z.boolean(),
          comment: z.string().optional(),
        }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      const responsePromise = instance.waitForResponse()

      await fetch(`http://127.0.0.1:${port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false, comment: 'Not ready yet' }),
      })

      const result = await responsePromise
      expect(result).toEqual({ approved: false, comment: 'Not ready yet' })
    })

    it('should reject with AppletTimeoutError after timeout', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 100, // Short timeout for testing
      })

      await instance.start(serverFactory)

      // Don't send any response - let it timeout
      await expect(instance.waitForResponse()).rejects.toThrow(
        AppletTimeoutError,
      )
    }, 2000)

    it('should reject with AppletTerminatedError when terminated', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      const responsePromise = instance.waitForResponse()

      // Terminate before response
      await instance.terminator.terminate()

      await expect(responsePromise).rejects.toThrow(AppletTerminatedError)
    })

    it('should handle response with selected items (grid applet scenario)', async () => {
      const port = await portAllocator.allocate()

      const gridSchema = z.object({
        selected: z.array(z.string()),
      })

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'grid',
        port,
        input: { items: ['item1', 'item2', 'item3', 'item4', 'item5'] },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: gridSchema,
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      const responsePromise = instance.waitForResponse<{ selected: string[] }>()

      await fetch(`http://127.0.0.1:${port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: ['item1', 'item3'] }),
      })

      const result = await responsePromise
      expect(result.selected).toEqual(['item1', 'item3'])
    })
  })

  describe('terminator', () => {
    it('should expose terminator that can stop the server', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: { message: 'Approve?' },
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.object({ approved: z.boolean() }),
        portAllocator,
        timeoutMs: 8000,
      })

      await instance.start(serverFactory)

      // Verify server is running
      const beforeResponse = await fetch(`http://127.0.0.1:${port}/`)
      expect(beforeResponse.ok).toBe(true)

      // Terminate
      await instance.terminator.terminate()
      expect(instance.terminator.isTerminated).toBe(true)

      // Server should be stopped - connection refused
      await expect(
        fetch(`http://127.0.0.1:${port}/`, {
          signal: AbortSignal.timeout(500),
        }),
      ).rejects.toThrow()
    })
  })

  describe('port property', () => {
    it('should expose port for terminator', async () => {
      const port = await portAllocator.allocate()

      instance = new LocalAppletInstance({
        id: 'ctest123456789012345678',
        appletId: 'confirm',
        port,
        input: {},
        ctx: createEmptyExecutionContext('user-123'),
        outputSchema: z.any(),
        portAllocator,
        timeoutMs: 8000,
      })

      expect(instance.port).toBe(port)
    })
  })
})
