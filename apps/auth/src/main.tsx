import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { UserProvider } from './context/userContext.tsx'

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Wrap with GoogleOAuthProvider only if client ID is configured
const AppWithProviders = () => (
  <UserProvider>
    <App />
  </UserProvider>
)

createRoot(document.getElementById('root')!).render(
  googleClientId ? (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AppWithProviders />
    </GoogleOAuthProvider>
  ) : (
    <AppWithProviders />
  ),
)
