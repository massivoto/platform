/**
 * AppletPackageServerFactory
 *
 * Production factory that loads applet packages and creates Express servers.
 * Each applet package exports createServer() and frontendDir.
 */

import * as http from 'node:http'
import type {
  AppletServerConfig,
  AppletServerFactory,
} from './server-factory.js'

/**
 * Production factory that loads applet npm packages.
 * Expects packages to export:
 * - createServer(config): Express app
 * - frontendDir: Path to static frontend files
 */
export class AppletPackageServerFactory implements AppletServerFactory {
  constructor(private readonly packageName: string) {}

  createServer(config: AppletServerConfig): http.Server {
    // Dynamic import of the applet package
    // This is a placeholder - actual implementation would use
    // await import(this.packageName) or require()

    // For now, throw to indicate this is not implemented for v0.5
    // Tests use MinimalTestServerFactory instead
    throw new Error(
      `AppletPackageServerFactory not implemented. ` +
        `Package: ${this.packageName}. ` +
        `Use MinimalTestServerFactory for testing.`,
    )
  }
}
