/**
 * @massivoto/applet-grid
 *
 * Grid applet for multi-select human validation checkpoints. Provides a
 * grid UI with checkboxes for selecting items, with optional resource
 * display (images, videos, audio) and metadata key/value pairs.
 *
 * Requirements:
 * - R-GRID-03: Export definition, createServer, and frontendDir
 *
 * @example
 * ```ts
 * import { definition, createServer, frontendDir } from '@massivoto/applet-grid'
 *
 * // Validate input
 * const validInput = definition.inputSchema.parse({
 *   items: [
 *     { id: '1', text: 'Option A' },
 *     { id: '2', text: 'Option B' },
 *   ],
 *   title: 'Select items',
 * })
 *
 * // Create server for LocalAppletLauncher
 * const app = createServer({
 *   input: validInput,
 *   onResponse: ({ selected }) => {
 *     console.log('User selected:', selected.map(item => item.text))
 *   }
 * })
 * ```
 */

// Definition
export {
  definition,
  gridInputSchema,
  gridOutputSchema,
} from './definition.js'

// Types
export {
  gridItemSchema,
  type GridItem,
  type GridInput,
  type GridOutput,
} from './types.js'

// Server
export { createServer, frontendDir } from './server.js'
export type { CreateServerConfig } from './server.js'
