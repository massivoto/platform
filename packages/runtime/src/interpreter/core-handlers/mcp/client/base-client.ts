import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { MCPServerCommand } from './command.js'

export abstract class BaseClient {
  public client: Client
  protected transport: StdioClientTransport
  connected = false

  protected constructor(public server: string) {
    const command = getServerCommand(server)
    this.transport = new StdioClientTransport(command)
    this.client = new Client({ name: command.tool, version: '0.1.0' })
  }

  isClosed(): boolean {
    return !this.isConnected()
  }
  isConnected(): boolean {
    return this.connected
  }

  async connect(): Promise<void> {
    await this.client.connect(this.transport)
    this.connected = true
  }

  async shutdown(): Promise<void> {
    try {
      this.connected = false
      // First close the client connection
      await this.client.close()

      // Then close the transport which will terminate the child process
      await this.transport.close()
    } catch (error) {
      console.error('Error during shutdown:', error)
    }
  }

  log(message: string): void {
    // nop
  }

  async prepareCommand(command: string) {
    if (this.isClosed()) {
      this.log('Client is closed, connecting...')
      await this.connect()
    }
    this.log(`Executing command: ${command}`)
  }
}

function getServerCommand(server: string): MCPServerCommand {
  switch (server) {
    case 'filesystem':
      const path = getEnv('MOTHER_FILEPATH')
      if (!path)
        throw new Error('MOTHER_FILEPATH env is required for filesystem server')
      return {
        tool: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', path],
      }
    case 'postgres':
      const postgresUrl = getEnv('MOTHER_POSTGRES')
      if (!postgresUrl)
        throw new Error('MOTHER_POSTGRES env is required for postgres server')
      return {
        tool: 'postgres',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', postgresUrl],
      }
    case 'fetch':
      return {
        tool: 'fetch',
        command: 'docker',
        args: ['run', '-i', '--rm', 'mcp/fetch'],
      }
    default:
      throw new Error(`Unknown server type: ${server}`)
  }
}

function getEnv(key: string): string | undefined {
  return process.env[key]
}
