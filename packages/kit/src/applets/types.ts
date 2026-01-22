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
