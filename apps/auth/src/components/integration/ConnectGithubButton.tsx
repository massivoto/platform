import { useState } from 'react'
import { useGitHubOAuth } from '@/hooks/useGithubAuth'
import { DisconnectDialog } from '@/layouts/DisconnectDialog'

interface Props {
  provider: { id: string; name: string }
  userId: string
}

export function ConnectGitHub({ provider, userId }: Props) {
  const { user, loading, connect, disconnect } = useGitHubOAuth(provider.id, userId)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const handleDisconnect = () => {
    disconnect()
    setShowDisconnectDialog(false)
  }

  return (
    <div>
      {user ? (
        <div className="flex items-center gap-3 bg-green-50 p-4 rounded-lg">
          {user.picture && (
            <img src={user.picture} alt={user.name} className="w-10 h-10 rounded-full" />
          )}
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>

          {/* Trigger button for disconnect */}
          <button
            onClick={() => setShowDisconnectDialog(true)}
            className="ml-auto bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
          >
            Disconnect
          </button>

          {/* Reusable Disconnect Dialog */}
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
