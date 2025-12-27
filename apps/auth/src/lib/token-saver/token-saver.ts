import { Integration, IntegrationToken } from '../integration/integration.type.js'
import { getSafeLocalStorage } from '../localstorage/safe-local-storage.js'
import { LocalStorageTokenLoader, TokenLoaders } from './token-loader.js'

export interface TokenSaver {
  saveToken(providerId: string, token: IntegrationToken): void
  revokeToken(providerId: string): void
}

export class ConsoleTokenSaver implements TokenSaver {
  saveToken(providerId: string, token: IntegrationToken): void {
    // Implementation to save the token securely
    console.log(`Saving token for provider ${providerId}: `, token)
    // This is a placeholder implementation
  }

  revokeToken(providerId: string): void {
    console.log(`Revoking token for provider ${providerId}`)
  }
}

export class LocalStorageTokenSaver implements TokenSaver {
  loader: TokenLoaders
  storageKey = ''

  constructor(public userId: string) {
    this.storageKey = `token_saver_${userId}`
    this.loader = new LocalStorageTokenLoader(userId)
  }

  saveToken(providerId: string, token: IntegrationToken): void {
    // Implementation to save the token in local storage
    const rawTokens = this.loader.loadRawTokens()
    rawTokens.set(providerId, token)
    const serializedTokens = Object.fromEntries(rawTokens)
    getSafeLocalStorage().setItem(this.storageKey, JSON.stringify(serializedTokens))
  }

  revokeToken(providerId: string): void {
    const storageKey = `token_${providerId}`
    // get the key and if exists, set status to revoked
    const tokenData = this.loader.loadRawTokens().get(providerId)
    if (tokenData) {
      tokenData.expiresAt = new Date().toISOString()
      tokenData.revoked = true
      // well, this is dirty for now...
      this.saveToken(providerId, tokenData as IntegrationToken)
    }
  }
}
