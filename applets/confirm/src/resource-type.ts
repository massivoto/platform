/**
 * Resource Type Detection
 *
 * Auto-detects the type of a resource from its URL for proper rendering.
 *
 * Requirements:
 * - R-CONFIRM-61: getResourceType detects image/video/audio/pdf/embed
 * - R-CONFIRM-62: Image URLs (jpg, png, gif, webp, svg)
 * - R-CONFIRM-63: Video (mp4, webm) and audio (mp3, wav, ogg)
 * - R-CONFIRM-64: PDF and YouTube/Vimeo embeds
 */

/**
 * Supported resource types for display in the confirm applet.
 */
export type ResourceType =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'embed'
  | 'unknown'

/**
 * Detects the resource type from a URL based on extension or domain patterns.
 *
 * @param url - The resource URL to analyze
 * @returns The detected resource type
 *
 * @example
 * ```ts
 * getResourceType('https://example.com/photo.jpg') // 'image'
 * getResourceType('https://youtube.com/watch?v=abc') // 'embed'
 * getResourceType('https://example.com/doc.pdf') // 'pdf'
 * ```
 */
export function getResourceType(url: string): ResourceType {
  const lower = url.toLowerCase()

  // Image extensions
  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(lower)) {
    return 'image'
  }

  // Video extensions
  if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(lower)) {
    return 'video'
  }

  // Audio extensions
  if (/\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(lower)) {
    return 'audio'
  }

  // PDF extension
  if (/\.pdf(\?.*)?$/i.test(lower)) {
    return 'pdf'
  }

  // YouTube and Vimeo embeds
  if (/youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d+/.test(lower)) {
    return 'embed'
  }

  return 'unknown'
}

/**
 * Converts a video platform URL to an embeddable URL.
 *
 * Supports:
 * - YouTube watch URLs: youtube.com/watch?v=ID
 * - YouTube short URLs: youtu.be/ID
 * - Vimeo URLs: vimeo.com/ID
 *
 * @param url - The original video URL
 * @returns The embeddable URL, or the original URL if not a supported platform
 *
 * @example
 * ```ts
 * toEmbedUrl('https://www.youtube.com/watch?v=abc123')
 * // Returns: 'https://www.youtube.com/embed/abc123'
 *
 * toEmbedUrl('https://vimeo.com/123456')
 * // Returns: 'https://player.vimeo.com/video/123456'
 * ```
 */
export function toEmbedUrl(url: string): string {
  // YouTube watch URL: youtube.com/watch?v=ID
  const ytWatchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (ytWatchMatch) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`
  }

  // YouTube short URL: youtu.be/ID
  const ytShortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (ytShortMatch) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}`
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return url
}
