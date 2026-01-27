import { Link, UIMatch, useMatches } from 'react-router-dom'
import { Box, LogOut } from 'lucide-react'
import '../styles/structure.scss'
import { useEffect, useMemo, useState } from 'react'
import Login, { GoogleUser } from './Login'
import { useUser } from '@/context/userContext'

type TitleHandle = { title?: string } | { title?: (match: UIMatch) => string }

interface TopbarProps {
  title?: string
}

function useRouteTitle(fallback = '') {
  const matches = useMatches() as Array<UIMatch<unknown, TitleHandle>>

  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    if (!match) continue

    const handle = match.handle
    if (!handle || !handle.title) continue

    return typeof handle.title === 'function' ? handle.title(match) : handle.title
  }

  return fallback
}

export const Topbar = ({ title = '' }: TopbarProps) => {
  const routeTitle = useRouteTitle(title)
  const { user, setUser } = useUser()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  useEffect(() => {
    if (routeTitle) document.title = `${routeTitle} · Massivoto`
  }, [routeTitle])

  const shownTitle = useMemo(() => routeTitle || title || '', [routeTitle, title])

  const handleLogin = (user: GoogleUser) => {
    setUser(user)
    localStorage.setItem('google_user', JSON.stringify(user))
    setShowLoginModal(false)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('google_user')
    setShowDropdown(false)
  }

  return (
    <>
      <nav className="fixed top-4 left-4 right-4 z-50">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/90 backdrop-blur-md border border-gray-200 rounded-full shadow-sm">
            <div className="flex items-center justify-between h-16 px-6">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-semibold text-gray-900 hover:text-gray-700 transition-colors"
              >
                <Box className="w-6 h-6" />
                <span>Massivoto</span>
              </Link>

              {/* Page Title - Centered */}
              {shownTitle && (
                <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
                  <h1 className="text-lg font-medium text-gray-700">{shownTitle}</h1>
                </div>
              )}

              {/* User / Login */}
              <div className="flex items-center">
                {!user ? (
                  <button
                    onClick={() => setShowLoginModal(true)}
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors"
                  >
                    Log In
                  </button>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          className="w-9 h-9 rounded-full border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full border-2 border-gray-200 bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </button>

                    {showDropdown && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowDropdown(false)}
                        />

                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                          <div className="px-4 py-3 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
                          </div>
                          <button
                            onClick={logout}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowLoginModal(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Log In to Massivoto</h2>
              <div className="flex justify-center">
                <Login onLogin={handleLogin} />
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}
