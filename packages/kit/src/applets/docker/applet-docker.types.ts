/**
 * Docker Configuration Types for Applets
 *
 * R-DOCKER-01: Create shared base configuration in packages/kit/src/applets/docker/
 * R-DOCKER-02: Define AppletDockerConfig interface for applet-specific settings
 */

/**
 * Configuration for generating Docker files for an applet.
 */
export interface AppletDockerConfig {
  /** Applet identifier (e.g., "confirm") */
  id: string

  /** npm package name (e.g., "@massivoto/applet-confirm") */
  packageName: string

  /** Default port (typically 3000) */
  defaultPort: number

  /** Node.js version for base image (default: "22") */
  nodeVersion?: string

  /** Additional environment variables */
  envVars?: Record<string, string>

  /** Health check path (default: "/health") */
  healthCheckPath?: string

  /** Health check interval in seconds (default: 30) */
  healthCheckInterval?: number
}

/**
 * Health response structure returned by the /health endpoint.
 * R-DOCKER-32: Health endpoint returns { status, applet, uptime }
 */
export interface HealthResponse {
  status: 'healthy' | 'unhealthy'
  applet: string
  uptime: number
}
