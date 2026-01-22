/**
 * Resource Display Component
 *
 * Auto-detects and renders different media types based on URL.
 *
 * Requirements:
 * - R-CONFIRM-62: Render <img> for image URLs
 * - R-CONFIRM-63: Render <video controls> for video, <audio controls> for audio
 * - R-CONFIRM-64: Render <iframe> for PDF and YouTube/Vimeo embeds
 */

/**
 * Supported resource types.
 */
type ResourceType = 'image' | 'video' | 'audio' | 'pdf' | 'embed' | 'unknown'

/**
 * Detects the resource type from a URL.
 */
function getResourceType(url: string): ResourceType {
  const lower = url.toLowerCase()

  if (/\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(lower)) {
    return 'image'
  }
  if (/\.(mp4|webm|ogv)(\?.*)?$/i.test(lower)) {
    return 'video'
  }
  if (/\.(mp3|wav|ogg|m4a)(\?.*)?$/i.test(lower)) {
    return 'audio'
  }
  if (/\.pdf(\?.*)?$/i.test(lower)) {
    return 'pdf'
  }
  if (/youtube\.com\/watch|youtu\.be\/|vimeo\.com\/\d+/.test(lower)) {
    return 'embed'
  }

  return 'unknown'
}

/**
 * Converts video platform URLs to embeddable URLs.
 */
function toEmbedUrl(url: string): string {
  // YouTube watch URL
  const ytWatchMatch = url.match(/youtube\.com\/watch\?v=([^&]+)/)
  if (ytWatchMatch) {
    return `https://www.youtube.com/embed/${ytWatchMatch[1]}`
  }

  // YouTube short URL
  const ytShortMatch = url.match(/youtu\.be\/([^?]+)/)
  if (ytShortMatch) {
    return `https://www.youtube.com/embed/${ytShortMatch[1]}`
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`
  }

  return url
}

/**
 * Props for ResourceDisplay component.
 */
interface ResourceDisplayProps {
  url: string
}

/**
 * Renders a resource (image, video, audio, PDF, or embed) based on URL type.
 */
function ResourceDisplay({ url }: ResourceDisplayProps) {
  const type = getResourceType(url)

  return (
    <div className="resource-container">
      {type === 'image' && (
        <img src={url} alt="Resource preview" loading="lazy" />
      )}

      {type === 'video' && (
        <video controls preload="metadata">
          <source src={url} />
          Your browser does not support video playback.
        </video>
      )}

      {type === 'audio' && (
        <audio controls preload="metadata">
          <source src={url} />
          Your browser does not support audio playback.
        </audio>
      )}

      {type === 'pdf' && (
        <iframe
          src={url}
          title="PDF viewer"
          sandbox="allow-same-origin allow-scripts"
        />
      )}

      {type === 'embed' && (
        <iframe
          src={toEmbedUrl(url)}
          title="Video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      )}

      {type === 'unknown' && (
        <p style={{ padding: '1rem', textAlign: 'center' }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            View Resource
          </a>
        </p>
      )}
    </div>
  )
}

export default ResourceDisplay
