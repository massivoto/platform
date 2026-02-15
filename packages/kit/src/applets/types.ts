import type { ExecutionContext } from '../domain/index.js'

/**
 * Applet Type Definitions
 *
 * Shared interfaces for the applet system. Both local (v0.5) and cloud (v1.0)
 * runtimes use these interfaces.
 *
 * R-APP-01: AppletDefinition extends RegistryItem
 * R-APP-02: Export from @massivoto/kit
 */

import type { ZodSchema } from 'zod'
import type { RegistryItem } from '../registry/types.js'

/**
 * AppletDefinition - Configuration for an applet type.
 * Stored in AppletRegistry.
 *
 * Extends RegistryItem for consistency with CommandHandler pattern.
 */
export interface AppletDefinition extends RegistryItem {
  /** Always "applet" */
  readonly type: 'applet'

  /** Zod schema for validating input data */
  readonly inputSchema: ZodSchema

  /** Zod schema for validating response data */
  readonly outputSchema: ZodSchema

  /** npm package name, defaults to @massivoto/applet-{id} */
  readonly packageName?: string

  /** Per-applet timeout in ms, falls back to launcher default */
  readonly timeoutMs?: number
}
/**
 * Applet System Types
 *
 * Shared interfaces for the applet system. Both local (v0.5) and cloud (v1.0)
 * implementations use these interfaces.
 *
 * R-APP-61: Import AppletDefinition from @massivoto/kit
 * R-APP-62: Remove duplicate AppletDefinition (keep only launcher interfaces)
 */

/**
 * AppletLauncher - Creates and manages applet instances.
 * Implemented by LocalAppletLauncher (v0.5) and CloudAppletLauncher (v1.0).
 */
export interface AppletLauncher {
  /**
   * Launch an applet instance.
   * @param appletId - Registry key ("confirm", "grid", "generation")
   * @param input - Data to display/validate (validated against inputSchema)
   * @param ctx - ExecutionContext for store/auth access
   * @returns Instance of the running applet
   * @throws AppletNotFoundError if appletId is not in registry
   * @throws AppletValidationError if input fails schema validation
   */
  launch(
    appletId: string,
    input: unknown,
    ctx: ExecutionContext,
  ): Promise<AppletInstance>
}

/**
 * AppletInstance - A running applet waiting for user response.
 */
export interface AppletInstance {
  /** Unique instance identifier (cuid) */
  readonly id: string

  /** URL where the applet is accessible */
  readonly url: string

  /** Applet definition ID */
  readonly appletId: string

  /** Terminator for this instance */
  readonly terminator: AppletTerminator

  /**
   * Wait for user to submit response.
   * Blocks until POST /respond is received or timeout.
   * @returns User response (validated against outputSchema)
   * @throws AppletTimeoutError after timeout
   * @throws AppletTerminatedError if terminated before response
   */
  waitForResponse<T>(): Promise<T>
}

/**
 * AppletTerminator - Controls the lifecycle of an applet instance.
 */
export interface AppletTerminator {
  /**
   * Terminate the applet instance.
   * Stops the server, releases the port, rejects pending waitForResponse.
   */
  terminate(): Promise<void>

  /** Whether the instance has been terminated */
  readonly isTerminated: boolean
}

/**
 * AppletRegistry - Registry for applet definitions.
 * Uses the same pattern as CommandRegistry from @massivoto/kit.
 *
 * Note: The concrete implementation is AppletRegistry from @massivoto/kit.
 * This interface is kept for backwards compatibility and typing.
 */
export interface AppletRegistry {
  get(key: string): Promise<
    | {
        key: string
        value: AppletDefinition
        bundleId: string
      }
    | undefined
  >
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
}
