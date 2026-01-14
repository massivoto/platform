import postgres from 'postgres'
import type { Sql } from 'postgres'
import {
  TokenResponse,
  ProviderKind,
  createTokenSecret,
  getIntegrationStatus,
} from '@massivoto/auth-domain'
import { TokenRepository, StoredToken, IntegrationSummary } from './token-repository.js'

// ============================================================================
// Database Row Type
// ============================================================================

interface DbRow {
  id: string
  user_id: string
  provider_id: string
  access_token: string
  refresh_token: string | null
  id_token: string | null
  expires_at: Date | null
  scopes: string[]
  last_used_at: Date | null
  created_at: Date
  updated_at: Date
  revoked: boolean
}

// ============================================================================
// Row to StoredToken Mapper
// ============================================================================

function rowToStoredToken(row: DbRow): StoredToken {
  return {
    id: row.id,
    userId: row.user_id,
    providerId: row.provider_id,
    integrationId: `${row.user_id}:${row.provider_id}`,
    kind: ProviderKind.OAUTH2_PKCE,
    accessToken: createTokenSecret(row.access_token),
    refreshToken: row.refresh_token ? createTokenSecret(row.refresh_token) : null,
    idToken: row.id_token ? createTokenSecret(row.id_token) : null,
    expiresAt: row.expires_at?.toISOString() ?? null,
    scopes: row.scopes,
    lastUsedAt: row.last_used_at?.toISOString() ?? null,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    revoked: row.revoked,
  }
}

// ============================================================================
// PostgreSQL Token Repository
// ============================================================================

export class PostgresTokenRepository implements TokenRepository {
  constructor(private sql: Sql) {}

  async saveToken(userId: string, providerId: string, token: TokenResponse): Promise<StoredToken> {
    const expiresAt = token.expires_in ? new Date(Date.now() + token.expires_in * 1000) : null
    const scopes = token.scope ? token.scope.split(' ') : []

    const [row] = await this.sql<DbRow[]>`
      INSERT INTO integration_tokens (
        user_id, provider_id, access_token, refresh_token, id_token, expires_at, scopes, revoked
      )
      VALUES (
        ${userId}, ${providerId}, ${token.access_token}, ${token.refresh_token ?? null},
        ${token.id_token ?? null}, ${expiresAt}, ${scopes}, false
      )
      ON CONFLICT (user_id, provider_id)
      DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = EXCLUDED.refresh_token,
        id_token = EXCLUDED.id_token,
        expires_at = EXCLUDED.expires_at,
        scopes = EXCLUDED.scopes,
        revoked = false,
        updated_at = NOW()
      RETURNING *
    `

    return rowToStoredToken(row)
  }

  async getToken(userId: string, providerId: string): Promise<StoredToken | null> {
    const [row] = await this.sql<DbRow[]>`
      SELECT * FROM integration_tokens
      WHERE user_id = ${userId} AND provider_id = ${providerId}
    `

    return row ? rowToStoredToken(row) : null
  }

  async listTokens(userId: string): Promise<IntegrationSummary[]> {
    const rows = await this.sql<DbRow[]>`
      SELECT * FROM integration_tokens
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return rows.map((row: DbRow) => {
      const token = rowToStoredToken(row)
      return {
        providerId: row.provider_id,
        status: getIntegrationStatus(token),
        connectedAt: row.created_at.toISOString(),
        expiresAt: row.expires_at?.toISOString() ?? null,
      }
    })
  }

  async deleteToken(userId: string, providerId: string): Promise<boolean> {
    const result = await this.sql`
      DELETE FROM integration_tokens
      WHERE user_id = ${userId} AND provider_id = ${providerId}
    `

    return result.count > 0
  }

  async updateStatus(userId: string, providerId: string, revoked: boolean): Promise<boolean> {
    const result = await this.sql`
      UPDATE integration_tokens
      SET revoked = ${revoked}, updated_at = NOW()
      WHERE user_id = ${userId} AND provider_id = ${providerId}
    `

    return result.count > 0
  }
}

// ============================================================================
// Database Connection Factory
// ============================================================================

export function createPostgresConnection(databaseUrl: string): Sql {
  return postgres(databaseUrl)
}

export async function runMigrations(sql: Sql): Promise<void> {
  // UUID for tokens (sensitive data)
  await sql`
    CREATE TABLE IF NOT EXISTS integration_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(255) NOT NULL,
      provider_id VARCHAR(100) NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      id_token TEXT,
      expires_at TIMESTAMPTZ,
      scopes TEXT[] DEFAULT '{}',
      last_used_at TIMESTAMPTZ,
      revoked BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (user_id, provider_id)
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_integration_tokens_user_id ON integration_tokens(user_id)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_integration_tokens_revoked ON integration_tokens(revoked)
  `
}
