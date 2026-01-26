/**
 * Tests for Docker Compose Generator
 *
 * R-DOCKER-21: Each applet has docker-compose.yml in its root directory
 * R-DOCKER-22: docker-compose mounts dist/ for hot reload during development
 * R-DOCKER-23: docker-compose exposes port 3000 by default (configurable)
 * R-DOCKER-24: docker-compose includes environment variables for input data injection
 */

import { describe, it, expect } from 'vitest'
import { generateDockerCompose } from './generate-compose.js'
import type { AppletDockerConfig } from './applet-docker.types.js'

describe('generateDockerCompose', () => {
  const baseConfig: AppletDockerConfig = {
    id: 'confirm',
    packageName: '@massivoto/applet-confirm',
    defaultPort: 3000,
  }

  /**
   * R-DOCKER-21: Generates valid YAML content
   */
  it('should generate valid YAML content', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain("version: '3.8'")
    expect(compose).toContain('services:')
  })

  /**
   * R-DOCKER-21: Service name follows applet-{id} pattern
   */
  it('should use applet-{id} as service name', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('applet-confirm:')
  })

  /**
   * R-DOCKER-21: Uses custom applet id for service name
   */
  it('should use custom applet id for service name', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      id: 'grid',
    }
    const compose = generateDockerCompose(config)
    expect(compose).toContain('applet-grid:')
  })

  /**
   * R-DOCKER-22: docker-compose includes build context
   */
  it('should include build context', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('build:')
    expect(compose).toContain('context: .')
    expect(compose).toContain('dockerfile: Dockerfile')
  })

  /**
   * R-DOCKER-23: docker-compose exposes port 3000 by default
   */
  it('should expose default port 3000', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('ports:')
    expect(compose).toContain('"${PORT:-3000}:3000"')
  })

  /**
   * R-DOCKER-23: docker-compose exposes custom port
   */
  it('should expose custom port when specified', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      defaultPort: 8080,
    }
    const compose = generateDockerCompose(config)
    expect(compose).toContain('"${PORT:-8080}:8080"')
  })

  /**
   * R-DOCKER-24: docker-compose includes NODE_ENV environment variable
   */
  it('should include NODE_ENV environment variable', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('environment:')
    expect(compose).toContain('NODE_ENV=development')
  })

  /**
   * R-DOCKER-24: docker-compose includes PORT environment variable
   */
  it('should include PORT environment variable', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('PORT=3000')
  })

  /**
   * R-DOCKER-24: docker-compose includes custom environment variables
   */
  it('should include custom environment variables', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      envVars: {
        APPLET_INPUT_MESSAGE: 'Default message',
        APPLET_INPUT_TITLE: 'Confirmation',
      },
    }
    const compose = generateDockerCompose(config)
    expect(compose).toContain('APPLET_INPUT_MESSAGE')
    expect(compose).toContain('APPLET_INPUT_TITLE')
  })

  /**
   * docker-compose includes healthcheck
   */
  it('should include healthcheck configuration', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('healthcheck:')
    expect(compose).toContain('test:')
    expect(compose).toContain('http://localhost:3000/health')
  })

  /**
   * docker-compose uses custom health check path
   */
  it('should use custom health check path', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      healthCheckPath: '/api/health',
    }
    const compose = generateDockerCompose(config)
    expect(compose).toContain('http://localhost:3000/api/health')
  })

  /**
   * docker-compose includes healthcheck interval
   */
  it('should include healthcheck interval', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('interval:')
  })

  /**
   * docker-compose includes healthcheck timeout
   */
  it('should include healthcheck timeout', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('timeout:')
  })

  /**
   * docker-compose includes healthcheck retries
   */
  it('should include healthcheck retries', () => {
    const compose = generateDockerCompose(baseConfig)
    expect(compose).toContain('retries:')
  })

  /**
   * AC-DOCKER-05: docker-compose.yml is valid for docker-compose up
   */
  it('AC-DOCKER-05: should produce complete docker-compose content', () => {
    const compose = generateDockerCompose(baseConfig)

    // Verify all required sections are present
    expect(compose).toContain("version: '3.8'")
    expect(compose).toContain('services:')
    expect(compose).toContain('applet-confirm:')
    expect(compose).toContain('build:')
    expect(compose).toContain('ports:')
    expect(compose).toContain('environment:')
    expect(compose).toContain('healthcheck:')
  })

  /**
   * AC-DOCKER-06: environment variables support APPLET_INPUT_* pattern
   */
  it('AC-DOCKER-06: should support APPLET_INPUT_* environment variables', () => {
    const config: AppletDockerConfig = {
      ...baseConfig,
      envVars: {
        APPLET_INPUT_MESSAGE: '${APPLET_INPUT_MESSAGE:-"Please confirm"}',
        APPLET_INPUT_TITLE: '${APPLET_INPUT_TITLE:-"Confirmation"}',
        APPLET_INPUT_RESOURCE_URL: '${APPLET_INPUT_RESOURCE_URL:-""}',
      },
    }
    const compose = generateDockerCompose(config)

    expect(compose).toContain('APPLET_INPUT_MESSAGE')
    expect(compose).toContain('APPLET_INPUT_TITLE')
    expect(compose).toContain('APPLET_INPUT_RESOURCE_URL')
  })
})
