/**
 * Health Middleware for Applets
 *
 * R-DOCKER-31: All applet servers implement GET /health endpoint
 * R-DOCKER-32: Health endpoint returns { status: "healthy", applet: "<id>", uptime: <seconds> }
 */

import type { RequestHandler } from 'express'
import type { HealthResponse } from './applet-docker.types.js'

/**
 * Creates an Express middleware that responds with health status.
 *
 * @param appletId - The applet identifier to include in the response
 * @param startTime - Optional start time in milliseconds (defaults to Date.now())
 * @returns Express request handler for the /health endpoint
 *
 * @example
 * ```typescript
 * import express from 'express'
 * import { createHealthMiddleware } from '@massivoto/kit'
 *
 * const app = express()
 * app.get('/health', createHealthMiddleware('confirm'))
 * ```
 */
export function createHealthMiddleware(
  appletId: string,
  startTime: number = Date.now(),
): RequestHandler {
  return (_req, res) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000)
    const response: HealthResponse = {
      status: 'healthy',
      applet: appletId,
      uptime,
    }
    res.json(response)
  }
}
