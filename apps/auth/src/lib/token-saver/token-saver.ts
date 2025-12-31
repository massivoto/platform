import { IntegrationToken } from '../integration/integration.type.js'
import { getSafeLocalStorage } from '../localstorage/safe-local-storage.js'
import { LocalStorageTokenLoader, TokenLoaders } from './token-loader.js'

export interface TokenSaver {
  saveToken(providerId: string, token: IntegrationToken): void

  // Local only: marks token as revoked/expired
  markTokenAsRevoked(providerId: string): void

  //  Hard delete from storage
  removeToken(providerId: string): void
}

/* Console implementation (dev/debug) */

export class ConsoleTokenSaver implements TokenSaver {
  saveToken(providerId: string, token: IntegrationToken): void {
    console.log(`Saving token for provider ${providerId}:`, token)
  }

  markTokenAsRevoked(providerId: string): void {
    console.log(`Marking token as revoked for provider ${providerId}`)
  }

  removeToken(providerId: string): void {
    console.log(`Removing token for provider ${providerId}`)
  }
}

/* LocalStorage implementation */

export class LocalStorageTokenSaver implements TokenSaver {
  loader: TokenLoaders
  storageKey: string

  constructor(public userId: string) {
    this.storageKey = `token_saver_${userId}`
    this.loader = new LocalStorageTokenLoader(userId)
  }

  saveToken(providerId: string, token: IntegrationToken): void {
    const rawTokens = this.loader.loadRawTokens()

    rawTokens.set(providerId, {
      ...token,
      updatedAt: new Date().toISOString(),
    })

    getSafeLocalStorage().setItem(this.storageKey, JSON.stringify(Object.fromEntries(rawTokens)))
  }

  markTokenAsRevoked(providerId: string): void {
    const rawTokens = this.loader.loadRawTokens()
    const token = rawTokens.get(providerId)

    if (!token) return

    rawTokens.set(providerId, {
      ...token,
      revoked: true,
      expiresAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })

    getSafeLocalStorage().setItem(this.storageKey, JSON.stringify(Object.fromEntries(rawTokens)))
  }

  removeToken(providerId: string): void {
    const rawTokens = this.loader.loadRawTokens()
    rawTokens.delete(providerId)

    getSafeLocalStorage().setItem(this.storageKey, JSON.stringify(Object.fromEntries(rawTokens)))
  }
}

export async function revokeGoogleToken(accessToken: string): Promise<void> {
  const res = await fetch('https://oauth2.googleapis.com/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ token: accessToken }),
  })

  if (!res.ok) {
    throw new Error('Failed to revoke Google token')
  }
}
