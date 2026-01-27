/**
 * Grid Applet Definition
 *
 * AppletDefinition for the grid applet, matching the schema
 * defined in CoreAppletsBundle.
 *
 * Requirements:
 * - R-GRID-03: Export definition from package entry point
 */

import type { AppletDefinition } from '@massivoto/kit'
import { gridInputSchema, gridOutputSchema } from './types.js'

// Re-export schemas for convenience
export { gridInputSchema, gridOutputSchema }

/**
 * Applet definition for the grid applet.
 *
 * Used by LocalAppletLauncher to validate input/output and
 * to find the package name for dynamic imports.
 */
export const definition: AppletDefinition = {
  id: 'grid',
  type: 'applet',
  inputSchema: gridInputSchema,
  outputSchema: gridOutputSchema,
  packageName: '@massivoto/applet-grid',
  timeoutMs: 5 * 60 * 1000, // 5 minutes default timeout
  init: async () => {},
  dispose: async () => {},
}
