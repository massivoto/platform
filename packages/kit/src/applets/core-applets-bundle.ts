/**
 * CoreAppletsBundle - Built-in applet definitions
 *
 * Requirements:
 * - R-APP-41: Implements RegistryBundle<AppletDefinition>
 * - R-APP-42: Define confirm applet
 * - R-APP-43: Define grid applet
 * - R-APP-44: Define generation applet
 */

import { z } from 'zod'
import type { RegistryBundle } from '../registry/types.js'
import type { AppletDefinition } from './types.js'

/**
 * Helper to create an applet definition with common defaults.
 */
function createAppletDefinition(
  id: string,
  inputSchema: z.ZodSchema,
  outputSchema: z.ZodSchema,
  options?: { packageName?: string; timeoutMs?: number },
): AppletDefinition {
  return {
    id,
    type: 'applet',
    inputSchema,
    outputSchema,
    packageName: options?.packageName,
    timeoutMs: options?.timeoutMs,
    init: async () => {},
    dispose: async () => {},
  }
}

/**
 * Input schema for confirm applet.
 * - message: Required message to display
 * - title: Optional dialog title
 * - resourceUrl: Optional URL for media display (image, video, PDF, embed)
 */
const confirmInputSchema = z.object({
  message: z.string(),
  title: z.string().optional(),
  resourceUrl: z.string().url().optional(),
})

/**
 * Output schema for confirm applet.
 * - approved: Whether the user approved
 */
const confirmOutputSchema = z.object({
  approved: z.boolean(),
})

/**
 * Input schema for grid applet.
 * - items: Array of items to display
 * - labelKey: Optional key to use as label (defaults to 'id')
 */
const gridInputSchema = z.object({
  items: z.array(z.unknown()),
  labelKey: z.string().optional(),
})

/**
 * Output schema for grid applet.
 * - selected: Array of selected item IDs
 */
const gridOutputSchema = z.object({
  selected: z.array(z.string()),
})

/**
 * Input schema for generation applet.
 * - items: Array of items to generate content for
 * - prompt: Optional custom prompt
 * - model: Optional model override (falls back to runtime config)
 */
const generationInputSchema = z.object({
  items: z.array(z.unknown()),
  prompt: z.string().optional(),
  model: z.string().optional(),
})

/**
 * Output schema for generation applet.
 * - results: Array of { id, text } pairs
 */
const generationOutputSchema = z.object({
  results: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    }),
  ),
})

/**
 * CoreAppletsBundle - provides built-in applet definitions.
 *
 * Applets:
 * - confirm: Simple yes/no confirmation dialog
 * - grid: Multi-select grid for choosing items
 * - generation: AI content generation with human review
 *
 * @example
 * ```typescript
 * const registry = new AppletRegistry()
 * registry.addBundle(new CoreAppletsBundle())
 * await registry.reload()
 *
 * const confirmEntry = await registry.get('confirm')
 * ```
 */
export class CoreAppletsBundle implements RegistryBundle<AppletDefinition> {
  readonly id = 'core'

  async load(): Promise<Map<string, AppletDefinition>> {
    const map = new Map<string, AppletDefinition>()

    // R-APP-42: Confirm applet
    map.set(
      'confirm',
      createAppletDefinition(
        'confirm',
        confirmInputSchema,
        confirmOutputSchema,
      ),
    )

    // R-APP-43: Grid applet
    map.set(
      'grid',
      createAppletDefinition('grid', gridInputSchema, gridOutputSchema),
    )

    // R-APP-44: Generation applet
    map.set(
      'generation',
      createAppletDefinition(
        'generation',
        generationInputSchema,
        generationOutputSchema,
      ),
    )

    return map
  }
}
