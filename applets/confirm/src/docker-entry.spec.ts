/**
 * Tests for Docker Entry Point
 *
 * Tests env var parsing and port validation.
 * Signal handling is tested indirectly via container tests.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { parsePort, parseInputFromEnv } from './docker-entry.js'

describe('docker-entry', () => {
  describe('parsePort', () => {
    it('returns default port when env is undefined', () => {
      expect(parsePort(undefined)).toBe(3000)
    })

    it('returns default port when env is empty string', () => {
      expect(parsePort('')).toBe(3000)
    })

    it('parses valid port number', () => {
      expect(parsePort('8080')).toBe(8080)
    })

    it('parses port 1', () => {
      expect(parsePort('1')).toBe(1)
    })

    it('parses port 65535', () => {
      expect(parsePort('65535')).toBe(65535)
    })

    it('returns default for port 0', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parsePort('0')).toBe(3000)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns default for port > 65535', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parsePort('70000')).toBe(3000)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns default for negative port', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parsePort('-1')).toBe(3000)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns default for non-numeric string', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      expect(parsePort('abc')).toBe(3000)
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('returns default for float string', () => {
      // parseInt('3000.5', 10) returns 3000, which is valid
      expect(parsePort('3000.5')).toBe(3000)
    })
  })

  describe('parseInputFromEnv', () => {
    const originalEnv = process.env

    beforeEach(() => {
      // Create a clean env object for each test
      process.env = { ...originalEnv }
      delete process.env.APPLET_INPUT_MESSAGE
      delete process.env.APPLET_INPUT_TITLE
      delete process.env.APPLET_INPUT_RESOURCE_URL
    })

    afterEach(() => {
      process.env = originalEnv
    })

    it('returns default message when env not set', () => {
      const input = parseInputFromEnv()
      expect(input.message).toBe('Please confirm')
    })

    it('parses message from env', () => {
      process.env.APPLET_INPUT_MESSAGE = 'Custom message'
      const input = parseInputFromEnv()
      expect(input.message).toBe('Custom message')
    })

    it('returns undefined title when env not set', () => {
      const input = parseInputFromEnv()
      expect(input.title).toBeUndefined()
    })

    it('parses title from env', () => {
      process.env.APPLET_INPUT_TITLE = 'Custom Title'
      const input = parseInputFromEnv()
      expect(input.title).toBe('Custom Title')
    })

    it('returns undefined resourceUrl when env not set', () => {
      const input = parseInputFromEnv()
      expect(input.resourceUrl).toBeUndefined()
    })

    it('parses resourceUrl from env', () => {
      process.env.APPLET_INPUT_RESOURCE_URL = 'https://example.com/image.png'
      const input = parseInputFromEnv()
      expect(input.resourceUrl).toBe('https://example.com/image.png')
    })

    it('parses all fields together', () => {
      process.env.APPLET_INPUT_MESSAGE = 'Review this content'
      process.env.APPLET_INPUT_TITLE = 'Content Review'
      process.env.APPLET_INPUT_RESOURCE_URL = 'https://example.com/doc.pdf'

      const input = parseInputFromEnv()
      expect(input).toEqual({
        message: 'Review this content',
        title: 'Content Review',
        resourceUrl: 'https://example.com/doc.pdf',
      })
    })

    it('handles empty string as undefined for optional fields', () => {
      process.env.APPLET_INPUT_MESSAGE = 'Test'
      process.env.APPLET_INPUT_TITLE = ''
      process.env.APPLET_INPUT_RESOURCE_URL = ''

      const input = parseInputFromEnv()
      // Empty string evaluates to falsy, so || undefined returns undefined
      expect(input.title).toBeUndefined()
      expect(input.resourceUrl).toBeUndefined()
    })
  })
})
