import { Serializable } from '../network/index.js'
import { ReadableDate } from '../time/index.js'

export type LogLevel = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'

interface ExceptionType {
  type: string
  message: string
  stacktrace: string
}

export interface Log {
  date: ReadableDate
  level: LogLevel
  message: string
  component: string
  attributes: Serializable
  exception?: ExceptionType
}
