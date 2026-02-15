/**
 * Confirm Applet Main Component
 *
 * Requirements:
 * - R-CONFIRM-42: Fetch input data from GET /api/input on mount
 * - R-CONFIRM-43: Display title and message
 * - R-CONFIRM-44: Render Approve and Reject buttons
 * - R-CONFIRM-45: POST to /respond with approved value on click
 */
import { useEffect, useState } from 'react'
import ResourceDisplay from './ResourceDisplay.js'

/**
 * Input data received from the server.
 */
interface Input {
  message: string
  title?: string
  resourceUrl?: string
}

/**
 * Main App component for the confirm applet.
 * Fetches input, displays content, and handles user response.
 */
function App() {
  const [input, setInput] = useState<Input | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // R-CONFIRM-42: Fetch input data on mount
  useEffect(() => {
    fetch('/api/input')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch input')
        return res.json()
      })
      .then(setInput)
      .catch((err) => setError(err.message))
  }, [])

  // R-CONFIRM-45: POST to /respond
  const handleResponse = async (approved: boolean) => {
    setLoading(true)
    try {
      const res = await fetch('/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved }),
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
      <div className="confirm-container">
        <h1>Error</h1>
        <p className="message">{error}</p>
      </div>
    )
  }

  // Submitted state
  if (submitted) {
    return (
      <div className="confirm-container submitted">
        <h2>Response Submitted</h2>
        <p>You can close this window.</p>
      </div>
    )
  }

  // Main UI
  return (
    <div className="confirm-container">
      {/* R-CONFIRM-43: Display title (or default) and message */}
      <h1>{input?.title || 'Confirmation'}</h1>

      {/* Resource display (if provided) */}
      {input?.resourceUrl && <ResourceDisplay url={input.resourceUrl} />}

      <p className="message">{input?.message}</p>

      {/* R-CONFIRM-44: Approve and Reject buttons */}
      <div className="buttons">
        <button
          className="btn-reject"
          onClick={() => handleResponse(false)}
          disabled={loading}
        >
          Reject
        </button>
        <button
          className="btn-approve"
          onClick={() => handleResponse(true)}
          disabled={loading}
        >
          Approve
        </button>
      </div>
    </div>
  )
}

export default App
