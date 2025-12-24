import { describe, expect, test } from 'vitest'
import { mapLogToOtel, toUnixNanosString } from './otel-log.js'
import { type Log, type LogLevel } from './log.js'

/**
 * Helper to extract an attribute value from the Otel KeyValue[] array.
 */
function getAttr(
  otelAttrs: { key: string; value: unknown }[] | undefined,
  key: string,
) {
  return otelAttrs?.find((kv) => kv.key === key)?.value
}

describe('otel-log – mapLogToOtel', () => {
  test('maps a simple Log to a valid OtelLog record', () => {
    const log: Log = {
      date: '2025-08-09T10:12:13.456Z',
      level: 'INFO',
      message: 'hello world',
      component: 'auth-service',
      attributes: { userId: 42 },
    }

    const otel = mapLogToOtel(log)

    // time conversion
    expect(otel.timeUnixNano).toBe('1754734333456000000')

    // severity
    expect(otel.severityText).toBe('INFO')
    expect(otel.severityNumber).toBe(9)

    // body
    expect(otel.body).toEqual({ stringValue: 'hello world' })

    // attributes
    expect(getAttr(otel.attributes, 'userId')).toEqual({ intValue: '42' })
    expect(getAttr(otel.attributes, 'logger.name')).toEqual({
      stringValue: 'auth-service',
    })
    expect(getAttr(otel.attributes, 'component')).toEqual({
      stringValue: 'auth-service',
    })
  })

  test.each([
    ['TRACE', 1],
    ['DEBUG', 5],
    ['INFO', 9],
    ['WARN', 13],
    ['ERROR', 17],
    ['FATAL', 21],
  ] as [LogLevel, number][])('severity mapping %s → %d', (level, expected) => {
    const log: Log = {
      date: '2025-08-09T10:12:13.000Z',
      level,
      message: '',
      component: 'svc',
      attributes: {},
    }
    expect(mapLogToOtel(log).severityNumber).toBe(expected)
  })

  test('includes exception.* attributes and falls back to exception message as body', () => {
    const log: Log = {
      date: '2025-08-09T10:12:13.000Z',
      level: 'ERROR',
      // deliberately omit message -> fallback should use exception.message
      // message: undefined,
      message: undefined as unknown as string, // satisfy TS, will be `undefined` at runtime
      component: 'svc',
      attributes: {},
      exception: {
        type: 'Error',
        message: 'boom',
        stacktrace: 'stack',
      },
    }

    const otel = mapLogToOtel(log)
    expect(otel.body).toEqual({ stringValue: 'boom' })
    expect(getAttr(otel.attributes, 'exception.type')).toEqual({
      stringValue: 'Error',
    })
    expect(getAttr(otel.attributes, 'exception.message')).toEqual({
      stringValue: 'boom',
    })
    expect(getAttr(otel.attributes, 'exception.stacktrace')).toEqual({
      stringValue: 'stack',
    })
  })
})

describe('otel-log – toUnixNanosString', () => {
  test.each([
    // [ISO string, expected ns]
    ['2025-08-09T10:12:13Z', '1754734333000000000'],
    ['2025-08-09T10:12:13.1Z', '1754734333100000000'],
    ['2025-08-09T10:12:13.12Z', '1754734333120000000'],
    ['2025-08-09T10:12:13.123Z', '1754734333123000000'],
    ['2025-08-09T10:12:13.123456789Z', '1754734333123456789'],
    // with offset
    ['2025-08-09T12:12:13.456+02:00', '1754734333456000000'],
  ])('%s → %s', (iso, expected) => {
    expect(toUnixNanosString(iso)).toBe(expected)
  })

  test('throws on invalid input', () => {
    expect(() => toUnixNanosString('not-a-date')).toThrow(
      /ReadableDate must be RFC3339/,
    )
  })
})
