/**
 * Tests for Health Middleware
 *
 * R-DOCKER-31: All applet servers implement GET /health endpoint
 * R-DOCKER-32: Health endpoint returns { status: "healthy", applet: "<id>", uptime: <seconds> }
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createHealthMiddleware } from './health-middleware.js'

type Request = any
type Response = any

describe('createHealthMiddleware', () => {
  let mockRequest: Partial<Request>
  let mockResponse: Partial<Response>
  let jsonSpy: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockRequest = {}
    jsonSpy = vi.fn()
    mockResponse = {
      json: jsonSpy,
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * R-DOCKER-31: Creates a request handler
   */
  it('should create a request handler function', () => {
    const middleware = createHealthMiddleware('confirm')
    expect(typeof middleware).toBe('function')
  })

  /**
   * R-DOCKER-32: Health endpoint returns status "healthy"
   */
  it('should return status "healthy"', () => {
    const middleware = createHealthMiddleware('confirm')
    middleware(mockRequest as Request, mockResponse as Response, vi.fn())

    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'healthy',
      }),
    )
  })

  /**
   * R-DOCKER-32: Health endpoint returns applet id
   */
  it('should return applet id', () => {
    const middleware = createHealthMiddleware('confirm')
    middleware(mockRequest as Request, mockResponse as Response, vi.fn())

    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        applet: 'confirm',
      }),
    )
  })

  /**
   * R-DOCKER-32: Health endpoint returns uptime in seconds
   */
  it('should return uptime in seconds', () => {
    const middleware = createHealthMiddleware('grid')
    middleware(mockRequest as Request, mockResponse as Response, vi.fn())

    expect(jsonSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        uptime: expect.any(Number),
      }),
    )
  })

  /**
   * R-DOCKER-32: Uptime should be a non-negative number
   */
  it('should return non-negative uptime', () => {
    const middleware = createHealthMiddleware('confirm')
    middleware(mockRequest as Request, mockResponse as Response, vi.fn())

    const callArgs = jsonSpy.mock.calls[0][0]
    expect(callArgs.uptime).toBeGreaterThanOrEqual(0)
  })

  /**
   * Different applet ids should be returned correctly
   */
  it('should return correct applet id for different applets', () => {
    const gridMiddleware = createHealthMiddleware('grid')
    const customMiddleware = createHealthMiddleware('custom-applet')

    gridMiddleware(mockRequest as Request, mockResponse as Response, vi.fn())
    expect(jsonSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        applet: 'grid',
      }),
    )

    customMiddleware(mockRequest as Request, mockResponse as Response, vi.fn())
    expect(jsonSpy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        applet: 'custom-applet',
      }),
    )
  })

  /**
   * AC-DOCKER-03: Given a running server, GET /health returns correct response
   */
  it('AC-DOCKER-03: should return complete health response', () => {
    const middleware = createHealthMiddleware('confirm')
    middleware(mockRequest as Request, mockResponse as Response, vi.fn())

    expect(jsonSpy).toHaveBeenCalledWith({
      status: 'healthy',
      applet: 'confirm',
      uptime: expect.any(Number),
    })
  })
})

describe('createHealthMiddleware with custom start time', () => {
  /**
   * Test uptime calculation with custom start time
   */
  it('should calculate uptime from provided start time', () => {
    // Create middleware with a start time 10 seconds ago
    const tenSecondsAgo = Date.now() - 10000
    const middleware = createHealthMiddleware('confirm', tenSecondsAgo)

    const jsonSpy = vi.fn()
    const mockResponse = { json: jsonSpy } as unknown as Response

    middleware({} as Request, mockResponse, vi.fn())

    const callArgs = jsonSpy.mock.calls[0][0]
    // Uptime should be approximately 10 seconds (allow for test execution time)
    expect(callArgs.uptime).toBeGreaterThanOrEqual(10)
    expect(callArgs.uptime).toBeLessThan(15)
  })
})
