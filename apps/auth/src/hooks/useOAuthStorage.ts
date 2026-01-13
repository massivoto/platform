// Types pour les différents types de stockage

export interface GitHubUser {
  login: string
  name: string | null
  email: string | null
  avatar_url: string
}

export interface OAuthCredentials {
  providerId: string
  providerName: string
  clientId: string
  clientSecret: string
  redirectUri: string
  connectedAt: string
  scopes?: string[]
}

export interface ApiKeyStorage {
  providerId: string
  providerName: string
  apiKey: string
  maskedKey: string
  connectedAt: string
}

export interface OAuthTokenStorage {
  providerId: string
  providerName: string
  expiresAt: string
  connectedAt: string
  userInfo?: {
    email: string
    name: string
    picture?: string
  }
}

type StorageType = 'oauth-credentials' | 'api-key' | 'oauth-token'

export function useOAuthStorage() {
  // Générer une clé de stockage standardisée
  const getStorageKey = (providerId: string, type: StorageType): string => {
    return `${providerId}_${type}`
  }

  // Sauvegarder des données
  const saveData = <T>(providerId: string, type: StorageType, data: T): void => {
    try {
      const key = getStorageKey(providerId, type)
      const dataWithTimestamp = {
        ...data,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem(key, JSON.stringify(dataWithTimestamp))
    } catch (error) {
      console.error(`Error saving ${type} for ${providerId}:`, error)
    }
  }

  // Charger des données
  const loadData = <T>(providerId: string, type: StorageType): T | null => {
    try {
      const key = getStorageKey(providerId, type)
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error(`Error loading ${type} for ${providerId}:`, error)
      return null
    }
  }

  // Vérifier si connecté
  const isConnected = (providerId: string, type: StorageType): boolean => {
    try {
      const key = getStorageKey(providerId, type)
      return localStorage.getItem(key) !== null
    } catch (error) {
      return false
    }
  }

  // Supprimer des données
  const removeData = (providerId: string, type: StorageType): void => {
    try {
      const key = getStorageKey(providerId, type)
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing ${type} for ${providerId}:`, error)
    }
  }

  // Obtenir toutes les connexions d'un type
  const getAllConnections = <T>(type: StorageType): T[] => {
    try {
      const connections: T[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.endsWith(`_${type}`)) {
          try {
            const data = JSON.parse(localStorage.getItem(key) || '')
            connections.push(data)
          } catch (e) {}
        }
      }
      return connections
    } catch (error) {
      console.error(`Error getting all ${type} connections:`, error)
      return []
    }
  }

  // Masquer une clé API
  const maskApiKey = (apiKey: string): string => {
    if (!apiKey) return ''

    if (apiKey.length <= 8) {
      return '•'.repeat(apiKey.length)
    }

    const firstFour = apiKey.substring(0, 4)
    const lastFour = apiKey.substring(apiKey.length - 4)
    const middleLength = Math.min(8, Math.max(0, apiKey.length - 8))
    const middle = '•'.repeat(middleLength)

    return `${firstFour}${middle}${lastFour}`
  }

  return {
    saveData,
    loadData,
    isConnected,
    removeData,
    getAllConnections,
    maskApiKey,
    getStorageKey,
  }
}
