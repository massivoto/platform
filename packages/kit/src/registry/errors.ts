/**
 * Registry error classes.
 * Designed to be LLM-readable with clear messages and actionable suggestions.
 */

/**
 * Conflict information for a single key.
 */
export interface RegistryConflict {
  /** The conflicting key */
  key: string

  /** IDs of sources that both provide this key */
  sourceIds: string[]
}

/**
 * Thrown when multiple sources provide the same key.
 *
 * This indicates a configuration error: each key must be unique across all sources.
 * To resolve, either:
 * - Use different keys (namespaced) in each source
 * - Remove duplicate registrations from one source
 */
export class RegistryConflictError extends Error {
  readonly conflicts: RegistryConflict[]

  constructor(conflicts: RegistryConflict[]) {
    const message = RegistryConflictError.buildMessage(conflicts)
    super(message)
    this.name = 'RegistryConflictError'
    this.conflicts = conflicts
  }

  private static buildMessage(conflicts: RegistryConflict[]): string {
    const lines = [
      'Registry conflict detected: the same key exists in multiple sources.',
      '',
      'Conflicts:',
    ]

    for (const { key, sourceIds } of conflicts) {
      lines.push(`  - "${key}" provided by: ${sourceIds.join(', ')}`)
    }

    lines.push('')
    lines.push('To fix this error:')
    lines.push('  1. Use namespaced keys to avoid collisions (e.g., "@acme/myCommand" instead of "@utils/myCommand")')
    lines.push('  2. Or remove the duplicate registration from one of the sources')

    return lines.join('\n')
  }
}

/**
 * Thrown when registry methods are called before reload().
 *
 * The registry must be explicitly loaded before use.
 * Call reload() once at startup before calling get(), has(), keys(), or entries().
 */
export class RegistryNotLoadedError extends Error {
  constructor() {
    const message = [
      'Registry not loaded: reload() must be called before accessing the registry.',
      '',
      'The registry requires explicit initialization:',
      '  const registry = new BaseComposableRegistry()',
      '  registry.addSource(mySource)',
      '  await registry.reload()  // <-- Required before any lookups',
      '  await registry.get("@utils/log")  // Now this works',
      '',
      'This design ensures predictable behavior and easier testing.',
    ].join('\n')

    super(message)
    this.name = 'RegistryNotLoadedError'
  }
}

/**
 * Thrown when a module source fails to load.
 */
export class ModuleLoadError extends Error {
  readonly modulePath: string
  readonly cause: unknown

  constructor(modulePath: string, cause: unknown) {
    const message = ModuleLoadError.buildMessage(modulePath, cause)
    super(message)
    this.name = 'ModuleLoadError'
    this.modulePath = modulePath
    this.cause = cause
  }

  private static buildMessage(modulePath: string, cause: unknown): string {
    const causeMessage = cause instanceof Error ? cause.message : String(cause)

    return [
      `Failed to load registry module: ${modulePath}`,
      '',
      `Cause: ${causeMessage}`,
      '',
      'Possible reasons:',
      '  1. The module path is incorrect or the file does not exist',
      '  2. The module has a syntax error or fails to initialize',
      '  3. The adapter function threw an error while processing exports',
      '',
      'Check that the module exists and exports the expected format.',
    ].join('\n')
  }
}
