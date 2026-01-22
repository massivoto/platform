/**
 * MinimalTestServerFactory
 *
 * A minimal HTTP server factory for testing.
 * Uses raw Node.js http module, no dependencies on applet packages.
 */

import * as http from 'node:http'
import type {
  AppletServerConfig,
  AppletServerFactory,
} from './server-factory.js'

/**
 * Test factory that creates minimal HTTP servers.
 * Handles only POST /respond for testing purposes.
 */
export class MinimalTestServerFactory implements AppletServerFactory {
  createServer(config: AppletServerConfig): http.Server {
    const { port, input, onResponse } = config

    const server = http.createServer((req, res) => {
      // Handle POST /respond
      if (req.method === 'POST' && req.url === '/respond') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            onResponse(data)
            res.writeHead(200, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ ok: true }))
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.end(JSON.stringify({ error: 'Invalid JSON' }))
          }
        })
        return
      }

      // Handle GET /input
      if (req.method === 'GET' && req.url === '/input') {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(input))
        return
      }

      // Handle GET / (health check / status)
      if (req.method === 'GET' && (req.url === '/' || req.url === '')) {
        res.writeHead(200, { 'Content-Type': 'text/plain' })
        res.end('Applet running')
        return
      }

      // 404 for everything else
      res.writeHead(404, { 'Content-Type': 'text/plain' })
      res.end('Not Found')
    })

    server.listen(port, '127.0.0.1')
    return server
  }
}
