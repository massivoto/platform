import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useApiKeyConnection } from '@/hooks/useApiKeyConnection'
import { DisconnectDialog } from '@/layouts/DisconnectDialog'
import { Provider } from '@/lib/providers/provider.types.js'
import { copyToClipboard } from '@/utilities/oauth-helpers'
import { AlertCircle, Check, Copy, Eye, EyeOff, Key, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  provider: Provider
}

export function ConnectApiKeyButton({ provider }: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)

  const {
    connectionInfo,
    isConnected,
    isValidating,
    error,
    connect,
    disconnect,
    maskApiKey,
    clearError,
  } = useApiKeyConnection(provider)

  useEffect(() => {
    if (isModalOpen && connectionInfo?.apiKey) {
      setApiKeyInput(connectionInfo.apiKey)
    }
  }, [isModalOpen, connectionInfo?.apiKey])

  const handleSubmit = async () => {
    const connected = await connect(apiKeyInput)
    if (connected) closeModal()
  }

  const handleDisconnect = () => {
    disconnect()
    setShowDisconnectDialog(false)
    setApiKeyInput('')
    window.location.reload()
  }

  const openModal = () => {
    setIsModalOpen(true)
    setShowApiKey(false)
    clearError()
    if (connectionInfo?.apiKey) setApiKeyInput(connectionInfo.apiKey)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setApiKeyInput('')
    setShowApiKey(false)
    clearError()
  }

  const handleCopyInputKey = () => {
    if (apiKeyInput) copyToClipboard(apiKeyInput)
  }

  const clearInput = () => {
    setApiKeyInput('')
    clearError()
  }

  return (
    <div className="w-full">
      {isConnected ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
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
      ) : (
        <button
          onClick={openModal}
          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          <Key className="w-5 h-5" />
          <span>Connect {provider.name} API Key</span>
        </button>
      )}

      {/* Connection Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Key className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <DialogTitle>
                  {isConnected ? 'Edit Connection' : 'Connect'} {provider.name}
                </DialogTitle>
                <DialogDescription>
                  {isConnected ? 'Update your API key connection' : 'Enter your API key to connect'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  name={`${provider.id}_api_key`}
                  id={`${provider.id}_api_key`}
                  autoComplete="new-password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={`Enter your ${provider.name} API key`}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  disabled={isValidating}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isValidating}
                >
                  {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-start">
                <AlertCircle className="w-3 h-3 mt-0.5 mr-1 shrink-0" />
                Your API key is stored securely in your browser's local storage
              </p>
            </div>

            {/* Quick Actions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyInputKey}
                  disabled={!apiKeyInput.trim()}
                  className="flex items-center justify-center px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Key
                </button>
                <button
                  onClick={clearInput}
                  disabled={!apiKeyInput.trim()}
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
              disabled={isValidating || !apiKeyInput.trim()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isValidating ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : isConnected ? (
                'Update'
              ) : (
                'Connect'
              )}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disconnect Confirmation Dialog */}
      <DisconnectDialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
        providerName={provider.name}
        onConfirm={handleDisconnect}
      />
    </div>
  )
}
