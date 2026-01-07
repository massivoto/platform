import { useEffect, useState } from 'react'
import { Client, Account, OAuthProvider } from 'appwrite'
import { toast } from 'sonner'
import { LocalStorageTokenSaver } from '@/lib/token-saver/token-saver'
import { IntegrationToken } from '@/lib/integration/integration.type'
import { ProviderKind } from '@/lib/providers/provider.types'
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog'

interface Props {
  provider: { id: string; name: string }
  userId: string
}

interface GitHubUser {
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

const account = new Account(
  new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!),
)

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })

  if (!res.ok) throw new Error('GitHub API error')
  return res.json()
}

export function ConnectGitHub({ provider, userId }: Props) {
  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSession()
  }, [])

  const loadSession = async () => {
    try {
      const session = await account.getSession('current')
      if (!session.providerAccessToken) return

      // Save token
      const integrationToken: IntegrationToken = {
        integrationId: 'github',
        kind: ProviderKind.OAUTH2_PKCE,
        accessToken: { rawValue: session.providerAccessToken },
        refreshToken: null,
        idToken: null,
        expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        scopes: ['user', 'repo', 'read:org'],
        lastUsedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        revoked: false,
      }

      const tokenSaver = new LocalStorageTokenSaver(userId)
      tokenSaver.saveToken('github', integrationToken)

      // Fetch GitHub user
      const githubUser = await fetchGitHubUser(session.providerAccessToken)
      setUser(githubUser)

      // Save user info in localStorage
      localStorage.setItem(
        'github_user',
        JSON.stringify({
          login: githubUser.login,
          name: githubUser.name,
          email: githubUser.email,
          avatar_url: githubUser.avatar_url,
          provider: 'GitHub',
        }),
      )
    } catch {
      /* no session */
    }
  }

  const connect = async () => {
    setLoading(true)
    const origin = window.location.origin
    await account.createOAuth2Session(
      OAuthProvider.Github,
      `${origin}/dashboard`,
      `${origin}/?error=github`,
      ['user', 'repo', 'read:org'],
    )
    setLoading(false)
  }

  const handleLogout = async () => {
    await account.deleteSession('current')
    setUser(null)

    const tokenSaver = new LocalStorageTokenSaver(userId)
    tokenSaver.removeToken('github')
    localStorage.removeItem('github_user')
    localStorage.removeItem('oauth_state_github')

    toast.success('logged out from GitHub')
  }

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
          <img src={user.avatar_url} alt={user.login} className="w-10 h-10 rounded-full" />
          <div className="flex-1">
            <p className="font-medium">{user.name ?? user.login}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {/* Confirmation dialog */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                Disconnect
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-white">
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to disconnect from {provider.name}?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Disconnect</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ) : (
        <button
          onClick={connect}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-2 rounded"
        >
          Connect with {provider.name}
        </button>
      )}
    </div>
  )
}
