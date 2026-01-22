/**
 * PortAllocator
 *
 * Manages dynamic port allocation for local applet instances.
 * Finds available ports in a specified range and tracks allocations.
 */

import * as net from 'node:net'

/**
 * PortAllocator finds and manages available ports for applet servers.
 */
export class PortAllocator {
  private allocatedPorts: Set<number> = new Set()

  constructor(
    private readonly minPort: number = 10000,
    private readonly maxPort: number = 20000,
  ) {}

  /**
   * Allocate an available port.
   * @returns Available port number
   * @throws Error if no ports are available in the range
   */
  async allocate(): Promise<number> {
    const port = await this.findAvailablePort()
    this.allocatedPorts.add(port)
    return port
  }

  /**
   * Release a previously allocated port.
   * @param port - Port to release
   */
  release(port: number): void {
    this.allocatedPorts.delete(port)
  }

  /**
   * Release all allocated ports.
   */
  async releaseAll(): Promise<void> {
    this.allocatedPorts.clear()
  }

  /**
   * Check if a port is currently allocated.
   * @param port - Port to check
   */
  isAllocated(port: number): boolean {
    return this.allocatedPorts.has(port)
  }

  /**
   * Find an available port that is not already allocated.
   */
  private async findAvailablePort(): Promise<number> {
    // Try multiple times to find an available port
    const maxAttempts = 100

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const port = await this.tryGetPort()

      // Skip if we already allocated this port
      if (this.allocatedPorts.has(port)) {
        continue
      }

      // Verify port is in range (OS might give us something else)
      if (port >= this.minPort && port <= this.maxPort) {
        return port
      }

      // If OS gave port outside range, try explicit port in range
      const explicitPort = await this.tryExplicitPort()
      if (explicitPort !== null && !this.allocatedPorts.has(explicitPort)) {
        return explicitPort
      }
    }

    throw new Error(
      `No available ports in range ${this.minPort}-${this.maxPort}`,
    )
  }

  /**
   * Try to get any available port from the OS.
   */
  private async tryGetPort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer()

      server.listen(0, '127.0.0.1', () => {
        const addr = server.address() as net.AddressInfo
        const port = addr.port

        server.close((err) => {
          if (err) {
            reject(err)
          } else {
            resolve(port)
          }
        })
      })

      server.on('error', reject)
    })
  }

  /**
   * Try to find an available port explicitly in our range.
   */
  private async tryExplicitPort(): Promise<number | null> {
    // Generate a random port in our range
    const range = this.maxPort - this.minPort
    const randomPort = this.minPort + Math.floor(Math.random() * range)

    const isAvailable = await this.isPortAvailable(randomPort)
    return isAvailable ? randomPort : null
  }

  /**
   * Check if a specific port is available.
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer()

      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(true))
      })

      server.on('error', () => {
        resolve(false)
      })
    })
  }
}
