import { describe, it, expect } from 'vitest'
import path from 'path'
import os from 'os'
import { isFileReference, resolveFilePath } from './file-reference.js'
import type { FileReference } from './file-reference.js'

/**
 * Theme: Formula One Race Automation
 *
 * Max's race photos are organized in a project folder.
 * FileReference tracks both relative and absolute paths.
 */

const projectRoot = path.resolve(os.tmpdir(), 'f1-project')

describe('FileReference', () => {
  describe('R-FILE-01: FileReference type', () => {
    it('should be a plain object with type, relativePath, absolutePath', () => {
      const ref: FileReference = {
        type: 'file-ref',
        relativePath: 'photos/monaco.png',
        absolutePath: path.join(projectRoot, 'photos/monaco.png'),
      }

      expect(ref.type).toBe('file-ref')
      expect(ref.relativePath).toBe('photos/monaco.png')
      expect(ref.absolutePath).toBe(path.join(projectRoot, 'photos/monaco.png'))
    })
  })

  describe('R-FILE-02: isFileReference type guard', () => {
    it('should return true for a valid FileReference', () => {
      const ref: FileReference = {
        type: 'file-ref',
        relativePath: 'photos/lap1.jpg',
        absolutePath: path.join(projectRoot, 'photos/lap1.jpg'),
      }
      expect(isFileReference(ref)).toBe(true)
    })

    it('should return false for a string', () => {
      expect(isFileReference('photos/lap1.jpg')).toBe(false)
    })

    it('should return false for null', () => {
      expect(isFileReference(null)).toBe(false)
    })

    it('should return false for undefined', () => {
      expect(isFileReference(undefined)).toBe(false)
    })

    it('should return false for an object with wrong type field', () => {
      expect(isFileReference({ type: 'other', relativePath: 'x', absolutePath: 'y' })).toBe(false)
    })

    it('should return false for an object missing relativePath', () => {
      expect(isFileReference({ type: 'file-ref', absolutePath: '/x' })).toBe(false)
    })

    it('should return false for an object missing absolutePath', () => {
      expect(isFileReference({ type: 'file-ref', relativePath: 'x' })).toBe(false)
    })
  })

  describe('R-FILE-03: resolveFilePath', () => {
    it('should strip ~/ prefix and join with projectRoot', () => {
      const result = resolveFilePath('~/photos/monaco.png', projectRoot)
      expect(result).toBe(path.resolve(projectRoot, 'photos/monaco.png'))
    })

    it('should handle path without ~/ prefix', () => {
      const result = resolveFilePath('photos/monaco.png', projectRoot)
      expect(result).toBe(path.resolve(projectRoot, 'photos/monaco.png'))
    })

    it('should reject paths that escape projectRoot via ..', () => {
      expect(() =>
        resolveFilePath('../../etc/passwd', projectRoot),
      ).toThrow('security violation')
    })

    it('should reject paths that escape projectRoot via ~/../..', () => {
      expect(() =>
        resolveFilePath('~/../../etc/passwd', projectRoot),
      ).toThrow('security violation')
    })

    it('should handle nested paths correctly', () => {
      const result = resolveFilePath('~/output/deep/nested/result.txt', projectRoot)
      expect(result).toBe(path.resolve(projectRoot, 'output/deep/nested/result.txt'))
    })

    it('should normalize slashes in path', () => {
      const result = resolveFilePath('photos//monaco.png', projectRoot)
      expect(result).toBe(path.resolve(projectRoot, 'photos/monaco.png'))
    })
  })
})
