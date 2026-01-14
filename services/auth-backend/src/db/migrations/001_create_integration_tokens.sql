-- Migration: Create integration_tokens table
-- Created: 2026-01-13

-- Up migration
-- UUID for tokens (sensitive data - prevent enumeration attacks)
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

  -- One token per user/provider combination
  UNIQUE (user_id, provider_id)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_integration_tokens_user_id ON integration_tokens(user_id);

-- Index for filtering by revoked status
CREATE INDEX IF NOT EXISTS idx_integration_tokens_revoked ON integration_tokens(revoked);

-- Down migration (for reference)
-- DROP INDEX IF EXISTS idx_integration_tokens_revoked;
-- DROP INDEX IF EXISTS idx_integration_tokens_user_id;
-- DROP TABLE IF EXISTS integration_tokens;
