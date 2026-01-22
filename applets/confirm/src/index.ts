/**
 * @massivoto/applet-confirm
 *
 * Confirm applet for human validation checkpoints. Provides a simple
 * approve/reject UI with optional resource display (images, videos, PDFs).
 *
 * Requirements:
 * - R-CONFIRM-03: Export definition, createServer, and frontendDir
 *
 * @example
 * ```ts
 * import { definition, createServer, frontendDir } from '@massivoto/applet-confirm'
 *
 * // Validate input
 * const validInput = definition.inputSchema.parse({
 *   message: 'Approve this content?',
 *   title: 'Content Review',
 *   resourceUrl: 'https://example.com/image.jpg'
 * })
 *
 * // Create server for LocalAppletLauncher
 * const app = createServer({
 *   input: validInput,
 *   onResponse: ({ approved }) => {
 *     console.log('User response:', approved)
 *   }
 * })
 * ```
 */

// Definition
export {
  definition,
  confirmInputSchema,
  confirmOutputSchema,
} from './definition.js'
export type { ConfirmInput, ConfirmOutput } from './definition.js'

// Server
export { createServer, frontendDir } from './server.js'
export type {
  CreateServerConfig,
  ConfirmInput as ServerConfirmInput,
} from './server.js'

// Resource type utilities
export { getResourceType, toEmbedUrl } from './resource-type.js'
export type { ResourceType } from './resource-type.js'
