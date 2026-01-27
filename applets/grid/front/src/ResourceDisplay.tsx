/**
 * Resource Display Component
 *
 * Auto-detects and renders different media types based on URL or explicit type.
 * Reused pattern from confirm applet.
 *
 * Requirements:
 * - R-GRID-45: Display item resource (using ResourceDisplay component)
 */

/**
 * Supported resource types.
 */
type ResourceType = 'image' | 'video' | 'audio' | 'unknown'

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

  return 'unknown'
}

/**
 * Props for ResourceDisplay component.
 */
interface ResourceDisplayProps {
  url: string
  /** Explicit type override (from GridItem.resource.type) */
  type?: 'image' | 'video' | 'audio'
}

/**
 * Renders a resource (image, video, audio) based on URL type or explicit type.
 */
function ResourceDisplay({ url, type: explicitType }: ResourceDisplayProps) {
  const type = explicitType ?? getResourceType(url)

  return (
    <div className="resource-container">
      {type === 'image' && (
        <img src={url} alt="Item preview" loading="lazy" />
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

      {type === 'unknown' && (
        <p style={{ padding: '0.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
          <a href={url} target="_blank" rel="noopener noreferrer">
            View Resource
          </a>
        </p>
      )}
    </div>
  )
}

export default ResourceDisplay
