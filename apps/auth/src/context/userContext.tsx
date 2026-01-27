import { createContext, useContext, useState, ReactNode } from 'react'

export interface AppUser {
  name: string
  email: string
  picture?: string
}

interface UserContextType {
  user: AppUser | null
  setUser: (u: AppUser | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

/**
 * Get initial user from env variable or localStorage.
 * If VITE_USER_ID is set, use it as the default user (no login required).
 */
function getInitialUser(): AppUser | null {
  // First check env variable for local dev
  const envUserId = import.meta.env.VITE_USER_ID
  if (envUserId) {
    return {
      email: envUserId,
      name: envUserId.split('@')[0],
    }
  }

  // Fall back to localStorage (for OAuth flow)
  const stored = localStorage.getItem('google_user')
  return stored ? JSON.parse(stored) : null
}

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(getInitialUser)
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}
