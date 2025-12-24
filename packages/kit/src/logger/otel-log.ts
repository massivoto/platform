import { ReadableDate } from '../time/index.js'
import { Log, LogLevel } from './log.js'

/**
 * -------- OTLP/JSON LogRecord (single record) --------
 * This mirrors the protobuf JSON mapping:
 * - timeUnixNano/observedTimeUnixNano are uint64 (we use decimal strings)
 * - body is AnyValue (we use stringValue)
 * - attributes is KeyValue[]
 */
export interface OtelAnyValue {
  stringValue?: string
  boolValue?: boolean
  intValue?: string // int64 as decimal string
  doubleValue?: number
  arrayValue?: { values: OtelAnyValue[] }
  kvlistValue?: { values: OtelKeyValue[] }
  bytesValue?: string
}

export interface OtelKeyValue {
  key: string
  value: OtelAnyValue
}

export interface OtelLog {
  timeUnixNano: string
  observedTimeUnixNano?: string
  severityText: LogLevel
  severityNumber: number
  body: OtelAnyValue
  attributes?: OtelKeyValue[]
  traceId?: string
  spanId?: string
  flags?: number
}

/* ------------------ Mapper ------------------ */

export function mapLogToOtel(log: Log): OtelLog {
  const timeUnixNano = toUnixNanosString(log.date)

  // Base severity mapping per OTel (TRACE/DEBUG/INFO/WARN/ERROR/FATAL)
  const severityNumber = mapSeverityNumber(log.level)

  // Build attributes map (flat) then convert to Otel KeyValue[]
  const attrMap: Record<string, unknown> = {}

  // user-supplied attributes first
  if (log.attributes && typeof log.attributes === 'object') {
    Object.assign(attrMap, log.attributes as Record<string, unknown>)
  }

  // component -> logger.name (common convention)
  attrMap['logger.name'] = log.component
  // keep a plain component too (handy for filtering)
  attrMap['component'] = log.component

  // exception.* (if any)
  if (log.exception) {
    if (log.exception.type) attrMap['exception.type'] = log.exception.type
    if (log.exception.message)
      attrMap['exception.message'] = log.exception.message
    if (log.exception.stacktrace)
      attrMap['exception.stacktrace'] = log.exception.stacktrace
  }

  const attributes = toOtelAttributes(attrMap)

  return {
    timeUnixNano,
    severityText: log.level,
    severityNumber,
    body: { stringValue: normalizeBody(log.message, log.exception?.message) },
    attributes,
    // traceId/spanId/flags: add later when you propagate context
  }
}

/* ------------------ Helpers ------------------ */

function normalizeBody(message?: string, exceptionMessage?: string): string {
  // Prefer the human summary; fall back to exception message if needed
  return message ?? exceptionMessage ?? 'Unhandled exception'
}

function mapSeverityNumber(level: LogLevel): number {
  switch (level) {
    case 'TRACE':
      return 1 // 1..4 reserved for TRACE
    case 'DEBUG':
      return 5 // 5..8  for DEBUG
    case 'INFO':
      return 9 // 9..12 for INFO
    case 'WARN':
      return 13 // 13..16 for WARN
    case 'ERROR':
      return 17 // 17..20 for ERROR
    case 'FATAL':
      return 21 // 21..24 for FATAL
    default:
      return 9
  }
}

/**
 * RFC 3339 with optional fractional seconds (1..9 digits),
 * and mandatory timezone (Z or ±HH:MM).
 */
const RFC3339 =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/

/**
 * Convert an ISO 8601/RFC 3339 instant to Unix time in *nanoseconds* (decimal string).
 * Accepts up to 9 fractional digits. JS Date gives ms; we add the sub-ms ns ourselves.
 */
export function toUnixNanosString(d: ReadableDate): string {
  const m = RFC3339.exec(d)
  if (!m)
    throw new Error(
      'ReadableDate must be RFC3339 like 2025-08-09T10:12:13.456Z',
    )

  // Base epoch milliseconds (includes the first up-to-3 fractional digits)
  const ms = Date.parse(d)
  if (!Number.isFinite(ms))
    throw new Error('Invalid date supplied to toUnixNanosString')

  // If there are >3 fractional digits, add the remainder as extra nanoseconds.
  // Example: .123456789s -> Date.parse covers 123 ms; we add 456789 ns.
  const frac = m[1] ?? '' // 0..9 digits
  const frac9 = (frac + '000000000').slice(0, 9) // pad to 9
  const extraNs = BigInt(frac9.length > 3 ? frac9.slice(3) : '0') // 6 digits -> ns

  return (BigInt(Math.trunc(ms)) * 1_000_000n + extraNs).toString()
}

function toOtelAttributes(map: Record<string, unknown>): OtelKeyValue[] {
  return Object.entries(map)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([key, value]) => ({ key, value: toAnyValue(value) }))
}

function toAnyValue(v: unknown): OtelAnyValue {
  switch (typeof v) {
    case 'string':
      return { stringValue: v }
    case 'boolean':
      return { boolValue: v }
    case 'number':
      // int64 must be a decimal string; use intValue when it's an integer
      return Number.isInteger(v) ? { intValue: String(v) } : { doubleValue: v }
    case 'bigint':
      return { intValue: v.toString() }
    case 'object':
      if (v === null) return { stringValue: 'null' }
      if (v instanceof Date) return { stringValue: v.toISOString() }
      if (Array.isArray(v)) return { arrayValue: { values: v.map(toAnyValue) } }
      // plain object -> kvlistValue
      return {
        kvlistValue: {
          values: Object.entries(v as Record<string, unknown>)
            .filter(([, vv]) => vv !== undefined)
            .map(([k, vv]) => ({ key: k, value: toAnyValue(vv) })),
        },
      }
    default:
      // symbol | function | undefined -> stringify safely
      return { stringValue: String(v) }
  }
}
