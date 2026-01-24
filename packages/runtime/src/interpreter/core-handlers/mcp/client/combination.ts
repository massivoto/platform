import { FilesystemClient } from './filesystem/filesystem.client.js'
import { PostgresClient } from './postgres.client.js'

// TODO: code for a demo - to be removed later
export async function combineMcps() {
  const dbClient = new PostgresClient()
  const fileClient = new FilesystemClient()

  const request = 'SELECT * FROM test LIMIT 50'
  const dbContent = await dbClient.query(request)
  console.log('DB Content:', dbContent)

  await fileClient.writeFile('testing.md', dbContent)
}

//combineMcps().catch(console.error)
