import { IntegrationStatus, IntegrationToken } from './integration.type.js'

export function getIntegrationStatus(token: IntegrationToken): IntegrationStatus {
  if (token.revoked) {
    return 'revoked'
  }

  if (token.expiresAt) {
    const now = new Date()
    const expiresAt = new Date(token.expiresAt)
    if (expiresAt < now) {
      return 'needs_reauth'
    }
  }
  return 'connected'
}
