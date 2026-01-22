/**
 * Local Applet Implementation (v0.5)
 *
 * Launches applets on localhost with dynamic ports.
 */

// Main launcher
export { LocalAppletLauncher } from './local-applet-launcher.js'
export type {
  LocalAppletLauncherConfig,
  ServerFactoryResolver,
} from './local-applet-launcher.js'

// Instance
export { LocalAppletInstance } from './local-applet-instance.js'
export type { LocalAppletInstanceConfig } from './local-applet-instance.js'

// Terminator
export { LocalAppletTerminator } from './local-applet-terminator.js'
export type { TerminableAppletInstance } from './local-applet-terminator.js'

// Port allocation
export { PortAllocator } from './port-allocator.js'

// Server factories
export type {
  AppletServerFactory,
  AppletServerConfig,
} from './server-factories/server-factory.js'
export { MinimalTestServerFactory } from './server-factories/minimal-test-factory.js'
export { AppletPackageServerFactory } from './server-factories/applet-package-factory.js'
