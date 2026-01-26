/**
 * Dockerfile Generator for Applets
 *
 * R-DOCKER-03: Create generateDockerfile(config) function to produce Dockerfile content
 * R-DOCKER-11: Dockerfile uses node:22-alpine as base image
 * R-DOCKER-12: Dockerfile copies only production files (dist/, package.json)
 * R-DOCKER-13: Dockerfile installs production dependencies only
 * R-DOCKER-14: Dockerfile exposes configurable port (default 3000)
 * R-DOCKER-15: Dockerfile sets NODE_ENV=production environment variable
 * R-DOCKER-33: Dockerfile includes HEALTHCHECK instruction
 */

import type { AppletDockerConfig } from './applet-docker.types.js'

/**
 * Generates Dockerfile content for an applet.
 *
 * @param config - The applet docker configuration
 * @returns Dockerfile content as a string
 *
 * @example
 * ```typescript
 * const dockerfile = generateDockerfile({
 *   id: 'confirm',
 *   packageName: '@massivoto/applet-confirm',
 *   defaultPort: 3000,
 * })
 * ```
 */
export function generateDockerfile(config: AppletDockerConfig): string {
  const nodeVersion = config.nodeVersion ?? '22'
  const port = config.defaultPort
  const healthCheckPath = config.healthCheckPath ?? '/health'
  const healthCheckInterval = config.healthCheckInterval ?? 30

  const lines: string[] = [
    `# Generated Dockerfile for ${config.packageName}`,
    `# DO NOT EDIT - regenerate with: yarn docker:generate`,
    ``,
    `FROM node:${nodeVersion}-alpine`,
    ``,
    `# Create app directory`,
    `WORKDIR /app`,
    ``,
    `# Copy package files`,
    `COPY package.json ./`,
    `COPY yarn.lock ./`,
    ``,
    `# Install production dependencies only`,
    `RUN yarn install --production --frozen-lockfile`,
    ``,
    `# Copy built application`,
    `COPY dist/ ./dist/`,
    ``,
    `# Set environment`,
    `ENV NODE_ENV=production`,
    `ENV PORT=${port}`,
  ]

  // Add custom environment variables
  if (config.envVars) {
    for (const [key, value] of Object.entries(config.envVars)) {
      lines.push(`ENV ${key}=${value}`)
    }
  }

  lines.push(
    ``,
    `# Expose port`,
    `EXPOSE ${port}`,
    ``,
    `# Health check`,
    `HEALTHCHECK --interval=${healthCheckInterval}s --timeout=3s --start-period=5s --retries=3 \\`,
    `  CMD wget --no-verbose --tries=1 --spider http://localhost:${port}${healthCheckPath} || exit 1`,
    ``,
    `# Start application`,
    `CMD ["node", "dist/docker-entry.js"]`,
  )

  return lines.join('\n')
}
