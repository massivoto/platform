import { createBrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from './layouts/ErrorBoundary.js'
import { NotFound } from './layouts/NotFound.js'
import { RootLayout } from './layouts/RootLayout.js'
import { Dashboard } from './routes/dashboard/Dashboard.js'
import { Landing } from './routes/home/Landing.js'

import { ProviderConnectPage } from './routes/providers/ProviderConnectPage'
import { ProviderSettingsPage } from './routes/providers/ProviderSettingsPage'

// R-BUILD-03: Define the base application router map.
export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorBoundary />,
    children: [
      {
        index: true,
        element: <Landing />,
        handle: { title: 'Index', page: 'index' },
      },
      {
        path: '/dashboard',
        element: <Dashboard />,
        handle: { title: 'Dashboard', page: 'dashboard' },
      },
      {
        path: 'providers/:id/connect',
        element: <ProviderConnectPage />,
        handle: { title: 'Connect Provider', page: 'provider-connect' },
      },
      {
        path: 'providers/:id/settings',
        element: <ProviderSettingsPage />,
        handle: {
          title: (m: HasParams) => `Connecter le provider · ${m.params.id}`,
          page: 'provider-settings',
        },
      },
      {
        path: '*',
        element: <NotFound />,
        handle: { title: 'Not Found', page: 'not-found' },
      },
    ],
  },
])

interface HasParams {
  params: Record<string, any>
}
