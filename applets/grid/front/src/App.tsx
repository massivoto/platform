/**
 * Grid Applet Main Component
 *
 * Requirements:
 * - R-GRID-42: Fetch input data from GET /api/input on mount
 * - R-GRID-43: Display title (or "Select Items" default) at top
 * - R-GRID-44: Render items in a responsive grid with checkbox for each item
 * - R-GRID-45: Display item text, resource, and metadata key/values
 * - R-GRID-46: Render Submit button that POSTs selected item IDs to /respond
 */
import { useEffect, useState } from 'react'
import GridItemCard from './GridItemCard'

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
 * Input data received from the server.
 */
interface Input {
  items: GridItem[]
  title?: string
}

/**
 * Main App component for the grid applet.
 * Fetches input, displays grid, and handles user selection.
 */
function App() {
  const [input, setInput] = useState<Input | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // R-GRID-42: Fetch input data on mount
  useEffect(() => {
    fetch('/api/input')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch input')
        return res.json()
      })
      .then(setInput)
      .catch((err) => setError(err.message))
  }, [])

  // Toggle item selection
  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // R-GRID-46: POST to /respond with selected IDs
  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await fetch('/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected: Array.from(selectedIds) }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit response')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (!input && !error) {
    return <div className="loading">Loading...</div>
  }

  // Error state
  if (error) {
    return (
      <div className="grid-container">
        <h1>Error</h1>
        <p className="error-message">{error}</p>
      </div>
    )
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="grid-container submitted">
        <h2>Selection Submitted</h2>
        <p>You can close this window.</p>
      </div>
    )
  }

  // Main UI
  return (
    <div className="grid-container">
      {/* R-GRID-43: Display title (or default) */}
      <h1>{input?.title || 'Select Items'}</h1>

      {/* R-GRID-44: Render items in a responsive grid */}
      <div className="grid">
        {input?.items.map((item) => (
          <GridItemCard
            key={item.id}
            item={item}
            selected={selectedIds.has(item.id)}
            onToggle={() => toggleItem(item.id)}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="actions">
        <span className="selection-count">
          {selectedIds.size} of {input?.items.length || 0} selected
        </span>
        <button
          className="btn-submit"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Submitting...' : 'Submit Selection'}
        </button>
      </div>
    </div>
  )
}

export default App
