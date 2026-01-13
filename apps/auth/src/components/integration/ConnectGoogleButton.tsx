import { useState } from 'react'
import { Provider } from '@/lib/providers/provider.types.js'
import { useGoogleOAuth } from '@/hooks/useGoogleAuth'
import { DisconnectDialog } from '@/layouts/DisconnectDialog'

interface Props {
  provider: Provider
  userId: string
}

export function ConnectGoogleButton({ provider, userId }: Props) {
  const { user, error, loading, connect, disconnect } = useGoogleOAuth(provider, userId)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const handleDisconnect = () => {
    disconnect()
    setShowDisconnectDialog(false)
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm">Connecting...</p>
        </div>
      ) : user ? (
        <div className="bg-green-50 p-4 rounded-lg mb-4 flex items-center space-x-3">
          {user.picture && (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
          )}
          <div className="flex-1">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-gray-600">{user.email}</p>
          </div>

          <button
            onClick={() => setShowDisconnectDialog(true)}
            className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Disconnect
          </button>

          <DisconnectDialog
            open={showDisconnectDialog}
            onOpenChange={setShowDisconnectDialog}
            providerName={provider.name}
            description={`This will remove all OAuth credentials for ${provider.name}.`}
            actionLabel="Remove"
            onConfirm={handleDisconnect}
          />
        </div>
      ) : (
        <button
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
          onClick={connect}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Connect with {provider.name}</span>
        </button>
      )}
    </div>
  )
}
