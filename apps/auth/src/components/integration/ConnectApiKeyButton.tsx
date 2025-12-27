import { Provider } from '@/lib/providers/provider.types.js'
import { useState } from 'react'
import { Key, Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react'

/**
 * ConnectApiKeyButton Component for API Key providers
 * Opens a modal to enter the API Key when clicked
 */
interface Props {
  provider: Provider
}

export function ConnectApiKeyButton({ provider }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Add state to track connection status
  const [isConnected, setIsConnected] = useState(
    localStorage.getItem(`${provider.name.toLowerCase().replace(/\s+/g, '_')}_api_key`) !== null,
  )

  // Storage key for this provider's API key
  const storageKey = `${provider.name.toLowerCase().replace(/\s+/g, '_')}_api_key`

  // Validate the API key
  const validateApiKey = async (key: string): Promise<boolean> => {
    setIsValidating(true)
    setError(null)

    try {
      // For Document Generator, just check if it's not empty
      if (provider.name === 'Document Generator') {
        return key.trim().length > 0
      }

      // Provider-specific validation logic (commented for now)
      /*
      switch (provider.name) {
        case 'OpenAI':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: { Authorization: `Bearer ${key}` }
          })
          return openaiResponse.ok
        case 'Anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-haiku-20240307', max_tokens: 10, messages: [{ role: 'user', content: 'Hello' }] }),
          })
          return anthropicResponse.status !== 401 && anthropicResponse.status !== 403
        case 'Google AI':
          const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`)
          return googleResponse.ok
        default:
          return key.trim().length > 0
      }
      */

      // Default validation
      return key.trim().length > 0
    } catch (err) {
      console.error('Validation error:', err)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  // Handle API key submission
  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('API Key is required')
      return
    }

    const isValid = await validateApiKey(apiKey.trim())

    if (isValid) {
      // Save to localStorage
      localStorage.setItem(storageKey, apiKey.trim())
      setSuccess(true)
      setError(null)
      setIsConnected(true) // Update connection state

      // Close modal after success
      setTimeout(() => {
        setIsModalOpen(false)
        setApiKey('')
        setShowApiKey(false)
        setSuccess(false)
      }, 1500)
    } else {
      setError('Invalid API Key. Please check and try again.')
    }
  }

  // Handle disconnect - FIXED VERSION
  const handleDisconnect = () => {
    localStorage.removeItem(storageKey)
    setApiKey('')
    setError(null)
    setSuccess(false)
    setIsConnected(false) // Update connection state

    // Force UI update
    // Option 1: Simple state update (should work with setIsConnected above)
    // Option 2: If still not working, use a small timeout
    setTimeout(() => {
      // This ensures React re-renders
      window.dispatchEvent(new Event('storage'))
    }, 100)
  }

  // Get masked API key for display
  const getMaskedKey = () => {
    const storedKey = localStorage.getItem(storageKey)
    if (!storedKey) return ''

    if (storedKey.length <= 8) {
      return '•'.repeat(storedKey.length)
    }

    const firstFour = storedKey.substring(0, 4)
    const lastFour = storedKey.substring(storedKey.length - 4)
    const middle = '•'.repeat(Math.min(8, storedKey.length - 8))

    return `${firstFour}${middle}${lastFour}`
  }

  // Listen for storage changes
  useState(() => {
    const handleStorageChange = () => {
      setIsConnected(localStorage.getItem(storageKey) !== null)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  })

  // Open modal
  const openModal = () => {
    setIsModalOpen(true)
    setApiKey('')
    setShowApiKey(false)
    setError(null)
    setSuccess(false)
  }

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false)
    setApiKey('')
    setShowApiKey(false)
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
                <h3 className="font-medium text-sm text-gray-900">Connected to {provider.name}</h3>
                <p className="text-xs text-gray-600 mt-1 flex items-center">
                  <Key className="w-3 h-3 mr-1" />
                  API Key: {getMaskedKey()}
                </p>
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
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          <Key className="w-5 h-5" />
          <span>Connect {provider.name} API Key</span>
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Key className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Connect {provider.name}</h2>
                    <p className="text-sm text-gray-600">Enter your API key to connect</p>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Connected Successfully!
                  </h3>
                  <p className="text-gray-600">{provider.name} is now connected to your account.</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                    <div className="relative">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder={`Enter your ${provider.name} API key`}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        disabled={isValidating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-gray-500 mt-2 flex items-start">
                      <AlertCircle className="w-3 h-3 mt-0.5 mr-1 flex-shrink-0" />
                      Your API key is stored securely in your browser's local storage
                    </p>
                  </div>

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {error}
                      </p>
                    </div>
                  )}

                  <div className="flex space-x-3">
                    <button
                      onClick={closeModal}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                      disabled={isValidating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSubmit}
                      disabled={isValidating || !apiKey.trim()}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isValidating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Validating...
                        </>
                      ) : (
                        'Connect'
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
