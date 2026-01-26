/**
 * Docker Entry Point for Confirm Applet
 *
 * Container-specific entry point that:
 * - Reads configuration from environment variables
 * - Handles graceful shutdown (SIGTERM/SIGINT)
 * - Logs startup and shutdown events
 *
 * Requirements:
 * - R-DOCKER-41: Container entry point
 * - R-DOCKER-42: Read configuration from environment variables
 * - R-DOCKER-43: Handle SIGTERM for graceful shutdown
 * - R-DOCKER-44: Log startup and shutdown events
 * - R-DOCKER-51: Port configurable via PORT environment variable
 * - R-DOCKER-52: Default port is 3000
 * - R-DOCKER-53: Log the port it's listening on
 */

import type { Server } from 'http'
import { createServer, type ConfirmInput } from './server.js'

const APPLET_ID = 'confirm'
const DEFAULT_PORT = 3000
const SHUTDOWN_TIMEOUT_MS = 10000

/**
 * Parses port from environment variable with validation.
 */
export function parsePort(envPort: string | undefined): number {
  if (!envPort) {
    return DEFAULT_PORT
  }
  const port = parseInt(envPort, 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    console.warn(
      `[applet-${APPLET_ID}] Invalid PORT "${envPort}", using default ${DEFAULT_PORT}`,
    )
    return DEFAULT_PORT
  }
  return port
}

/**
 * Parses input data from APPLET_INPUT_* environment variables.
 */
export function parseInputFromEnv(): ConfirmInput {
  return {
    message: process.env.APPLET_INPUT_MESSAGE || 'Please confirm',
    title: process.env.APPLET_INPUT_TITLE || undefined,
    resourceUrl: process.env.APPLET_INPUT_RESOURCE_URL || undefined,
  }
}

let server: Server | null = null
let isShuttingDown = false

/**
 * Starts the applet server.
 */
async function start(): Promise<void> {
  const port = parsePort(process.env.PORT)
  const input = parseInputFromEnv()

  console.log(`[applet-${APPLET_ID}] Starting on port ${port}`)
  console.log(
    `[applet-${APPLET_ID}] Input: ${JSON.stringify({ message: input.message, title: input.title })}`,
  )

  const app = createServer({
    input,
    onResponse: ({ approved }) => {
      console.log(
        `[applet-${APPLET_ID}] Response received: ${approved ? 'APPROVED' : 'REJECTED'}`,
      )
      // In container mode, response is sent via callback URL or message queue
      // For now, just log and continue running
    },
  })

  server = app.listen(port, () => {
    console.log(`[applet-${APPLET_ID}] Ready at http://localhost:${port}`)
  })
}

/**
 * Handles graceful shutdown for ECS/Kubernetes.
 */
export function shutdown(signal: string): void {
  if (isShuttingDown) {
    console.log(`[applet-${APPLET_ID}] Shutdown already in progress`)
    return
  }

  isShuttingDown = true
  console.log(`[applet-${APPLET_ID}] Received ${signal}, shutting down gracefully`)

  if (server) {
    server.close(() => {
      console.log(`[applet-${APPLET_ID}] Server closed`)
      process.exit(0)
    })

    // Force exit after timeout
    setTimeout(() => {
      console.log(`[applet-${APPLET_ID}] Forcing shutdown after timeout`)
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
  } else {
    process.exit(0)
  }
}

// Only run startup logic when executed directly (not imported for testing)
// Check if this module is the entry point using import.meta.url
const isMainModule = process.argv[1]?.endsWith('docker-entry.js')

if (isMainModule) {
  // Register signal handlers for graceful shutdown
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Start the server
  start().catch((err) => {
    console.error(`[applet-${APPLET_ID}] Failed to start:`, err)
    process.exit(1)
  })
}
