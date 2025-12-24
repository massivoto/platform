import { describe, expect, test } from 'vitest'
import { vi } from 'vitest'
import {
  toReadableDate,
  nowTs,
  nowReadable,
  toTimeUnixNano,
  nowTimeUnixNano,
  timeUnixNanoToMs,
  timeUnixNanoToReadable,
  readableToTimeUnixNano,
  type Timestamp,
  type TimeUnixNano,
  type ReadableDate,
  toTimestamp,
} from './timestamp.js'

describe('time-utils', () => {
  test('toReadableDate returns RFC3339/ISO string for given ms', () => {
    const ms: Timestamp = 1700000000000
    const expectedIso = '2023-11-14T22:13:20.000Z'
    expect(toReadableDate(ms)).toBe(expectedIso)
  })

  test('nowTs returns current timestamp in ms', () => {
    const now = Date.now()
    expect(nowTs()).toBeGreaterThanOrEqual(now - 1000) // within 1 second
  })

  test('toTimestamp converts ISO string to ms timestamp', () => {
    const iso: ReadableDate = '2023-11-14T22:13:20.000Z'
    const ms: Timestamp = 1700000000000
    expect(toTimestamp(iso)).toBe(ms)
  })

  test('toTimeUnixNano and timeUnixNanoToMs roundtrip', () => {
    const ms: Timestamp = 1700000000000
    const ns: TimeUnixNano = toTimeUnixNano(ms)
    expect(ns).toBe('1700000000000000000') // 1.7e12 ms -> 1.7e18 ns
    expect(timeUnixNanoToMs(ns)).toBe(ms)
  })

  test('timeUnixNanoToReadable and readableToTimeUnixNano roundtrip with fixed ISO', () => {
    const iso: ReadableDate = '2025-08-09T10:12:13.456Z'
    const ns = readableToTimeUnixNano(iso)
    const back = timeUnixNanoToReadable(ns)
    expect(back).toBe(iso)
  })

  test('readableToTimeUnixNano parses offsets and normalizes to Z in timeUnixNanoToReadable', () => {
    const isoWithOffset: ReadableDate = '2025-08-09T12:12:13.456+02:00'
    const ns = readableToTimeUnixNano(isoWithOffset)
    // Expect the UTC-equivalent
    expect(timeUnixNanoToReadable(ns)).toBe('2025-08-09T10:12:13.456Z')
  })

  test('readableToTimeUnixNano throws on invalid ISO string', () => {
    expect(() => readableToTimeUnixNano('not-a-date')).toThrow(
      /Invalid ISO date string/,
    )
  })

  describe('now helpers (with fake timers)', () => {
    test('nowTs, nowReadable, nowTimeUnixNano reflect mocked system time', () => {
      vi.useFakeTimers()
      try {
        const fixed = new Date('2024-01-02T03:04:05.006Z')
        vi.setSystemTime(fixed)

        expect(nowTs()).toBe(1704164645006)
        expect(nowReadable()).toBe('2024-01-02T03:04:05.006Z')
        expect(nowTimeUnixNano()).toBe('1704164645006000000')
      } finally {
        vi.useRealTimers()
      }
    })
  })

  test('timeUnixNanoToMs handles big-int strings safely and returns ms number', () => {
    const ns: TimeUnixNano = '1754734333456000000' // 2025-08-09T10:12:13.456Z
    const ms = timeUnixNanoToMs(ns)
    expect(ms).toBe(1754734333456)
    expect(toReadableDate(ms)).toBe('2025-08-09T10:12:13.456Z')
  })
})
