/**
 * Confirm Applet Server
 *
 * Express server factory for the confirm applet. Serves the React frontend
 * and provides API endpoints for input data and response handling.
 *
 * Requirements:
 * - R-CONFIRM-21: createServer factory
 * - R-CONFIRM-22: GET / serves frontend
 * - R-CONFIRM-23: GET /api/input returns input data
 * - R-CONFIRM-24: POST /respond accepts { approved: boolean }
 */

import express, { type Express, type Request, type Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHealthMiddleware } from '@massivoto/kit'

/**
 * Input data for the confirm applet.
 */
export interface ConfirmInput {
  /** Message to display to the user */
  message: string
  /** Optional title for the dialog (defaults to "Confirmation") */
  title?: string
  /** Optional resource URL to display (image, video, PDF, embed) */
  resourceUrl?: string
}

/**
 * Configuration for creating the confirm applet server.
 */
export interface CreateServerConfig {
  /** Input data to display in the UI */
  input: ConfirmInput
  /** Callback when user responds */
  onResponse: (data: { approved: boolean }) => void
}

/**
 * Path to the built frontend directory.
 * Used by LocalAppletLauncher to configure static file serving.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const frontendDir = path.join(__dirname, 'front')

/**
 * Creates an Express server for the confirm applet.
 *
 * @param config - Server configuration with input data and response callback
 * @returns Express application instance
 *
 * @example
 * ```ts
 * const app = createServer({
 *   input: { message: 'Approve this content?', title: 'Review' },
 *   onResponse: ({ approved }) => console.log('User responded:', approved)
 * })
 *
 * app.listen(3000, () => console.log('Confirm applet running on port 3000'))
 * ```
 */
export function createServer(config: CreateServerConfig): Express {
  const app = express()
  let hasResponded = false

  app.use(express.json())

  // R-DOCKER-31: Health check endpoint for container orchestration
  app.get('/health', createHealthMiddleware('confirm'))

  // R-CONFIRM-22: Serve frontend static files
  app.use(express.static(frontendDir))

  // R-CONFIRM-23: GET /api/input returns input data
  app.get('/api/input', (_req: Request, res: Response) => {
    res.json(config.input)
  })

  // R-CONFIRM-24: POST /respond accepts { approved: boolean }
  app.post('/respond', (req: Request, res: Response) => {
    // Prevent duplicate responses
    if (hasResponded) {
      res.status(400).json({ error: 'Response already submitted' })
      return
    }

    const { approved } = req.body

    // Validate approved field
    if (typeof approved !== 'boolean') {
      res
        .status(400)
        .json({ error: 'Missing or invalid field: approved must be a boolean' })
      return
    }

    hasResponded = true
    config.onResponse({ approved })
    res.json({ ok: true })
  })

  // Serve index.html for SPA routing (Express 5 requires named parameter)
  app.get('/{*splat}', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDir, 'index.html'))
  })

  return app
}
