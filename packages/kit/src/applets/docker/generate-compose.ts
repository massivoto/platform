/**
 * Docker Compose Generator for Applets
 *
 * R-DOCKER-21: Each applet has docker-compose.yml in its root directory
 * R-DOCKER-22: docker-compose mounts dist/ for hot reload during development
 * R-DOCKER-23: docker-compose exposes port 3000 by default (configurable)
 * R-DOCKER-24: docker-compose includes environment variables for input data injection
 */

import type { AppletDockerConfig } from './applet-docker.types.js'

/**
 * Generates docker-compose.yml content for an applet.
 *
 * @param config - The applet docker configuration
 * @returns docker-compose.yml content as a string
 *
 * @example
 * ```typescript
 * const compose = generateDockerCompose({
 *   id: 'confirm',
 *   packageName: '@massivoto/applet-confirm',
 *   defaultPort: 3000,
 * })
 * ```
 */
export function generateDockerCompose(config: AppletDockerConfig): string {
  const port = config.defaultPort
  const healthCheckPath = config.healthCheckPath ?? '/health'
  const serviceName = `applet-${config.id}`

  const lines: string[] = [
    `# docker-compose.yml for local development`,
    `# Generated for ${config.packageName}`,
    `version: '3.8'`,
    ``,
    `services:`,
    `  ${serviceName}:`,
    `    build:`,
    `      context: .`,
    `      dockerfile: Dockerfile`,
    `    ports:`,
    `      - "\${PORT:-${port}}:${port}"`,
    `    environment:`,
    `      - NODE_ENV=development`,
    `      - PORT=${port}`,
  ]

  // Add custom environment variables
  if (config.envVars) {
    for (const [key, value] of Object.entries(config.envVars)) {
      lines.push(`      - ${key}=${value}`)
    }
  }

  lines.push(
    `    healthcheck:`,
    `      test: ["CMD", "wget", "--spider", "-q", "http://localhost:${port}${healthCheckPath}"]`,
    `      interval: 10s`,
    `      timeout: 3s`,
    `      retries: 3`,
  )

  return lines.join('\n')
}
