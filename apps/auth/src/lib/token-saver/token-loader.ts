import { IntegrationStatus, IntegrationToken } from '../integration/integration.type.js'
import { getIntegrationStatus } from '../integration/token-status.js'
import { getSafeLocalStorage } from '../localstorage/safe-local-storage.js'
import { ProviderKind } from '../providers/provider.types.js'

type ProviderId = string

export interface TokenLoaders {
  loadTokens(): Map<ProviderId, TokenVisibleInformation>
  loadRawTokens(): Map<ProviderId, Partial<IntegrationToken>>
}

export class ConsoleTokenLoader implements TokenLoaders {
  constructor(public userId: string) {}

  loadTokens(): Map<ProviderId, TokenVisibleInformation> {
    // Implementation to load the token securely
    console.log(`Loading token for user ${this.userId}`)
    // Obviously it's empty, as we can't find any token in console
    return new Map<string, TokenVisibleInformation>()
  }

  loadRawTokens(): Map<ProviderId, Partial<IntegrationToken>> {
    console.log(`Loading raw tokens for user ${this.userId}`)
    return new Map<ProviderId, Partial<IntegrationToken>>()
  }
}

export class LocalStorageTokenLoader implements TokenLoaders {
  storageKey = ''

  constructor(public userId: string) {
    this.storageKey = `token_saver_${userId}`
    // create key if not exists
    if (!getSafeLocalStorage().getItem(this.storageKey)) {
      getSafeLocalStorage().setItem(this.storageKey, JSON.stringify({}))
    }
  }

  loadRawTokens(): Map<ProviderId, Partial<IntegrationToken>> {
    // Implementation to load the token from local storage
    const storageKey = this.storageKey
    const tokenData = getSafeLocalStorage().getItem(storageKey)
    const tokensMap = new Map<ProviderId, Partial<IntegrationToken>>()
    if (tokenData) {
      const tokens: Record<ProviderId, Partial<IntegrationToken>> = JSON.parse(tokenData)
      for (const [providerId, token] of Object.entries(tokens)) {
        tokensMap.set(providerId, token)
      }
    }
    return tokensMap
  }

  loadTokens(): Map<ProviderId, TokenVisibleInformation> {
    // Implementation to load the token from local storage
    const storageKey = this.storageKey
    const rawTokens = this.loadRawTokens()
    const tokensInfoMap = new Map<ProviderId, TokenVisibleInformation>()
    for (const [providerId, token] of rawTokens.entries()) {
      if (token) {
        const info: TokenVisibleInformation = {
          providerId,
          userId: this.userId,
          kind: token.kind as ProviderKind,
          visibleInformations: {
            accessToken: token.accessToken?.rawValue,
            apiKey: token.apiKey?.rawValue,
            secret: token.secret?.rawValue,
            expiresAt: token.expiresAt,
            scopes: token.scopes,
          },
          status: getIntegrationStatus(token as IntegrationToken),
        }
        tokensInfoMap.set(providerId, info)
      }
    }
    return tokensInfoMap
  }
}

interface TokenVisibleInformation {
  providerId: string
  userId: string
  kind: ProviderKind
  visibleInformations: any
  status: IntegrationStatus
}
