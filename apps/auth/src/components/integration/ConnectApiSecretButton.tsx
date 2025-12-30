import { Provider } from '@/lib/providers/provider.types.js'
import { useState, useEffect } from 'react'
import { Save, Eye, EyeOff, X, Check, AlertCircle, HelpCircle, Lock, Key, Copy } from 'lucide-react'
import { OAuthCredentials, useOAuthStorage } from '@/hooks/useOAuthStorage'

interface Props {
  provider: Provider
}

export function ConnectKeyAndSecretButton({ provider }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState<OAuthCredentials | null>(null)

  const { saveData, loadData, isConnected, removeData } = useOAuthStorage()
  const storageType = 'oauth-credentials'

  // Load stored credentials on mount
  useEffect(() => {
    loadCredentials()
  }, [])

  const loadCredentials = () => {
    const data = loadData<OAuthCredentials>(provider.id, storageType)
    setConnectionInfo(data)
    return data
  }

  // Check if already connected
  const isConnectedState = isConnected(provider.id, storageType)

  // Handle save credentials
  const handleSave = async () => {
    if (!clientId.trim()) {
      setError('Client ID is required')
      return
    }

    if (!clientSecret.trim()) {
      setError('Client Secret is required')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await new Promise((resolve) => setTimeout(resolve, 500))

      const credentials: OAuthCredentials = {
        providerId: provider.id,
        providerName: provider.name,
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        redirectUri: `${window.location.origin}/oauth/callback`,
        connectedAt: new Date().toISOString(),
      }

      // Use centralized storage
      saveData(provider.id, storageType, credentials)
      setConnectionInfo(credentials)
      setSuccess(true)

      setTimeout(() => {
        setIsModalOpen(false)
        setClientId('')
        setClientSecret('')
        setShowSecret(false)
        setSuccess(false)
        setIsSaving(false)
      }, 1500)
    } catch (err) {
      setError('Failed to save credentials. Please try again.')
      setIsSaving(false)
    }
  }

  // Handle disconnect
  const handleDisconnect = () => {
    if (window.confirm(`Are you sure you want to disconnect ${provider.name}?`)) {
      removeData(provider.id, storageType)
      setConnectionInfo(null)
      window.location.reload()
    }
  }

  // Open modal with current credentials if available
  const openModal = () => {
    const data = loadData<OAuthCredentials>(provider.id, storageType)
    if (data) {
      setClientId(data.clientId)
      setClientSecret(data.clientSecret)
    } else {
      setClientId('')
      setClientSecret('')
    }
    setShowSecret(false)
    setError(null)
    setSuccess(false)
    setIsModalOpen(true)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setClientId('')
    setClientSecret('')
    setShowSecret(false)
    setError(null)
    setSuccess(false)
    setIsSaving(false)
  }

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        // You could add a toast notification here
        console.log('Copied to clipboard')
      })
      .catch((err) => console.error('Failed to copy:', err))
  }

  return (
    <div className="w-full">
      {isConnectedState ? (
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
                onClick={handleDisconnect}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl min-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isConnectedState ? 'Edit Connection' : 'Connect'} {provider.name}
                </h2>
                <div className="mt-1">
                  <button
                    onClick={() => window.open('https://docs.example.com/oauth-setup', '_blank')}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Need help? Open documentation
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={isSaving || !clientId.trim() || !clientSecret.trim()}
                  className="px-4 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>

                {/* Close button */}
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isConnectedState ? 'Updated' : 'Connected'} Successfully!
                  </h3>
                  <p className="text-gray-600">
                    {provider.name} OAuth2 credentials have been saved.
                  </p>
                </div>
              ) : (
                <>
                  {/* Connection type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Connection Type
                    </label>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 px-4 py-1 bg-blue-50 border-2 border-blue-500 text-blue-700 rounded-lg font-medium">
                        <Lock className="w-4 h-4" />
                        <span>OAuth2 Credentials</span>
                      </div>
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
                        onClick={() => copyToClipboard(`${window.location.origin}/oauth/callback`)}
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
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Client ID *
                    </label>
                    <input
                      type="text"
                      value={clientId}
                      onChange={(e) => setClientId(e.target.value)}
                      placeholder="Enter your Client ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm"
                      disabled={isSaving}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Found in your {provider.name} developer console or API settings
                    </p>
                  </div>

                  {/* Client Secret */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-1">
                      Client Secret *
                    </label>
                    <div className="relative">
                      <input
                        type={showSecret ? 'text' : 'password'}
                        value={clientSecret}
                        onChange={(e) => setClientSecret(e.target.value)}
                        placeholder="Enter your Client Secret"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition font-mono text-sm pr-12"
                        disabled={isSaving}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        disabled={isSaving}
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
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
