/**
 * Grid Applet Server
 *
 * Express server factory for the grid applet. Serves the React frontend
 * and provides API endpoints for input data and response handling.
 *
 * Requirements:
 * - R-GRID-21: createServer factory
 * - R-GRID-22: GET / serves frontend
 * - R-GRID-23: GET /api/input returns input data
 * - R-GRID-24: POST /respond accepts { selected: string[] }
 * - R-GRID-25: Server maps selected IDs back to full GridItem objects
 */

import express, { type Express, type Request, type Response } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import { createHealthMiddleware } from '@massivoto/kit'
import type { GridItem, GridInput } from './types.js'

/**
 * Configuration for creating the grid applet server.
 */
export interface CreateServerConfig {
  /** Input data containing items to display */
  input: GridInput
  /** Callback when user responds with selected items */
  onResponse: (data: { selected: GridItem[] }) => void
}

/**
 * Path to the built frontend directory.
 * Used by LocalAppletLauncher to configure static file serving.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const frontendDir = path.join(__dirname, 'front')

/**
 * Creates an Express server for the grid applet.
 *
 * @param config - Server configuration with input data and response callback
 * @returns Express application instance
 *
 * @example
 * ```ts
 * const app = createServer({
 *   input: {
 *     items: [{ id: '1', text: 'Option A' }, { id: '2', text: 'Option B' }],
 *     title: 'Select items'
 *   },
 *   onResponse: ({ selected }) => console.log('User selected:', selected)
 * })
 *
 * app.listen(3000, () => console.log('Grid applet running on port 3000'))
 * ```
 */
export function createServer(config: CreateServerConfig): Express {
  const app = express()
  let hasResponded = false

  app.use(express.json())

  // Health check endpoint for container orchestration
  app.get('/health', createHealthMiddleware('grid'))

  // R-GRID-22: Serve frontend static files
  app.use(express.static(frontendDir))

  // R-GRID-23: GET /api/input returns input data
  app.get('/api/input', (_req: Request, res: Response) => {
    res.json(config.input)
  })

  // R-GRID-24: POST /respond accepts { selected: string[] }
  // R-GRID-25: Server maps selected IDs back to full GridItem objects
  app.post('/respond', (req: Request, res: Response) => {
    // Prevent duplicate responses
    if (hasResponded) {
      res.status(400).json({ error: 'Response already submitted' })
      return
    }

    const { selected } = req.body

    // Validate selected field
    if (!selected || !Array.isArray(selected)) {
      res
        .status(400)
        .json({ error: 'Missing or invalid field: selected must be an array' })
      return
    }

    hasResponded = true

    // Map IDs back to full items, preserving input array order
    const selectedIds = new Set(selected as string[])
    const selectedItems = config.input.items.filter((item) =>
      selectedIds.has(item.id),
    )

    config.onResponse({ selected: selectedItems })
    res.json({ ok: true })
  })

  // Serve index.html for SPA routing (Express 5 requires named parameter)
  app.get('/{*splat}', (_req: Request, res: Response) => {
    res.sendFile(path.join(frontendDir, 'index.html'))
  })

  return app
}
