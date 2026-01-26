/**
 * AI Commands Module
 *
 * R-AI-01: Create ai/ directory in core-handlers with index barrel export
 */
export { TextHandler } from './text.handler.js'
export { ImageHandler } from './image.handler.js'
export type {
  AiProvider,
  AiProviderName,
  TextRequest,
  TextResult,
  ImageRequest,
  ImageResult,
} from './types.js'
export { DEFAULT_AI_PROVIDER } from './types.js'
export { GeminiProvider } from './providers/index.js'
