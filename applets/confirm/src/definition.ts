/**
 * Confirm Applet Definition
 *
 * AppletDefinition for the confirm applet, matching the schema
 * defined in CoreAppletsBundle.
 *
 * Requirements:
 * - R-CONFIRM-03: Export definition from package entry point
 */

import { z } from 'zod'
import type { AppletDefinition } from '@massivoto/kit'

/**
 * Input schema for confirm applet.
 * - message: Required message to display
 * - title: Optional dialog title
 * - resourceUrl: Optional URL for media display
 */
export const confirmInputSchema = z.object({
  message: z.string(),
  title: z.string().optional(),
  resourceUrl: z.string().url().optional(),
})

/**
 * Output schema for confirm applet.
 * - approved: Whether the user clicked Approve (true) or Reject (false)
 */
export const confirmOutputSchema = z.object({
  approved: z.boolean(),
})

/**
 * Type-safe input type derived from schema.
 */
export type ConfirmInput = z.infer<typeof confirmInputSchema>

/**
 * Type-safe output type derived from schema.
 */
export type ConfirmOutput = z.infer<typeof confirmOutputSchema>

/**
 * Applet definition for the confirm applet.
 *
 * Used by LocalAppletLauncher to validate input/output and
 * to find the package name for dynamic imports.
 */
export const definition: AppletDefinition = {
  id: 'confirm',
  type: 'applet',
  inputSchema: confirmInputSchema,
  outputSchema: confirmOutputSchema,
  packageName: '@massivoto/applet-confirm',
  timeoutMs: 5 * 60 * 1000, // 5 minutes default timeout
  init: async () => {},
  dispose: async () => {},
}
