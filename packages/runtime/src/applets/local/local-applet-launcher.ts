/**
 * LocalAppletLauncher
 *
 * v0.5 implementation of AppletLauncher.
 * Spawns applets on localhost with random ports between 10000-20000.
 */

import type {
  AppletLauncher,
  AppletInstance,
  AppletDefinition,
  AppletRegistry,
} from '../types.js'
import type { ExecutionContext } from '../../domain/execution-context.js'
import { AppletNotFoundError, AppletValidationError } from '../errors.js'
import { LocalAppletInstance } from './local-applet-instance.js'
import { PortAllocator } from './port-allocator.js'
import type { AppletServerFactory } from './server-factories/server-factory.js'
import { AppletPackageServerFactory } from './server-factories/applet-package-factory.js'

/**
 * Resolves the server factory for an applet.
 */
export type ServerFactoryResolver = (
  appletId: string,
  definition: AppletDefinition,
) => AppletServerFactory

/**
 * Configuration for LocalAppletLauncher.
 */
export interface LocalAppletLauncherConfig {
  /** Registry containing applet definitions */
  registry: AppletRegistry

  /** Optional custom port allocator */
  portAllocator?: PortAllocator

  /** Optional custom server factory resolver (for testing) */
  serverFactoryResolver?: ServerFactoryResolver

  /** Default timeout in ms (fallback if applet doesn't define one) */
  defaultTimeoutMs?: number
}

/**
 * Generate a simple unique ID.
 * In production, this would use a proper cuid library.
 */
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 15)
  return `c${timestamp}${random}`.substring(0, 25).padEnd(25, '0')
}

/**
 * LocalAppletLauncher - launches applets on localhost.
 */
export class LocalAppletLauncher implements AppletLauncher {
  private readonly registry: AppletRegistry
  private readonly portAllocator: PortAllocator
  private readonly serverFactoryResolver: ServerFactoryResolver
  private readonly defaultTimeoutMs: number

  constructor(config: LocalAppletLauncherConfig) {
    this.registry = config.registry
    this.portAllocator = config.portAllocator ?? new PortAllocator(10000, 20000)
    this.defaultTimeoutMs = config.defaultTimeoutMs ?? 48 * 60 * 60 * 1000 // 48 hours default

    // Default resolver uses AppletPackageServerFactory
    this.serverFactoryResolver =
      config.serverFactoryResolver ??
      ((appletId, def) => {
        const packageName = def.packageName ?? `@massivoto/applet-${appletId}`
        return new AppletPackageServerFactory(packageName)
      })
  }

  /**
   * Launch an applet instance.
   */
  async launch(
    appletId: string,
    input: unknown,
    ctx: ExecutionContext,
  ): Promise<AppletInstance> {
    // 1. Get definition from registry
    const entry = await this.registry.get(appletId)
    if (!entry) {
      throw new AppletNotFoundError(appletId)
    }

    const definition = entry.value

    // 2. Validate input against schema
    let validatedInput: unknown
    try {
      validatedInput = definition.inputSchema.parse(input)
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        throw new AppletValidationError(appletId, error as any)
      }
      throw error
    }

    // 3. Resolve server factory
    const serverFactory = this.serverFactoryResolver(appletId, definition)

    // 4. Allocate port
    const port = await this.portAllocator.allocate()

    // 5. Determine timeout (per-applet or fallback to default)
    const timeoutMs = definition.timeoutMs ?? this.defaultTimeoutMs

    // 6. Create instance
    const instance = new LocalAppletInstance({
      id: generateId(),
      appletId,
      port,
      input: validatedInput,
      ctx,
      outputSchema: definition.outputSchema,
      portAllocator: this.portAllocator,
      timeoutMs,
    })

    // 7. Start server
    await instance.start(serverFactory)

    return instance
  }
}
