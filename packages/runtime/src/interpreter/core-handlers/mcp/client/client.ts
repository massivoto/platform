import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'
import { z } from 'zod'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { MCPServerCommand } from './command.js'
import { FilesystemClient } from './filesystem/filesystem.client.js'
import { PostgresClient } from './postgres.client.js'

// Define command line arguments schema
const argsSchema = z.object({
  server: z.enum(['filesystem', 'postgres']),
  path: z.string().optional(),
  url: z.string().optional(),
})

// Parse command line arguments
const args = argsSchema.parse({
  server: process.argv
    .find((arg) => arg.startsWith('--server='))
    ?.split('=')[1],
  path: process.argv.find((arg) => arg.startsWith('--path='))?.split('=')[1],
  url: process.argv.find((arg) => arg.startsWith('--url='))?.split('=')[1],
})

// Configure server command based on type
function getServerCommand(): MCPServerCommand {
  switch (args.server) {
    case 'filesystem':
      if (!args.path)
        throw new Error('--path is required for filesystem server')
      return {
        tool: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', args.path],
      }
    case 'postgres':
      if (!args.url) throw new Error('--url is required for postgres server')
      return {
        tool: 'postgres',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-postgres', args.url],
      }
    default:
      throw new Error(`Unknown server type: ${args.server}`)
  }
}

/**
 * Saves the tools list to a JSON file in the tools directory
 * @param tools The tools list to save
 * @param serverType The type of server (filesystem or postgres)
 */
async function saveToolsToFile(
  tools: unknown,
  serverType: string,
): Promise<void> {
  const fileName = `${serverType}.client.json`
  const filePath = join(
    process.cwd(),
    'src',
    'mcp',
    'client',
    'tools',
    fileName,
  )

  try {
    await writeFile(filePath, JSON.stringify(tools, null, 2))
    console.log(`Tools saved to ${filePath}`)
  } catch (error) {
    console.error(`Error saving tools to file: ${error}`)
  }
}

async function main() {
  const command = getServerCommand()
  if (command.tool === 'filesystem') {
    console.log('Connecting to filesystem server...')
    const client = new FilesystemClient()
    await client.connect()
    const fileContent = await client.readFile('README.md')
    console.log(`Current path: ${process.cwd()}`)
    console.log(fileContent)
    await client.shutdown()
    return
  }
  if (command.tool === 'postgres') {
    console.log('Connecting to POSTGRES DATABASE...')
    const client = new PostgresClient()
    await client.connect()
    const request = 'SELECT * FROM test LIMIT 50'
    const dbContent = await client.query(request)
    console.log(dbContent)
    await client.shutdown()
    return
  }

  try {
    // Create transport and client
    const transport = new StdioClientTransport(getServerCommand())
    const client = new Client({ name: 'mcp-client', version: '0.1.0' })

    // Connect to the server
    console.log('Connecting to MCP server...')
    await client.connect(transport)
    console.log('Connected successfully!')

    // Try to fetch and print available tools
    try {
      console.log('\nAvailable Tools:')
      const tools = await client.listTools()

      // Save tools to file
      await saveToolsToFile(tools, args.server)
    } catch (error) {
      console.log('Tools not supported by this server')
    }

    // Try to fetch and print available prompts
    try {
      console.log('\nAvailable Prompts:')
      const prompts = await client.listPrompts()
      console.log(JSON.stringify(prompts, null, 2))
    } catch (error) {
      console.log('Prompts not supported by this server')
    }

    // For filesystem server, try to list files in the directory
    if (args.server === 'filesystem') {
      try {
        console.log('\nFiles in directory:')
        const result = await client.callTool({
          name: 'list',
          arguments: {
            path: args.path,
          },
        })
        console.log(JSON.stringify(result, null, 2))
      } catch (error) {
        console.log('Error listing files:', error)
      }
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
