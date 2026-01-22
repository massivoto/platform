/**
 * MinimalTestServerFactory Tests
 *
 * Tests for the minimal test server used in unit tests.
 */

import { describe, it, expect, afterEach } from 'vitest'
import * as http from 'node:http'
import { MinimalTestServerFactory } from './minimal-test-factory.js'

describe('MinimalTestServerFactory', () => {
  let server: http.Server | null = null

  afterEach(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve())
      })
      server = null
    }
  })

  describe('createServer', () => {
    it('should create a server that listens on the specified port', async () => {
      const factory = new MinimalTestServerFactory()

      server = factory.createServer({
        port: 0, // Let OS assign port
        input: { message: 'test' },
        onResponse: () => {},
      })

      // Wait for server to start
      await new Promise<void>((resolve) => {
        server!.on('listening', resolve)
      })

      const addr = server.address() as { port: number }
      expect(addr.port).toBeGreaterThan(0)
    })

    it('should handle GET / and return status', async () => {
      const factory = new MinimalTestServerFactory()

      server = factory.createServer({
        port: 0,
        input: { message: 'test' },
        onResponse: () => {},
      })

      await new Promise<void>((resolve) => {
        server!.on('listening', resolve)
      })

      const addr = server.address() as { port: number }
      const response = await fetch(`http://127.0.0.1:${addr.port}/`)

      expect(response.ok).toBe(true)
      const text = await response.text()
      expect(text).toBe('Applet running')
    })

    it('should handle POST /respond and call onResponse', async () => {
      const factory = new MinimalTestServerFactory()
      let receivedData: unknown = null

      server = factory.createServer({
        port: 0,
        input: { message: 'test' },
        onResponse: (data) => {
          receivedData = data
        },
      })

      await new Promise<void>((resolve) => {
        server!.on('listening', resolve)
      })

      const addr = server.address() as { port: number }
      const response = await fetch(`http://127.0.0.1:${addr.port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      expect(response.ok).toBe(true)
      const json = await response.json()
      expect(json).toEqual({ ok: true })
      expect(receivedData).toEqual({ approved: true })
    })

    it('should handle GET /input and return input data', async () => {
      const factory = new MinimalTestServerFactory()
      const inputData = { message: 'Hello', items: [1, 2, 3] }

      server = factory.createServer({
        port: 0,
        input: inputData,
        onResponse: () => {},
      })

      await new Promise<void>((resolve) => {
        server!.on('listening', resolve)
      })

      const addr = server.address() as { port: number }
      const response = await fetch(`http://127.0.0.1:${addr.port}/input`)

      expect(response.ok).toBe(true)
      const json = await response.json()
      expect(json).toEqual(inputData)
    })

    it('should handle multiple POST /respond calls', async () => {
      const factory = new MinimalTestServerFactory()
      const responses: unknown[] = []

      server = factory.createServer({
        port: 0,
        input: {},
        onResponse: (data) => {
          responses.push(data)
        },
      })

      await new Promise<void>((resolve) => {
        server!.on('listening', resolve)
      })

      const addr = server.address() as { port: number }

      // First response
      await fetch(`http://127.0.0.1:${addr.port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first: true }),
      })

      // Second response
      await fetch(`http://127.0.0.1:${addr.port}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ second: true }),
      })

      expect(responses).toHaveLength(2)
      expect(responses[0]).toEqual({ first: true })
      expect(responses[1]).toEqual({ second: true })
    })
  })
})
