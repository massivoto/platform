export * from './network/index.js'
export * from './errors/index.js'
export * from './time/index.js'
export * from './registry/index.js'
export * from './applets/index.js'
export * from './domain/index.js'

import type { AppletLauncher as X } from './applets/types.js'

export type AppletLauncher = X

// Note: Testing utilities (./testing) are not exported from main entry point
// They import vitest which is a devDependency and not available at runtime.
// Import directly from '@massivoto/kit/testing' if needed in test files.
