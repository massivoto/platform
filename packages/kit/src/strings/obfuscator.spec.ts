import { describe, expect, test } from 'vitest'
import { obfuscateData, deobfuscateData } from './obfuscator.js' // Assuming .js extension rule

describe('Obfuscation Utilities', () => {
  const testCases = [
    { type: 'Empty String', data: '' },
    { type: 'Simple String', data: 'Hello World!' },
    {
      type: 'Email Address',
      data: 'test.user+alias@example.com',
    },
    { type: 'IPv4 Address', data: '192.168.1.1' },
    {
      type: 'IPv6 Address',
      data: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
    },
    {
      type: 'Ethereum Address',
      data: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    },
    {
      type: 'Long String',
      data: 'This is a much longer string with various characters !@#$%^&*()_+=-`~[]{}\\|;:\'",.<>/? and numbers 1234567890 to test the obfuscation more thoroughly.',
    },
  ]

  testCases.forEach(({ type, data }) => {
    test(`should correctly obfuscate and deobfuscate a ${type}`, () => {
      const obfuscated = obfuscateData(data)

      // Check 1: Obfuscated data should exist and be a string
      expect(obfuscated).toBeTypeOf('string')
      expect(obfuscated).not.toBeNull()
      if (obfuscated!.length > 0) {
        expect(obfuscated!.length).toBeGreaterThan(0)
      }

      // Check 2: Obfuscated data should not end with '='
      expect(obfuscated!.endsWith('=')).toBe(false)

      // Check 3: Deobfuscated data should match the original
      const deobfuscated = deobfuscateData(obfuscated!)
      expect(deobfuscated).toBeTypeOf('string')
      expect(deobfuscated).toBe(data)
    })
  })

  test('obfuscateData should return empty for empty input', () => {
    expect(obfuscateData('')).toBe('')
  })

  test('deobfuscateData should empty for empty input', () => {
    expect(deobfuscateData('')).toBe('')
  })
})
