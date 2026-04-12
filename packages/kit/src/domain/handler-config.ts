/**
 * Handler Configuration Types
 *
 * Defines the structure for per-capability AI provider and model configuration.
 * Used by massivoto.config.json to override default provider selection.
 *
 * R-HC-10: AiCapability type
 * R-HC-11: CapabilityConfig type
 * R-HC-12: HandlerConfig type
 */

/**
 * Known AI handler capabilities.
 * Each AI handler declares one of these to enable config-based routing.
 */
export type AiCapability = 'text' | 'image' | 'image-analysis' | 'embedding'

/**
 * Configuration for a single capability or handler override.
 * Specifies which provider and model to use.
 */
export interface CapabilityConfig {
  /** Provider name (normalized to AiProviderName) */
  provider: string
  /** Model ID or tier alias (e.g., 'gpt-4o', 'best', 'light') */
  model?: string
  /** Fallback provider if the primary is unavailable */
  fallback?: string
}

/**
 * Handler configuration loaded from massivoto.config.json.
 * Provides per-capability and per-handler AI provider/model preferences.
 *
 * Resolution order: handler-specific > capability > AI_PROVIDERS > default
 */
export interface HandlerConfig {
  ai?: {
    /** Per-capability defaults */
    text?: CapabilityConfig
    image?: CapabilityConfig
    'image-analysis'?: CapabilityConfig
    embedding?: CapabilityConfig
    /** Per-handler overrides (key is handler ID, e.g., "@ai/prompt/reverseImage") */
    handlers?: Record<string, CapabilityConfig>
  }
}
