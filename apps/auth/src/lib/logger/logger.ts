// R-BUILD-63: Environment-aware console wrapper.
type LogFn = (...args: unknown[]) => void

const noop: LogFn = () => undefined

const detectIsProduction = () => {
  if (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined') {
    if (typeof import.meta.env.PROD === 'boolean') {
      return import.meta.env.PROD
    }
  }

  if (typeof process !== 'undefined' && typeof process.env !== 'undefined') {
    return process.env.NODE_ENV === 'production'
  }

  return false
}

const isProduction = detectIsProduction()

const consoleRef = typeof console !== 'undefined' ? console : undefined

const createDebugFn = (): LogFn => {
  if (isProduction || !consoleRef || typeof consoleRef.debug !== 'function') {
    return noop
  }

  return consoleRef.debug.bind(consoleRef)
}

const createInfoFn = (): LogFn => {
  if (isProduction || !consoleRef || typeof consoleRef.info !== 'function') {
    return noop
  }

  return consoleRef.info.bind(consoleRef)
}

const createWarnFn = (): LogFn => {
  if (isProduction || !consoleRef || typeof consoleRef.warn !== 'function') {
    return noop
  }

  return consoleRef.warn.bind(consoleRef)
}

const createErrorFn = (): LogFn => {
  if (isProduction || !consoleRef || typeof consoleRef.error !== 'function') {
    return noop
  }

  return consoleRef.error.bind(consoleRef)
}

export const logger = {
  debug: createDebugFn(),
  info: createInfoFn(),
  warn: createWarnFn(),
  error: createErrorFn(),
}
