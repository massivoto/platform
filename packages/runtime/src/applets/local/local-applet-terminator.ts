/**
 * LocalAppletTerminator
 *
 * Controls the lifecycle of a local applet instance.
 * Stops the server, releases the port, and rejects pending promises.
 */

import { AppletTerminatedError } from '../errors.js'
import type { PortAllocator } from './port-allocator.js'
import { AppletTerminator } from '@massivoto/kit'

/**
 * Internal interface that LocalAppletInstance must implement
 * for terminator access.
 */
export interface TerminableAppletInstance {
  readonly id: string
  readonly port: number
  _stopServer(): void
  _rejectResponse(error: Error): void
}

/**
 * LocalAppletTerminator - terminates local applet instances.
 */
export class LocalAppletTerminator implements AppletTerminator {
  private _isTerminated: boolean = false

  constructor(
    private readonly instance: TerminableAppletInstance,
    private readonly portAllocator: PortAllocator,
  ) {}

  get isTerminated(): boolean {
    return this._isTerminated
  }

  async terminate(): Promise<void> {
    // Idempotent - only terminate once
    if (this._isTerminated) {
      return
    }

    // 1. Stop the server
    this.instance._stopServer()

    // 2. Release the port
    this.portAllocator.release(this.instance.port)

    // 3. Reject pending response promise
    this.instance._rejectResponse(new AppletTerminatedError(this.instance.id))

    this._isTerminated = true
  }
}
