/**
 * resolveWorkspaceConfig — R-WORKSPACE-04, R-WORKSPACE-05.
 *
 * Pure function that resolves the workspace project configuration at
 * runner boot time:
 *
 *   1. Reads `<workspaceRoot>` from MASSIVOTO_WORKSPACE_ROOT or defaults
 *      to `<cwd>/workspace`.
 *   2. Reads `<project>` from the constructor option (highest priority)
 *      or from MASSIVOTO_PROJECT (fallback).
 *   3. If a project is set, validates that the resolved
 *      `<workspaceRoot>/<project>` directory:
 *        - stays inside `<workspaceRoot>` (no `../` escapes), and
 *        - exists and is a directory.
 *      Validation failures throw a WorkspaceConfigError.
 *
 * Returns `{ project, workspaceRoot, projectRoot }`. When no project is
 * configured, `project` and `projectRoot` are `undefined` — the caller
 * falls back to the legacy behaviour (cwd as projectRoot).
 */
import { statSync } from 'node:fs'
import path from 'node:path'

import { WorkspaceConfigError } from '../errors/workspace-config-error.js'

export interface ResolveWorkspaceConfigOptions {
  /** Highest-priority project name (typically from CLI flag `--project`). */
  project?: string
}

export interface WorkspaceConfig {
  /** Resolved project name, or undefined when nothing is configured. */
  project: string | undefined
  /** Absolute path to the workspace root (always defined). */
  workspaceRoot: string
  /** Absolute path to `<workspaceRoot>/<project>`, or undefined. */
  projectRoot: string | undefined
}

export function resolveWorkspaceConfig(
  options: ResolveWorkspaceConfigOptions,
): WorkspaceConfig {
  const workspaceRoot = resolveWorkspaceRoot()
  const project = pickProject(options.project, process.env.MASSIVOTO_PROJECT)

  if (project === undefined) {
    return { project: undefined, workspaceRoot, projectRoot: undefined }
  }

  const trimmed = project.trim()
  if (trimmed.length === 0) {
    throw new WorkspaceConfigError({
      value: project,
      resolvedPath: workspaceRoot,
      reason: 'project name is empty',
    })
  }

  const resolvedTarget = path.resolve(workspaceRoot, trimmed)

  // Path traversal check: the resolved target must stay inside workspaceRoot.
  // We compare against `<workspaceRoot><sep>` so that `<root>/foo/..` (which
  // resolves back to `<root>`) is also rejected — the project must be a
  // proper child.
  const rootWithSep = workspaceRoot.endsWith(path.sep)
    ? workspaceRoot
    : workspaceRoot + path.sep
  if (!resolvedTarget.startsWith(rootWithSep)) {
    throw new WorkspaceConfigError({
      value: project,
      resolvedPath: resolvedTarget,
      reason: 'resolved path is outside the workspace root',
    })
  }

  // Existence + directory check.
  let stat
  try {
    stat = statSync(resolvedTarget)
  } catch {
    throw new WorkspaceConfigError({
      value: project,
      resolvedPath: resolvedTarget,
      reason: 'workspace project directory not found',
    })
  }

  if (!stat.isDirectory()) {
    throw new WorkspaceConfigError({
      value: project,
      resolvedPath: resolvedTarget,
      reason: 'resolved path is not a directory',
    })
  }

  return { project: trimmed, workspaceRoot, projectRoot: resolvedTarget }
}

function resolveWorkspaceRoot(): string {
  const fromEnv = process.env.MASSIVOTO_WORKSPACE_ROOT
  if (fromEnv && fromEnv.length > 0) {
    return path.resolve(fromEnv)
  }
  return path.join(process.cwd(), 'workspace')
}

function pickProject(
  fromOption: string | undefined,
  fromEnv: string | undefined,
): string | undefined {
  if (fromOption !== undefined) return fromOption
  if (fromEnv !== undefined && fromEnv.length > 0) return fromEnv
  return undefined
}
