/**
 * ISO 8601 / RFC 3339 format
 * 2025-08-09T10:12:13.456Z
 */
export type ReadableDate = string

/**
 * Unix timestamp in milliseconds
 * e.g. 1700000000000
 */
export type Timestamp = number // Unix timestamp in milliseconds

/**
 * Unix timestamp in nanoseconds (as string)
 */
export type TimeUnixNano = string

export function toReadableDate(timestamp: Timestamp): ReadableDate {
  return new Date(timestamp).toISOString()
}

export function toTimestamp(iso: ReadableDate): Timestamp {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) throw new Error('Invalid ISO date string')
  return ms as Timestamp
}

export function nowTs(): Timestamp {
  return Date.now()
}

export function nowReadable(): ReadableDate {
  return toReadableDate(nowTs())
}

/** ---------- timeUnixNano utilities ---------- **/

// ms -> ns (as string)
export function toTimeUnixNano(ms: Timestamp): TimeUnixNano {
  return (BigInt(ms) * 1_000_000n).toString()
}

// now -> ns (as string)
export function nowTimeUnixNano(): TimeUnixNano {
  return toTimeUnixNano(nowTs())
}

// ns (string) -> ms (number) — safe because ms fits in JS number
export function timeUnixNanoToMs(ns: TimeUnixNano): Timestamp {
  const n = BigInt(ns)
  return Number(n / 1_000_000n)
}

// ns (string) -> ISO 8601
export function timeUnixNanoToReadable(ns: TimeUnixNano): ReadableDate {
  return toReadableDate(timeUnixNanoToMs(ns))
}

// ISO 8601 -> ns (string)
// Note: if `iso` has >3 fractional digits, JS Date will round to ms.
export function readableToTimeUnixNano(iso: ReadableDate): TimeUnixNano {
  const ms = Date.parse(iso)
  if (Number.isNaN(ms)) throw new Error('Invalid ISO date string')
  return toTimeUnixNano(ms as Timestamp)
}
