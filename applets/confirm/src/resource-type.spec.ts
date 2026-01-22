/**
 * Resource Type Detection Tests
 *
 * Requirements:
 * - R-CONFIRM-61: getResourceType detects image/video/audio/pdf/embed
 * - R-CONFIRM-62: Detect image URLs (jpg, png, gif, webp, svg)
 * - R-CONFIRM-63: Detect video (mp4, webm) and audio (mp3, wav, ogg)
 * - R-CONFIRM-64: Detect PDF and YouTube/Vimeo embeds
 */
import { describe, it, expect } from 'vitest'
import {
  getResourceType,
  toEmbedUrl,
  type ResourceType,
} from './resource-type.js'

describe('getResourceType', () => {
  // R-CONFIRM-62: Image URLs
  describe('image detection', () => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']

    it.each(imageExtensions)('detects .%s as image', (ext) => {
      expect(getResourceType(`https://example.com/photo.${ext}`)).toBe('image')
    })

    it('detects images with query parameters', () => {
      expect(getResourceType('https://example.com/photo.jpg?size=large')).toBe(
        'image',
      )
    })

    it('detects images with uppercase extensions', () => {
      expect(getResourceType('https://example.com/photo.PNG')).toBe('image')
    })
  })

  // R-CONFIRM-63: Video and audio URLs
  describe('video detection', () => {
    const videoExtensions = ['mp4', 'webm', 'ogv']

    it.each(videoExtensions)('detects .%s as video', (ext) => {
      expect(getResourceType(`https://example.com/clip.${ext}`)).toBe('video')
    })

    it('detects video with query parameters', () => {
      expect(getResourceType('https://example.com/clip.mp4?autoplay=1')).toBe(
        'video',
      )
    })
  })

  describe('audio detection', () => {
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a']

    it.each(audioExtensions)('detects .%s as audio', (ext) => {
      expect(getResourceType(`https://example.com/track.${ext}`)).toBe('audio')
    })

    it('detects audio with query parameters', () => {
      expect(getResourceType('https://example.com/track.mp3?t=30')).toBe(
        'audio',
      )
    })
  })

  // R-CONFIRM-64: PDF and embeds
  describe('pdf detection', () => {
    it('detects .pdf as pdf', () => {
      expect(getResourceType('https://example.com/document.pdf')).toBe('pdf')
    })

    it('detects pdf with query parameters', () => {
      expect(getResourceType('https://example.com/doc.pdf?page=5')).toBe('pdf')
    })
  })

  describe('embed detection', () => {
    it('detects YouTube watch URLs', () => {
      expect(
        getResourceType('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      ).toBe('embed')
    })

    it('detects YouTube short URLs', () => {
      expect(getResourceType('https://youtu.be/dQw4w9WgXcQ')).toBe('embed')
    })

    it('detects Vimeo URLs', () => {
      expect(getResourceType('https://vimeo.com/123456789')).toBe('embed')
    })
  })

  describe('unknown detection', () => {
    it('returns unknown for unrecognized URLs', () => {
      expect(getResourceType('https://example.com/page')).toBe('unknown')
    })

    it('returns unknown for URLs with unrecognized extensions', () => {
      expect(getResourceType('https://example.com/file.docx')).toBe('unknown')
    })

    it('returns unknown for plain domain URLs', () => {
      expect(getResourceType('https://example.com')).toBe('unknown')
    })
  })
})

describe('toEmbedUrl', () => {
  describe('YouTube', () => {
    it('converts YouTube watch URL to embed URL', () => {
      const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      expect(toEmbedUrl(watchUrl)).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      )
    })

    it('converts YouTube short URL to embed URL', () => {
      const shortUrl = 'https://youtu.be/dQw4w9WgXcQ'
      expect(toEmbedUrl(shortUrl)).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      )
    })

    it('handles YouTube URLs with additional parameters', () => {
      const watchUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30'
      expect(toEmbedUrl(watchUrl)).toBe(
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
      )
    })
  })

  describe('Vimeo', () => {
    it('converts Vimeo URL to embed URL', () => {
      const vimeoUrl = 'https://vimeo.com/123456789'
      expect(toEmbedUrl(vimeoUrl)).toBe(
        'https://player.vimeo.com/video/123456789',
      )
    })
  })

  describe('other URLs', () => {
    it('returns the original URL for non-embeddable URLs', () => {
      const pdfUrl = 'https://example.com/doc.pdf'
      expect(toEmbedUrl(pdfUrl)).toBe(pdfUrl)
    })
  })
})
