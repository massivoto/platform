/**
 * Tests for Dockerfile Generator
 *
 * R-DOCKER-03: Create generateDockerfile(config) function to produce Dockerfile content
 * R-DOCKER-11: Dockerfile uses node:22-alpine as base image
 * R-DOCKER-12: Dockerfile copies only production files (dist/, package.json)
 * R-DOCKER-13: Dockerfile installs production dependencies only
 * R-DOCKER-14: Dockerfile exposes configurable port (default 3000)
 * R-DOCKER-15: Dockerfile sets NODE_ENV=production environment variable
 * R-DOCKER-33: Dockerfile includes HEALTHCHECK instruction
 */

import { describe, it, expect } from 'vitest'
import { generateDockerfile } from './generate-dockerfile.js'
import type { AppletDockerConfig } from './applet-docker.types.js'

describe('generateDockerfile', () => {
  const baseConfig: AppletDockerConfig = {
    id: 'confirm',
    packageName: '@massivoto/applet-confirm',
    defaultPort: 3000,
  }

  /**
   * R-DOCKER-11: Dockerfile uses node:22-alpine as base image
   */
  it('should use node:22-alpine as default base image', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('FROM node:22-alpine')
  })

  /**
   * R-DOCKER-11: Dockerfile uses configurable node version
   */
  it('should use custom node version when specified', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      nodeVersion: '20',
    }
    const dockerfile = generateDockerfile(config)
    expect(dockerfile).toContain('FROM node:20-alpine')
  })

  /**
   * R-DOCKER-12: Dockerfile copies only production files
   */
  it('should copy package.json and yarn.lock', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('COPY package.json ./')
    expect(dockerfile).toContain('COPY yarn.lock ./')
  })

  /**
   * R-DOCKER-12: Dockerfile copies dist/ directory
   */
  it('should copy dist/ directory', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('COPY dist/ ./dist/')
  })

  /**
   * R-DOCKER-13: Dockerfile installs production dependencies only
   */
  it('should install production dependencies only', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('yarn install --production --frozen-lockfile')
  })

  /**
   * R-DOCKER-14: Dockerfile exposes configurable port (default 3000)
   */
  it('should expose default port 3000', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('EXPOSE 3000')
  })

  /**
   * R-DOCKER-14: Dockerfile exposes custom port
   */
  it('should expose custom port when specified', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      defaultPort: 8080,
    }
    const dockerfile = generateDockerfile(config)
    expect(dockerfile).toContain('EXPOSE 8080')
  })

  /**
   * R-DOCKER-15: Dockerfile sets NODE_ENV=production
   */
  it('should set NODE_ENV=production', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('ENV NODE_ENV=production')
  })

  /**
   * R-DOCKER-15: Dockerfile sets PORT environment variable
   */
  it('should set PORT environment variable', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('ENV PORT=3000')
  })

  /**
   * R-DOCKER-33: Dockerfile includes HEALTHCHECK instruction
   */
  it('should include HEALTHCHECK instruction', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('HEALTHCHECK')
    expect(dockerfile).toContain('http://localhost:3000/health')
  })

  /**
   * R-DOCKER-33: HEALTHCHECK uses custom health check path
   */
  it('should use custom health check path', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      healthCheckPath: '/api/health',
    }
    const dockerfile = generateDockerfile(config)
    expect(dockerfile).toContain('http://localhost:3000/api/health')
  })

  /**
   * R-DOCKER-33: HEALTHCHECK uses custom interval
   */
  it('should use custom health check interval', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      healthCheckInterval: 60,
    }
    const dockerfile = generateDockerfile(config)
    expect(dockerfile).toContain('--interval=60s')
  })

  /**
   * Dockerfile sets WORKDIR to /app
   */
  it('should set WORKDIR to /app', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('WORKDIR /app')
  })

  /**
   * Dockerfile starts with node dist/docker-entry.js
   */
  it('should start with node dist/docker-entry.js', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('CMD ["node", "dist/docker-entry.js"]')
  })

  /**
   * Dockerfile includes custom environment variables
   */
  it('should include custom environment variables', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      envVars: {
        LOG_LEVEL: 'debug',
        API_URL: 'https://api.example.com',
      },
    }
    const dockerfile = generateDockerfile(config)
    expect(dockerfile).toContain('ENV LOG_LEVEL=debug')
    expect(dockerfile).toContain('ENV API_URL=https://api.example.com')
  })

  /**
   * Dockerfile includes header comment with package name
   */
  it('should include header comment with package name', () => {
    const dockerfile = generateDockerfile(baseConfig)
    expect(dockerfile).toContain('# Generated Dockerfile for @massivoto/applet-confirm')
  })

  /**
   * AC-DOCKER-01: Given config, generateDockerfile produces valid Dockerfile content
   */
  it('AC-DOCKER-01: should produce complete Dockerfile content', () => {
    const dockerfile = generateDockerfile(baseConfig)

    // Verify all required sections are present
    expect(dockerfile).toContain('FROM node:22-alpine')
    expect(dockerfile).toContain('WORKDIR /app')
    expect(dockerfile).toContain('COPY package.json')
    expect(dockerfile).toContain('yarn install --production')
    expect(dockerfile).toContain('COPY dist/')
    expect(dockerfile).toContain('ENV NODE_ENV=production')
    expect(dockerfile).toContain('EXPOSE')
    expect(dockerfile).toContain('HEALTHCHECK')
    expect(dockerfile).toContain('CMD')
  })
})
