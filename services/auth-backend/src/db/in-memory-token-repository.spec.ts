import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTokenRepository } from './in-memory-token-repository.js'
import { TokenResponse } from '@massivoto/auth-domain'

describe('InMemoryTokenRepository', () => {
  let repository: InMemoryTokenRepository

  beforeEach(() => {
    repository = new InMemoryTokenRepository()
  })

  const mockToken: TokenResponse = {
    access_token: 'test-access-token',
    token_type: 'Bearer',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    scope: 'email profile',
  }

  describe('saveToken', () => {
    it('should save a new token', async () => {
      const result = await repository.saveToken('user1', 'google', mockToken)

      expect(result.id).toBeDefined()
      expect(result.userId).toBe('user1')
      expect(result.providerId).toBe('google')
      expect(result.accessToken?.rawValue).toBe('test-access-token')
      expect(result.refreshToken?.rawValue).toBe('test-refresh-token')
      expect(result.scopes).toEqual(['email', 'profile'])
      expect(result.revoked).toBe(false)
    })

    it('should update existing token', async () => {
      const first = await repository.saveToken('user1', 'google', mockToken)

      const updatedToken: TokenResponse = {
        ...mockToken,
        access_token: 'new-access-token',
      }

      const result = await repository.saveToken('user1', 'google', updatedToken)

      expect(result.id).toBe(first.id) // same ID
      expect(result.accessToken?.rawValue).toBe('new-access-token')
      expect(repository.size()).toBe(1)
    })
  })

  describe('getToken', () => {
    it('should return null for non-existent token', async () => {
      const result = await repository.getToken('user1', 'google')
      expect(result).toBeNull()
    })

    it('should return saved token', async () => {
      await repository.saveToken('user1', 'google', mockToken)

      const result = await repository.getToken('user1', 'google')

      expect(result).not.toBeNull()
      expect(result?.accessToken?.rawValue).toBe('test-access-token')
    })
  })

  describe('listTokens', () => {
    it('should return empty array for user with no tokens', async () => {
      const result = await repository.listTokens('user1')
      expect(result).toEqual([])
    })

    it('should return all tokens for a user', async () => {
      await repository.saveToken('user1', 'google', mockToken)
      await repository.saveToken('user1', 'github', mockToken)
      await repository.saveToken('user2', 'google', mockToken)

      const result = await repository.listTokens('user1')

      expect(result).toHaveLength(2)
      expect(result.map((t) => t.providerId)).toContain('google')
      expect(result.map((t) => t.providerId)).toContain('github')
    })

    it('should return correct status for each token', async () => {
      await repository.saveToken('user1', 'google', mockToken)

      const result = await repository.listTokens('user1')

      expect(result[0].status).toBe('connected')
    })
  })

  describe('deleteToken', () => {
    it('should return false for non-existent token', async () => {
      const result = await repository.deleteToken('user1', 'google')
      expect(result).toBe(false)
    })

    it('should delete existing token', async () => {
      await repository.saveToken('user1', 'google', mockToken)

      const result = await repository.deleteToken('user1', 'google')

      expect(result).toBe(true)
      expect(await repository.getToken('user1', 'google')).toBeNull()
    })
  })

  describe('updateStatus', () => {
    it('should return false for non-existent token', async () => {
      const result = await repository.updateStatus('user1', 'google', true)
      expect(result).toBe(false)
    })

    it('should update token revoked status', async () => {
      await repository.saveToken('user1', 'google', mockToken)

      const result = await repository.updateStatus('user1', 'google', true)

      expect(result).toBe(true)

      const token = await repository.getToken('user1', 'google')
      expect(token?.revoked).toBe(true)
    })
  })
})
