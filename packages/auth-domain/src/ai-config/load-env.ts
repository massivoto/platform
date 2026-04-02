import * as fs from 'node:fs'
import * as path from 'node:path'
import { config as dotenvConfig } from 'dotenv'

/**
 * R-AIC-61: Find the first .env file in the priority chain.
 * Walks up from projectDir to rootDir, checking each directory for .env.
 * Returns the path to the first .env found, or undefined if none exists.
 */
export function findEnvFile(projectDir: string, rootDir: string): string | undefined {
  const normalizedRoot = path.resolve(rootDir)
  let current = path.resolve(projectDir)

  while (true) {
    const envPath = path.join(current, '.env')
    if (fs.existsSync(envPath)) {
      return envPath
    }

    if (current === normalizedRoot) break

    const parent = path.dirname(current)
    if (parent === current) break // filesystem root
    current = parent
  }

  return undefined
}

/**
 * R-AIC-61: Load env vars from the first .env file found in the priority chain.
 * Returns the parsed key-value pairs (no merging across files).
 * Does NOT modify process.env.
 */
export function loadEnvChain(
  projectDir: string,
  rootDir: string,
): Record<string, string> {
  const envPath = findEnvFile(projectDir, rootDir)
  if (!envPath) return {}

  const result = dotenvConfig({ path: envPath, override: false })
  if (result.error) {
    throw result.error
  }

  return (result.parsed ?? {}) as Record<string, string>
}
