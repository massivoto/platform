/**
 * Grid Item Card Component
 *
 * Single item in the grid with checkbox, resource, text, and metadata.
 *
 * Requirements:
 * - R-GRID-44: Render items in a responsive grid with checkbox for each item
 * - R-GRID-45: Display item text, resource, and metadata key/values
 */
import { Fragment } from 'react'
import ResourceDisplay from './ResourceDisplay'

/**
 * GridItem type (matches backend)
 */
interface GridItem {
  id: string
  text: string
  resource?: {
    url: string
    type?: 'image' | 'video' | 'audio'
  }
  metadata?: Record<string, string>
}

/**
 * Props for GridItemCard component.
 */
interface GridItemCardProps {
  item: GridItem
  selected: boolean
  onToggle: () => void
}

/**
 * Renders a single grid item with checkbox, resource, text, and metadata.
 */
function GridItemCard({ item, selected, onToggle }: GridItemCardProps) {
  return (
    <div
      className={`grid-item ${selected ? 'selected' : ''}`}
      onClick={onToggle}
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onToggle()
        }
      }}
    >
      <div className="checkbox-wrapper">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          tabIndex={-1}
        />
      </div>

      {item.resource && (
        <ResourceDisplay url={item.resource.url} type={item.resource.type} />
      )}

      <div className="item-text">{item.text}</div>

      {item.metadata && Object.keys(item.metadata).length > 0 && (
        <dl className="metadata">
          {Object.entries(item.metadata).map(([key, value]) => (
            <Fragment key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </Fragment>
          ))}
        </dl>
      )}
    </div>
  )
}

export default GridItemCard
