import { Provider } from '@/lib/providers/provider.types.js'
import { useState } from 'react'
import { Save, Eye, EyeOff, Check, AlertCircle, HelpCircle, Lock, Copy } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { DisconnectDialog } from '@/layouts/DisconnectDialog'
import { useApiSecretConnection } from '@/hooks/useApiSecretConnection'
import { copyToClipboard } from '@/utilities/oauth-helpers'

interface Props {
  provider: Provider
}

export function ConnectKeyAndSecretButton({ provider }: Props) {
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)

  const {
    connectionInfo,
    isConnected,
    isValidating,
    success,
    error,
    connect,
    disconnect,
    clearError,
    clearSuccess,
  } = useApiSecretConnection(provider)

  // Open modal with current credentials if available
  const openModal = () => {
    if (connectionInfo) {
      setClientId(connectionInfo.clientId)
      setClientSecret(connectionInfo.clientSecret)
    } else {
      setClientId('')
      setClientSecret('')
    }
    setShowSecret(false)
    clearError()
    clearSuccess()
    setIsModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setClientId('')
    setClientSecret('')
    setShowSecret(false)
    clearError()
    clearSuccess()
  }

  // Handle save credentials
  const handleSave = async () => {
    const connected = await connect(clientId, clientSecret)
    if (connected) {
      // Clear form fields on success
      setClientId('')
      setClientSecret('')

      // Close modal after delay
      setTimeout(() => {
        setIsModalOpen(false)
        setShowSecret(false)
      }, 1500)
    }
  }

  // Handle disconnect
  const handleDisconnect = () => {
    disconnect()
    setShowDisconnectDialog(false)
    window.location.reload()

    // Reload page after delay
    // setTimeout(() => {
    //   window.location.reload()
    // }, 1000)
  }

  // Copy to clipboard
  const handleCopy = (text: string) => {
    if (text) copyToClipboard(text)
  }

  return (
    <div className="w-full">
      {isConnected ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-gray-900">Connected to {provider.name}</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Client ID: {connectionInfo?.clientId.substring(0, 8)}... • Connected:{' '}
                  {new Date(connectionInfo?.connectedAt || '').toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={openModal}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium px-3 py-1 rounded border border-blue-200 hover:bg-blue-50 transition"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDisconnectDialog(true)}
                className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={openModal}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>Configure {provider.name}</span>
        </button>
      )}

      {/* Shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {isConnected ? 'Edit Connection' : 'Connect'} {provider.name}
            </DialogTitle>
            <DialogDescription>
              <button
                onClick={() => window.open('https://docs.example.com/oauth-setup', '_blank')}
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Need help? Open documentation
              </button>
            </DialogDescription>
          </DialogHeader>

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {isConnected ? 'Updated' : 'Connected'} Successfully!
              </h3>
              <p className="text-gray-600">{provider.name} OAuth2 credentials have been saved.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connection type */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  Connection Type
                </label>
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 border-2 border-blue-500 text-blue-700 rounded-lg font-medium w-fit">
                  <Lock className="w-4 h-4" />
                  <span>OAuth2 Credentials</span>
                </div>
              </div>

              {/* OAuth Redirect URL */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  OAuth Redirect URL (Callback URL)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={`${window.location.origin}/dashboard`}
                    readOnly
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-mono text-sm"
                  />
                  <button
                    onClick={() => handleCopy(`${window.location.origin}/dashboard`)}
                    className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 transition flex items-center"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Add this URL as an authorized redirect URI in your {provider.name} developer
                  console
                </p>
              </div>

              {/* Client ID */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Client ID *</label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Enter your Client ID"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
                  disabled={isValidating}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Found in your {provider.name} developer console or API settings
                </p>
              </div>

              {/* Client Secret */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">
                  Client Secret *
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? 'text' : 'password'}
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    placeholder="Enter your Client Secret"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm pr-12"
                    disabled={isValidating}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    disabled={isValidating}
                  >
                    {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Keep this secret! Never share it publicly. Store it securely.
                </p>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start">
                    <AlertCircle className="w-4 h-4 text-red-500 mr-2 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-red-700 mb-1">Error</p>
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                  disabled={isValidating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isValidating || !clientId.trim() || !clientSecret.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save Credentials'
                  )}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Shadcn AlertDialog for disconnect confirmation */}
      <DisconnectDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        providerName={provider.name}
        onConfirm={handleDisconnect}
      />
    </div>
  )
}
