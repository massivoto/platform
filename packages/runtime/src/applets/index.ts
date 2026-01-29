/**
 * Applet System
 *
 * Provides the AppletLauncher interface and implementations for
 * launching human-in-the-loop applets during automation workflows.
 */

// Shared interfaces
export type {
  AppletLauncher,
  AppletInstance,
  AppletTerminator,
  AppletDefinition,
  AppletRegistry,
} from '@massivoto/kit'

// Error types
export {
  AppletNotFoundError,
  AppletTimeoutError,
  AppletTerminatedError,
  AppletValidationError,
} from './errors.js'

// Local implementation (v0.5)
export { LocalAppletLauncher } from './local/index.js'
export type { LocalAppletLauncherConfig } from './local/index.js'
