import './index.css'
import './App.css'

import { Route, RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { appRouter } from './app-router.js'

const queryClient = new QueryClient()

// R-BUILD-04: Updated routing to use RootLayout with nested routes
const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <div className="min-h-screen bg-base-100 text-base-content">
        <Sonner position="top-center" duration={5000} richColors />
        <RouterProvider router={appRouter} />
      </div>
    </TooltipProvider>
  </QueryClientProvider>
)

export default App
