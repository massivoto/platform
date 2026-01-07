export interface User {
  id: string
  email: string
  name: string
  picture?: string
  [key: string]: any
}

export interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
}

export interface AuthContextType {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  getToken: () => Promise<string | null>
}

export interface OAuthConfig {
  clientId: string
  authEndpoint: string
  tokenEndpoint: string
  redirectUri: string
  scope: string
  responseType: string
}

export interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: string[]
}
