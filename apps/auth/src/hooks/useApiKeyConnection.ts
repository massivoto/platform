import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { ApiKeyStorage, useOAuthStorage } from '@/hooks/useOAuthStorage'
import { Provider } from '@/lib/providers/provider.types.js'

export function useApiKeyConnection(provider: Provider) {
  const [connectionInfo, setConnectionInfo] = useState<ApiKeyStorage | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const storageType = 'api-key'

  const { saveData, loadData, isConnected, removeData, maskApiKey } = useOAuthStorage()

  useEffect(() => {
    const data = loadData<ApiKeyStorage>(provider.id, storageType)
    setConnectionInfo(data)
  }, [provider.id, storageType])

  const isConnectedState = isConnected(provider.id, storageType)

  const validateApiKey = async (key: string): Promise<boolean> => {
    setIsValidating(true)
    setError(null)
    try {
      //  provider-specific validation
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

  const connect = async (apiKey: string) => {
    if (!apiKey.trim()) {
      setError('API Key is required')
      return false
    }

    const valid = await validateApiKey(apiKey)
    if (!valid) {
      setError('Invalid API Key')
      return false
    }

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
      description: `${provider.name} is now connected.`,
    })

    return true
  }

  const disconnect = () => {
    removeData(provider.id, storageType)
    setConnectionInfo(null)
    setSuccess(false)
    toast.success('Disconnected', {
      description: `${provider.name} has been disconnected.`,
    })
  }

  const updateConnectionInfo = (data: ApiKeyStorage | null) => {
    setConnectionInfo(data)
  }

  const clearError = () => setError(null)
  const clearSuccess = () => setSuccess(false)

  return {
    connectionInfo,
    isConnected: isConnectedState,
    isValidating,
    success,
    error,
    connect,
    disconnect,
    maskApiKey,
    updateConnectionInfo,
    clearError,
    clearSuccess,
    validateApiKey,
  }
}
