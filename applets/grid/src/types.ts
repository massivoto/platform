/**
 * Grid Applet Type Definitions
 *
 * Requirements:
 * - R-GRID-11: GridItem has required id: string and text: string
 * - R-GRID-12: GridItem has optional resource
 * - R-GRID-13: GridItem has optional metadata
 * - R-GRID-14: gridInputSchema and gridOutputSchema
 */

import { z } from 'zod'

/**
 * Schema for a single grid item.
 *
 * Each item must have a unique id and display text.
 * Optionally includes a resource (image/video/audio) and metadata key/value pairs.
 */
export const gridItemSchema = z.object({
  /** Required unique identifier for the item */
  id: z.string(),

  /** Required display text for the item */
  text: z.string(),

  /** Optional resource to display (image, video, or audio) */
  resource: z
    .object({
      url: z.string().url(),
      type: z.enum(['image', 'video', 'audio']).optional(),
    })
    .optional(),

  /** Optional key/value metadata to display */
  metadata: z.record(z.string()).optional(),
})

/**
 * Type-safe GridItem type derived from schema.
 */
export type GridItem = z.infer<typeof gridItemSchema>

/**
 * Input schema for grid applet.
 * - items: Array of GridItem (at least 1 required)
 * - title: Optional title to display at top
 */
export const gridInputSchema = z.object({
  items: z.array(gridItemSchema).min(1),
  title: z.string().optional(),
})

/**
 * Type-safe input type derived from schema.
 */
export type GridInput = z.infer<typeof gridInputSchema>

/**
 * Output schema for grid applet.
 * - selected: Array of full GridItem objects that were selected
 */
export const gridOutputSchema = z.object({
  selected: z.array(gridItemSchema),
})

/**
 * Type-safe output type derived from schema.
 */
export type GridOutput = z.infer<typeof gridOutputSchema>
