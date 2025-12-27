import { Link, UIMatch, useMatches } from 'react-router-dom'
import { Box, User } from 'lucide-react'
import '../styles/structure.scss'
import { useEffect, useMemo, useState } from 'react'
import Login, { GoogleUser } from './Login'

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

  const [user, setUser] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem('google_user')
    return stored ? JSON.parse(stored) : null
  })

  useEffect(() => {
    if (routeTitle) document.title = `${routeTitle} · Massivoto`
  }, [routeTitle])

  const shownTitle = useMemo(() => routeTitle || title || '', [routeTitle, title])

  const handleLogin = (u: GoogleUser) => {
    setUser(u)
    localStorage.setItem('google_user', JSON.stringify(u))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('google_user')
  }

  return (
    <header className="topbar" role="navigation">
      <div className="topbar-inner bg-primary/90 text-base-100 flex items-center justify-between">
        <Link to="/" className="topbar-logo flex items-center gap-2">
          <Box size={24} />
          <span>Massivoto</span>
        </Link>

        {shownTitle && <div className="topbar-title">{shownTitle}</div>}

        <div className="topbar-user dropdown dropdown-end">
          <ul
            tabIndex={0}
            className="dropdown-content menu p-2 shadow bg-secondary text-base-100 rounded-box w-56 mt-2"
          >
            {!user ? (
              <li>
                <Login onLogin={handleLogin} />
              </li>
            ) : (
              <>
                <li>
                  {' '}
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-8 h-8 rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </li>
                <li className="px-2 py-1 font-medium">{user.name}</li>
                <li className="px-2 py-1 text-xs opacity-80">{user.email}</li>
                <li>
                  <button onClick={logout}>Logout</button>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </header>
  )
}
