/**
 * WorkspaceConfigError - R-WORKSPACE-05
 *
 * Raised at runner boot when the resolved workspace project configuration
 * is invalid: missing directory, path traversal, or non-directory target.
 *
 * The message is user-oriented (no stack-trace fluff) so the CLI can print
 * it directly to the user without leaking internal details.
 */

export interface WorkspaceConfigErrorPayload {
  /** The original `_project` value the user provided (CLI flag or env var). */
  value: string
  /** The absolute path the runner resolved from `<workspaceRoot>/<value>`. */
  resolvedPath: string
  /** Why the configuration was rejected (e.g. "directory not found"). */
  reason: string
}

export class WorkspaceConfigError extends Error {
  readonly value: string
  readonly resolvedPath: string
  readonly reason: string

  constructor(payload: WorkspaceConfigErrorPayload) {
    super(
      `Invalid workspace project "${payload.value}": ${payload.reason} (resolved path: ${payload.resolvedPath})`,
    )
    this.name = 'WorkspaceConfigError'
    this.value = payload.value
    this.resolvedPath = payload.resolvedPath
    this.reason = payload.reason
  }
}
