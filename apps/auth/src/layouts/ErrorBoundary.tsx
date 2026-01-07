import { isRouteErrorResponse, useRouteError } from 'react-router-dom'

// R-BUILD-03: Minimal error boundary for router configuration smoke tests.
export const ErrorBoundary = () => {
  const error = useRouteError()

  if (isRouteErrorResponse(error)) {
    return (
      <section>
        <h2>Something went wrong</h2>
        <p>
          {error.status} {error.statusText}
        </p>
      </section>
    )
  }

  return (
    <section>
      <h2>Unexpected error</h2>
      <pre>{error instanceof Error ? error.message : String(error)}</pre>
    </section>
  )
}
