import { GoogleUser } from '@/components/Login'
import { createContext, useContext, useState, ReactNode } from 'react'

interface UserContextType {
  user: GoogleUser | null
  setUser: (u: GoogleUser | null) => void
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<GoogleUser | null>(() => {
    const stored = localStorage.getItem('google_user')
    return stored ? JSON.parse(stored) : null
  })
  return <UserContext.Provider value={{ user, setUser }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be inside UserProvider')
  return ctx
}
