import { Provider } from '@/lib/providers/provider.types.js'
import { useState, useEffect } from 'react'
import { Key, Eye, EyeOff, Check, X, AlertCircle, Copy } from 'lucide-react'
import { useOAuthStorage, ApiKeyStorage } from '@/hooks/useOAuthStorage'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Props {
  provider: Provider
}

export function ConnectApiKeyButton({ provider }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState<ApiKeyStorage | null>(null)

  const { saveData, loadData, isConnected, removeData, maskApiKey } = useOAuthStorage()
  const storageType = 'api-key'

  // Load stored API key on mount
  useEffect(() => {
    loadStoredApiKey()
  }, [])

  const loadStoredApiKey = () => {
    const data = loadData<ApiKeyStorage>(provider.id, storageType)
    setConnectionInfo(data)
    return data
  }

  // Check if already connected
  const isConnectedState = isConnected(provider.id, storageType)

  const validateApiKey = async (key: string): Promise<boolean> => {
    setIsValidating(true)
    setError(null)

    try {
      // validation logic here
      if (provider.name === 'Document Generator') {
        return key.trim().length > 0
      }
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
      const storageData: ApiKeyStorage = {
        providerId: provider.id,
        providerName: provider.name,
        apiKey: apiKey.trim(),
        maskedKey: maskApiKey(apiKey.trim()),
        connectedAt: new Date().toISOString(),
      }

      saveData(provider.id, storageType, storageData)
      setConnectionInfo(storageData)
      setSuccess(true)
      setError(null)

      toast.success('Connected successfully!', {
        description: `${provider.name} is now connected to your account.`,
      })

      setTimeout(() => {
        setIsModalOpen(false)
        setApiKey('')
        setShowApiKey(false)
        setSuccess(false)
      }, 1500)
    } else {
      setError('Invalid API Key. Please check and try again.')
      toast.error('Invalid API Key', {
        description: 'Please check your API key and try again.',
      })
    }
  }

  // Handle disconnect
  const handleDisconnect = () => {
    removeData(provider.id, storageType)
    setConnectionInfo(null)
    setApiKey('')
    setError(null)
    setSuccess(false)
    setShowDisconnectDialog(false)

    toast.success('Disconnected', {
      description: `${provider.name} has been disconnected.`,
    })
  }

  // Open modal
  const openModal = () => {
    const data = loadData<ApiKeyStorage>(provider.id, storageType)
    if (data) {
      setApiKey(data.apiKey)
    }
    setIsModalOpen(true)
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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('Copied to clipboard', {
          description: 'API key has been copied to your clipboard.',
        })
      })
      .catch((err) => {
        console.error('Failed to copy:', err)
        toast.error('Failed to copy', {
          description: 'Could not copy to clipboard.',
        })
      })
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
                <p className="text-xs text-gray-600 mt-1 flex items-center">
                  <Key className="w-3 h-3 mr-1" />
                  API Key: {connectionInfo?.maskedKey || maskApiKey(connectionInfo?.apiKey || '')}
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
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          <Key className="w-5 h-5" />
          <span>Connect {provider.name} API Key</span>
        </button>
      )}

      {/* Shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>Connect {provider.name}</DialogTitle>
                <DialogDescription>Enter your API key to connect</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {success ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Connected Successfully!</h3>
              <p className="text-gray-600">{provider.name} is now connected to your account.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      name={`${provider.id}_api_key`}
                      id={`${provider.id}_api_key`}
                      autoComplete="new-password"
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

                  <p className="text-xs text-gray-500 mt-2 flex items-start">
                    <AlertCircle className="w-3 h-3 mt-0.5 mr-1 shrink-0" />
                    Your API key is stored securely in your browser's local storage
                  </p>
                </div>

                {/* Quick actions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quick Actions
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => copyToClipboard(apiKey)}
                      disabled={!apiKey.trim()}
                      className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy Key
                    </button>
                    <button
                      onClick={() => setApiKey('')}
                      disabled={!apiKey.trim()}
                      className="flex items-center justify-center px-3 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {error}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 mt-6">
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
        </DialogContent>
      </Dialog>

      {/* Shadcn AlertDialog for disconnect confirmation */}
      <AlertDialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect {provider.name} from your account. You can always reconnect
              later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisconnect} className="bg-red-600 hover:bg-red-700">
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
