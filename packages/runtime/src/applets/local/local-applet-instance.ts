/**
 * LocalAppletInstance
 *
 * A running local applet instance that waits for user response.
 */

import type * as http from 'node:http'
import type { ZodSchema } from 'zod'
import type { AppletInstance } from '@massivoto/kit'
import type { ExecutionContext } from '@massivoto/kit'
import { AppletTimeoutError, AppletValidationError } from '../errors.js'
import {
  LocalAppletTerminator,
  type TerminableAppletInstance,
} from './local-applet-terminator.js'
import type { PortAllocator } from './port-allocator.js'
import type { AppletServerFactory } from './server-factories/server-factory.js'

/**
 * Configuration for creating a LocalAppletInstance.
 */
export interface LocalAppletInstanceConfig {
  /** Unique instance ID */
  id: string

  /** Applet definition ID */
  appletId: string

  /** Port to run on */
  port: number

  /** Input data for the applet */
  input: unknown

  /** Execution context */
  ctx: ExecutionContext

  /** Schema for validating response */
  outputSchema: ZodSchema

  /** Port allocator for cleanup */
  portAllocator: PortAllocator

  /** Timeout in milliseconds */
  timeoutMs: number
}

/**
 * Deferred promise pattern for response handling.
 */
interface DeferredPromise<T> {
  promise: Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
}

function createDeferredPromise<T>(): DeferredPromise<T> {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void

  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })

  // Prevent unhandled rejection warnings when promise is not awaited
  // (e.g., when instance is terminated during cleanup without waitForResponse being called)
  promise.catch(() => {
    // Intentionally empty - rejection will be handled by waitForResponse or ignored during cleanup
  })

  return { promise, resolve, reject }
}

/**
 * LocalAppletInstance - a running local applet.
 */
export class LocalAppletInstance
  implements AppletInstance, TerminableAppletInstance
{
  readonly id: string
  readonly appletId: string
  readonly url: string
  readonly port: number
  readonly terminator: LocalAppletTerminator

  private server: http.Server | null = null
  private responseDeferred: DeferredPromise<unknown>
  private responseReceived: boolean = false
  private readonly timeoutMs: number
  private readonly input: unknown
  private readonly outputSchema: ZodSchema

  constructor(config: LocalAppletInstanceConfig) {
    this.id = config.id
    this.appletId = config.appletId
    this.port = config.port
    this.url = `http://localhost:${config.port}`
    this.timeoutMs = config.timeoutMs
    this.input = config.input
    this.outputSchema = config.outputSchema

    // Create deferred promise for response
    this.responseDeferred = createDeferredPromise()

    // Instance creates its own terminator
    this.terminator = new LocalAppletTerminator(this, config.portAllocator)
  }

  /**
   * Start the applet server.
   */
  async start(serverFactory: AppletServerFactory): Promise<void> {
    this.server = serverFactory.createServer({
      port: this.port,
      input: this.input,
      onResponse: (data: unknown) => {
        this.handleResponse(data)
      },
    })

    // Wait for server to be listening
    await new Promise<void>((resolve, reject) => {
      this.server!.on('listening', resolve)
      this.server!.on('error', reject)
    })
  }

  /**
   * Handle incoming response from user.
   */
  private handleResponse(data: unknown): void {
    if (this.responseReceived) {
      // Already received a response, ignore subsequent ones
      return
    }

    try {
      // Validate response against schema
      const validated = this.outputSchema.parse(data)
      this.responseReceived = true
      this.responseDeferred.resolve(validated)
    } catch (error) {
      // Schema validation failed
      if (error instanceof Error && error.name === 'ZodError') {
        this.responseDeferred.reject(
          new AppletValidationError(this.id, error as any),
        )
      } else {
        this.responseDeferred.reject(error as Error)
      }
    }
  }

  /**
   * Wait for user to submit response.
   */
  async waitForResponse<T>(): Promise<T> {
    const timeoutId = setTimeout(() => {
      if (!this.responseReceived && !this.terminator.isTerminated) {
        this.responseDeferred.reject(
          new AppletTimeoutError(this.id, this.timeoutMs),
        )
      }
    }, this.timeoutMs)

    try {
      const result = await this.responseDeferred.promise
      return result as T
    } finally {
      clearTimeout(timeoutId)
    }
  }

  /**
   * Stop the server. Called by terminator.
   */
  _stopServer(): void {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }

  /**
   * Reject pending response. Called by terminator.
   */
  _rejectResponse(error: Error): void {
    if (!this.responseReceived) {
      this.responseDeferred.reject(error)
    }
  }
}
