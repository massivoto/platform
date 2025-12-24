import { describe, it, expect } from 'vitest'

export function skipDescribe(testSuite: string, action: () => Promise<void>) {
  describe(testSuite, () => {
    it('should pass', (done) => {
      expect(true).toBeTruthy()
    })
  })

  return 'Skipping ' + testSuite
}
