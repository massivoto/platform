/**
 * ConnectGitHub - GitHub OAuth connection button using backend-mediated PKCE flow
 *
 * Uses the same useIntegrations hook as ConnectOAuthButton.
 * Backend handles token storage, frontend just shows connection status.
 */
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
import { useIntegrations } from '@/hooks/useIntegrations'
import { Provider } from '@/lib/providers/provider.types'
import { config } from '@/config'

interface Props {
  provider: Provider
  userId: string
}

export function ConnectGitHub({ provider, userId }: Props) {
  const {
    loading,
    error,
    isConnected,
    connect,
    disconnect,
  } = useIntegrations({
    backendUrl: config.backendUrl,
    userId,
  })

  const connected = isConnected(provider.id)

  const handleConnect = () => {
    connect(provider.id)
  }

  const handleDisconnect = async () => {
    await disconnect(provider.id)
  }

  return (
    <div className="mt-3">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm">Loading...</p>
        </div>
      ) : connected ? (
        <div className="bg-green-50 p-4 rounded-lg mb-4">
          <div className="flex items-center space-x-3">
            {provider.logo && (
              <img src={provider.logo} alt={provider.name} className="w-10 h-10 rounded-full" />
            )}
            <div className="flex-1">
              <p className="font-medium text-sm">{provider.name}</p>
              <p className="text-xs text-green-600 mt-1">Connected</p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm">
                  Disconnect
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white">
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Disconnect</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to disconnect from {provider.name}?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDisconnect}>
                    Disconnect
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      ) : (
        <button
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          onClick={handleConnect}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span>Connect with {provider.name}</span>
        </button>
      )}
    </div>
  )
}
