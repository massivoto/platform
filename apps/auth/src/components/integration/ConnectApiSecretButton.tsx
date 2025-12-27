import { Provider } from '@/lib/providers/provider.types.js'
import { useState } from 'react'
import { Save, Eye, EyeOff, X, Check, AlertCircle, HelpCircle, Lock, Key } from 'lucide-react'

interface Props {
  provider: Provider
}

// Backend URL
const BACKEND_URL = 'http://localhost:3000/api'

export function ConnectKeyAndSecretButton({ provider }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  // Storage key
  const storageKey = `${provider.id}_oauth_credentials`

  // Check if already connected
  const isConnected = localStorage.getItem(storageKey) !== null

  // Handle connection
  const handleSave = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Both Client ID and Client Secret are required')
      return
    }

    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch(`${BACKEND_URL}/auth/oauth-credentials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          providerName: provider.name,
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
          redirectUri: `${window.location.origin}/oauth/callback`,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save credentials')
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          providerId: provider.id,
          providerName: provider.name,
          connectedAt: new Date().toISOString(),
        }),
      )

      setSuccess(true)

      setTimeout(() => {
        setIsModalOpen(false)
        setClientId('')
        setClientSecret('')
        setShowSecret(false)
        setSuccess(false)
        window.location.reload()
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save credentials.')
    } finally {
      setIsValidating(false)
    }
  }

  // Handle disconnect
  const handleDisconnect = async () => {
    try {
      await fetch(`${BACKEND_URL}/auth/oauth-credentials`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provider.id }),
      })
    } catch (err) {
      console.error('Error disconnecting:', err)
    } finally {
      localStorage.removeItem(storageKey)
      window.location.reload()
    }
  }

  // Get connection info
  const getConnectionInfo = () => {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return ''

    try {
      const data = JSON.parse(stored)
      return `Connected to ${data.providerName}`
    } catch {
      return 'Connected'
    }
  }

  // Open docs
  const openDocs = () => {
    window.open('https://docs.example.com/oauth-setup', '_blank')
  }

  // Open modal
  const openModal = () => {
    setIsModalOpen(true)
    setClientId('')
    setClientSecret('')
    setShowSecret(false)
    setError(null)
    setSuccess(false)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setClientId('')
    setClientSecret('')
    setShowSecret(false)
    setError(null)
    setSuccess(false)
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
                <h3 className="font-medium text-sm text-gray-900">{getConnectionInfo()}</h3>
                <p className="text-xs text-gray-600 mt-1">OAuth2 credentials configured</p>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 text-sm font-medium px-3 py-1 rounded border border-red-200 hover:bg-red-50 transition"
            >
              Disconnect
            </button>
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

      {/* Modal - Simplified design */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl min-h-[80vh]">
            {/* Header with Save button on top-right */}
            <div className="flex items-center justify-between p-3 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Connection</h2>
                <div className="mt-1">
                  <button
                    onClick={openDocs}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                  >
                    <HelpCircle className="w-4 h-4 mr-1" />
                    Need help filling out these fields? Open docs.
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Save button */}
                <button
                  onClick={handleSave}
                  disabled={isValidating || !clientId.trim() || !clientSecret.trim()}
                  className="px-4 py-1 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isValidating ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>Save</>
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
                    Connected Successfully!
                  </h3>
                  <p className="text-gray-600">
                    {provider.name} OAuth2 is now configured and ready to use.
                  </p>
                </div>
              ) : (
                <>
                  {/* Connection type (simple label, no buttons) */}
                  <div className="">
                    <label className="block text-sm font-medium text-gray-900 mb-3">
                      Connect using *
                    </label>
                    <div className="flex items-center space-x-4">
                      <button className="flex items-center space-x-2 px-4 py-1 bg-blue-50 border-2 border-blue-500 text-blue-700 rounded-lg font-medium">
                        <Lock className="w-2 h-2" />
                        <span>OAuth2 (recommended)</span>
                      </button>
                      <button className="flex items-center space-x-2 px-4 py-1 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                        <Key className="w-4 h-4" />
                        <span>API Key</span>
                      </button>
                    </div>
                  </div>

                  {/* OAuth Redirect URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      OAuth Redirect URL
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={`${window.location.origin}/oauth/callback`}
                        readOnly
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700 font-mono text-sm"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      In {provider.name}, use the URL above when prompted to enter an OAuth callback
                      or redirect URL
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
                      disabled={isValidating}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Found in your {provider.name} developer console
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
                        disabled={isValidating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecret(!showSecret)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                      >
                        {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Keep this secret! Never share it publicly
                    </p>
                  </div>

                  {/* Security notice */}
                  {/* <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-4 h-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-blue-600">
                        Your credentials are encrypted and stored securely in the backend database.
                      </p>
                    </div>
                  </div> */}

                  {error && (
                    <div className="p-1 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start">
                        <AlertCircle className="w-2 h-2 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
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
