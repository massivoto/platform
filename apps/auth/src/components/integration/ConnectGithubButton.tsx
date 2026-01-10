import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { LocalStorageTokenSaver } from '@/lib/token-saver/token-saver'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

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
  const saver = useRef<LocalStorageTokenSaver>(new LocalStorageTokenSaver(userId)).current
  const loader = saver.loader
  const sonnerToast = useRef(toast).current

  const [user, setUser] = useState<GitHubUser | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    hydrateFromLocal()
    // hydrateFromSession()
  }, [])

  /*UI first: si déjà connecté, afficher Connected */
  const hydrateFromLocal = () => {
    const githubToken = loader.loadRawTokens().get('github')

    if (githubToken && githubToken.accessToken) {
      fetchGitHubUser(githubToken.accessToken.rawValue)
        .then((githubUser) => {
          console.log('Fetched GitHub user from local token:', githubUser)
          setUser(githubUser)
        })
        .catch(() => {
          console.log(
            'Failed to fetch GitHub user with stored token, removing local connection status.',
          )
          toast.error('GitHub token expired or invalid, please reconnect.')
        })
    }
    const connected = localStorage.getItem('github_connected') === 'true'
    if (connected) {
      setUser({ login: 'connected' } as GitHubUser)
    }
  }

  const connect = async () => {
    setLoading(true)
    const origin = window.location.origin
  }

  const handleRevoke = async () => {
    // TODO AI: Need to  revoke token via GitHub API if possible

    // Then delere local data
    saver.markTokenAsRevoked('github')
    setUser(null)

    toast.success('Authorization revoked from GitHub')
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
                <AlertDialogAction onClick={handleRevoke}>Disconnect</AlertDialogAction>
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
