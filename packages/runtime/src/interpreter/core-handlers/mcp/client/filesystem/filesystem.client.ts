import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { BaseClient } from '../base-client.js'
import { MCPServerCommand } from '../command.js'
import path from 'path'

interface MCPToolResult {
  content: Array<{
    type: string
    text: string
  }>
}

export class FilesystemClient extends BaseClient {
  constructor() {
    super('filesystem')

    this.client.onclose = () => {
      console.log('### Client closed')
    }
  }

  getRootPath(): string {
    const path = process.env.MOTHER_FILEPATH
    if (!path) {
      throw new Error('MOTHER_FILEPATH env is required for filesystem server')
    }
    return path
  }

  async readFile(filePath: string): Promise<string> {
    filePath = path.join(this.getRootPath(), filePath)
    await this.prepareCommand('read_file')
    const result = (await this.client.callTool({
      name: 'read_file',
      arguments: {
        path: filePath,
      },
    })) as MCPToolResult

    // The result should contain the file contents in the content array
    if (result.content && result.content.length > 0) {
      return result.content[0].text
    }

    throw new Error('No content returned from read_file tool')
  }

  /**
   * Write content to a file, creating it if it doesn't exist or overwriting if it does
   * @param filePath The path where to write the file
   * @param content The content to write to the file
   * @returns A promise that resolves when the file is written
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    filePath = path.join(this.getRootPath(), filePath)
    await this.prepareCommand('write_file')
    const result = (await this.client.callTool({
      name: 'write_file',
      arguments: {
        path: filePath,
        content,
      },
    })) as MCPToolResult

    // Check if the write was successful
    if (!result.content || result.content.length === 0) {
      throw new Error('No confirmation received from write_file tool')
    }
    console.log('File written successfully:', result.content)
  }
}
