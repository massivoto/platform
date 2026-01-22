/**
 * AppletServerFactory Interface
 *
 * Abstraction for creating HTTP servers for applets.
 * This allows testing LocalAppletLauncher without real applet packages.
 */

import type * as http from 'node:http'

/**
 * Configuration for creating an applet server.
 */
export interface AppletServerConfig {
  /** Port to listen on */
  port: number

  /** Input data to serve to the frontend */
  input: unknown

  /** Callback when user submits a response */
  onResponse: (data: unknown) => void
}

/**
 * Factory that creates HTTP servers for applets.
 * Implementations:
 * - MinimalTestServerFactory: For testing, raw Node.js http
 * - AppletPackageServerFactory: For production, loads npm packages
 */
export interface AppletServerFactory {
  /**
   * Create an HTTP server for the applet.
   * The server should:
   * - Listen on the specified port
   * - Handle POST /respond by calling onResponse
   * - Optionally serve GET /input with input data
   */
  createServer(config: AppletServerConfig): http.Server
}
