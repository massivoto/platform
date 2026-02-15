import { Outlet } from 'react-router-dom'

import { Topbar } from '../components/Topbar.js'

// R-BUILD-04: RootLayout with semantic landmarks
export const RootLayout = () => {
  return (
    <div className="page-container">
      <Topbar />
      <main className="page-content" role="main">
        <Outlet />
      </main>
      <footer className="border-t bg-muted/50 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 Massivoto. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
