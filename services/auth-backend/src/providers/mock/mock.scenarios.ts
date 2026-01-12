/**
 * Mock OAuth scenarios for testing
 */

export type MockScenario = 'success' | 'expired' | 'revoked' | 'denied' | 'error'

export const MOCK_SCENARIOS: readonly MockScenario[] = ['success', 'expired', 'revoked', 'denied', 'error'] as const

export function isValidScenario(value: unknown): value is MockScenario {
  return typeof value === 'string' && MOCK_SCENARIOS.includes(value as MockScenario)
}

export function parseScenario(value: unknown): MockScenario {
  if (isValidScenario(value)) {
    return value
  }
  return 'success'
}

/**
 * Mock user profiles for different providers
 */
export const MOCK_USERS = {
  github: {
    id: 'mock-github-user-123',
    login: 'mock-user',
    email: 'mock@example.com',
    name: 'Mock GitHub User',
    avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4',
  },
  google: {
    id: 'mock-google-user-456',
    email: 'mock@gmail.com',
    name: 'Mock Google User',
    picture: 'https://lh3.googleusercontent.com/a/default-user',
    verified_email: true,
  },
} as const

export type MockUserProfile = (typeof MOCK_USERS)[keyof typeof MOCK_USERS]

/**
 * Get mock user for a provider
 */
export function getMockUser(providerId: string): MockUserProfile {
  if (providerId in MOCK_USERS) {
    return MOCK_USERS[providerId as keyof typeof MOCK_USERS]
  }
  // Default to github-like profile
  return MOCK_USERS.github
}
