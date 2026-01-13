import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { OAuthCredentials, useOAuthStorage } from '@/hooks/useOAuthStorage'
import { Provider } from '@/lib/providers/provider.types'

export function useApiSecretConnection(provider: Provider) {
  const [connectionInfo, setConnectionInfo] = useState<OAuthCredentials | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const storageType = 'oauth-credentials'

  const { saveData, loadData, isConnected, removeData } = useOAuthStorage()

  useEffect(() => {
    const data = loadData<OAuthCredentials>(provider.id, storageType)
    setConnectionInfo(data)
  }, [provider.id])

  const isConnectedState = isConnected(provider.id, storageType)

  const validateCredentials = async (clientId: string, clientSecret: string): Promise<boolean> => {
    setIsValidating(true)
    setError(null)
    try {
      // provider-specific validation logic here
      if (provider.name === 'Document Generator') {
        return clientId.trim().length > 0 && clientSecret.trim().length > 0
      }
      return clientId.trim().length > 0 && clientSecret.trim().length > 0
    } catch (err) {
      console.error('Validation error:', err)
      return false
    } finally {
      setIsValidating(false)
    }
  }

  const connect = async (clientId: string, clientSecret: string) => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Client ID and Client Secret are required')
      return false
    }

    const valid = await validateCredentials(clientId, clientSecret)
    if (!valid) {
      setError('Invalid Client ID or Client Secret')
      return false
    }

    const storageData: OAuthCredentials = {
      providerId: provider.id,
      providerName: provider.name,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      redirectUri: `${window.location.origin}/oauth/callback`,
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

  const updateConnectionInfo = (data: OAuthCredentials | null) => {
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
    updateConnectionInfo,
    clearError,
    clearSuccess,
    validateCredentials,
  }
}
