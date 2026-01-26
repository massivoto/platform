/**
 * Docker Utilities for Applets
 *
 * R-DOCKER-01: Create shared base configuration in packages/kit/src/applets/docker/
 * R-DOCKER-04: Export docker utilities from @massivoto/kit
 *
 * @example
 * ```typescript
 * import {
 *   generateDockerfile,
 *   generateDockerCompose,
 *   createHealthMiddleware,
 *   type AppletDockerConfig,
 * } from '@massivoto/kit'
 *
 * const config: AppletDockerConfig = {
 *   id: 'confirm',
 *   packageName: '@massivoto/applet-confirm',
 *   defaultPort: 3000,
 * }
 *
 * const dockerfile = generateDockerfile(config)
 * const compose = generateDockerCompose(config)
 * ```
 */

// Types
export type { AppletDockerConfig, HealthResponse } from './applet-docker.types.js'

// Generators
export { generateDockerfile } from './generate-dockerfile.js'
export { generateDockerCompose } from './generate-compose.js'

// Middleware
export { createHealthMiddleware } from './health-middleware.js'
