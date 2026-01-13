import { useEffect, useState } from 'react'
import { Client, Account, OAuthProvider } from 'appwrite'
import { toast } from 'sonner'
import { LocalStorageTokenSaver } from '@/lib/token-saver/token-saver'
import { IntegrationToken } from '@/lib/integration/integration.type'
import { ProviderKind } from '@/lib/providers/provider.types'
import { useOAuthStorage, OAuthTokenStorage, GitHubUser } from '@/hooks/useOAuthStorage'

const account = new Account(
  new Client()
    .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT!)
    .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID!),
)

async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const res = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
    },
  })
  if (!res.ok) throw new Error('GitHub API error')
  return res.json()
}

export function useGitHubOAuth(providerId: string, userId: string) {
  const [user, setUser] = useState<OAuthTokenStorage['userInfo'] | null>(null)
  const [loading, setLoading] = useState(false)

  const tokenSaver = new LocalStorageTokenSaver(userId)
  const { saveData, loadData, removeData } = useOAuthStorage()

  /* ---------- Hydration ---------- */
  useEffect(() => {
    const stored = loadData<OAuthTokenStorage>(providerId, 'oauth-token')
    if (stored?.userInfo) {
      setUser(stored.userInfo)
    }
  }, [providerId])

  /* ---------- OAuth session ---------- */
  useEffect(() => {
    hydrateFromAppwrite()
  }, [])

  const hydrateFromAppwrite = async () => {
    try {
      const session = await account.getSession('current')
      if (session.provider !== 'github') return
      if (!session.providerAccessToken) return

      setLoading(true)

      const now = new Date().toISOString()
      const expiresAt = new Date(Date.now() + 3600_000).toISOString()

      const integrationToken: IntegrationToken = {
        integrationId: providerId,
        kind: ProviderKind.OAUTH2_PKCE,
        accessToken: { rawValue: session.providerAccessToken },
        refreshToken: null,
        idToken: null,
        expiresAt,
        scopes: ['user', 'repo', 'read:org'],
        lastUsedAt: now,
        createdAt: now,
        updatedAt: now,
        revoked: false,
      }

      tokenSaver.saveToken(providerId, integrationToken)

      const githubUser = await fetchGitHubUser(session.providerAccessToken)

      const normalizedUser: OAuthTokenStorage['userInfo'] = {
        email: githubUser.email ?? '',
        name: githubUser.name ?? githubUser.login,
        picture: githubUser.avatar_url,
      }

      setUser(normalizedUser)

      saveData<OAuthTokenStorage>(providerId, 'oauth-token', {
        providerId,
        providerName: 'GitHub',
        expiresAt,
        connectedAt: now,
        userInfo: {
          email: githubUser.email ?? '',
          name: githubUser.name ?? githubUser.login,
          picture: githubUser.avatar_url,
        },
      })
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  /* ---------- Connect ---------- */
  const connect = async () => {
    setLoading(true)
    const origin = window.location.origin

    await account.createOAuth2Session(
      OAuthProvider.Github,
      `${origin}/dashboard`,
      `${origin}/?error=github`,
      ['user', 'repo', 'read:org'],
    )
  }

  /* ---------- Disconnect ---------- */
  const disconnect = async () => {
    try {
      await account.deleteSession('current')
    } catch {}

    tokenSaver.removeToken(providerId)
    removeData(providerId, 'oauth-token')
    setUser(null)

    toast.success('Disconnected from GitHub')
  }

  return {
    user,
    loading,
    connect,
    disconnect,
  }
}
