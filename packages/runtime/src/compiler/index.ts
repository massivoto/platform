/**
 * There is not that much to export to the outside world,
 * only what is needed to add more instruction handlers.
 *
 * Mostly :
 *
 * registerStandardCommandHandlers() // to register the standard handlers
 * getCommandHandlerRegistry().registerBundle(myHandlers) // to register custom handlers
 */

export * from './interpreter'
export * from './handlers'
