// Login.tsx
import { GoogleLogin } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'

export interface GoogleUser {
  name: string
  email: string
  picture: string
}

interface LoginProps {
  onLogin: (user: GoogleUser) => void
}

export default function Login({ onLogin }: LoginProps) {
  return (
    <GoogleLogin
      onSuccess={(res) => {
        const user = jwtDecode<GoogleUser>(res.credential!)
        onLogin(user)
      }}
      onError={() => console.log('Login failed')}
    />
  )
}
