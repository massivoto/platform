/**
 * Server Tests for Grid Applet
 *
 * Requirements:
 * - R-GRID-21: createServer factory
 * - R-GRID-22: GET / serves frontend
 * - R-GRID-23: GET /api/input returns input data
 * - R-GRID-24: POST /respond accepts { selected: string[] }
 * - R-GRID-25: Server maps selected IDs back to full GridItem objects
 *
 * Theme: Social Media Automation - content curation workflows
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createServer, type CreateServerConfig } from './server.js'
import type { GridItem } from './types.js'

describe('Grid Applet Server', () => {
  let config: CreateServerConfig
  let onResponseMock: ReturnType<typeof vi.fn>
  const testItems: GridItem[] = [
    { id: '1', text: 'Tweet A: Product launch announcement' },
    { id: '2', text: 'Tweet B: Customer testimonial' },
    { id: '3', text: 'Tweet C: Behind the scenes' },
  ]

  beforeEach(() => {
    onResponseMock = vi.fn()
    config = {
      input: {
        items: testItems,
        title: 'Select tweets to publish',
      },
      onResponse: onResponseMock,
    }
  })

  describe('createServer', () => {
    // R-GRID-21: Implement Express server with createServer(config) factory
    it('creates an Express app instance', () => {
      const app = createServer(config)

      expect(app).toBeDefined()
      expect(typeof app.listen).toBe('function')
    })
  })

  describe('GET /api/input', () => {
    // R-GRID-23: GET /api/input returns input data (items array, title)
    it('returns the input data with items and title', async () => {
      const app = createServer(config)

      const res = await request(app)
        .get('/api/input')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body).toEqual({
        items: testItems,
        title: 'Select tweets to publish',
      })
    })

    it('returns input data without title when not provided', async () => {
      const configWithoutTitle: CreateServerConfig = {
        input: {
          items: testItems,
        },
        onResponse: onResponseMock,
      }
      const app = createServer(configWithoutTitle)

      const res = await request(app).get('/api/input').expect(200)

      expect(res.body).toEqual({
        items: testItems,
      })
    })

    it('returns items with resource and metadata when provided', async () => {
      const itemsWithExtras: GridItem[] = [
        {
          id: '1',
          text: 'Tweet with image',
          resource: { url: 'https://example.com/image.jpg', type: 'image' },
          metadata: { author: 'AI', tone: 'casual' },
        },
      ]
      const configWithExtras: CreateServerConfig = {
        input: { items: itemsWithExtras },
        onResponse: onResponseMock,
      }
      const app = createServer(configWithExtras)

      const res = await request(app).get('/api/input').expect(200)

      expect(res.body.items[0].resource).toEqual({
        url: 'https://example.com/image.jpg',
        type: 'image',
      })
      expect(res.body.items[0].metadata).toEqual({
        author: 'AI',
        tone: 'casual',
      })
    })
  })

  describe('POST /respond', () => {
    // R-GRID-24: POST /respond accepts { selected: string[] } (array of selected item IDs)
    it('calls onResponse when selected IDs are provided', async () => {
      const app = createServer(config)

      const res = await request(app)
        .post('/respond')
        .send({ selected: ['1', '3'] })
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body).toEqual({ ok: true })
      expect(onResponseMock).toHaveBeenCalledTimes(1)
    })

    // R-GRID-25: Server maps selected IDs back to full GridItem objects
    it('maps selected IDs to full GridItem objects before calling onResponse', async () => {
      const app = createServer(config)

      await request(app)
        .post('/respond')
        .send({ selected: ['1', '3'] })
        .expect(200)

      expect(onResponseMock).toHaveBeenCalledWith({
        selected: [
          { id: '1', text: 'Tweet A: Product launch announcement' },
          { id: '3', text: 'Tweet C: Behind the scenes' },
        ],
      })
    })

    it('returns empty array when no items selected', async () => {
      const app = createServer(config)

      await request(app)
        .post('/respond')
        .send({ selected: [] })
        .expect(200)

      expect(onResponseMock).toHaveBeenCalledWith({
        selected: [],
      })
    })

    it('ignores unknown IDs in selected array', async () => {
      const app = createServer(config)

      await request(app)
        .post('/respond')
        .send({ selected: ['1', 'unknown', '2'] })
        .expect(200)

      expect(onResponseMock).toHaveBeenCalledWith({
        selected: [
          { id: '1', text: 'Tweet A: Product launch announcement' },
          { id: '2', text: 'Tweet B: Customer testimonial' },
        ],
      })
    })

    it('returns 400 when selected field is missing', async () => {
      const app = createServer(config)

      const res = await request(app).post('/respond').send({}).expect(400)

      expect(res.body.error).toContain('selected')
      expect(onResponseMock).not.toHaveBeenCalled()
    })

    it('returns 400 when selected is not an array', async () => {
      const app = createServer(config)

      const res = await request(app)
        .post('/respond')
        .send({ selected: 'not-an-array' })
        .expect(400)

      expect(res.body.error).toContain('selected')
      expect(onResponseMock).not.toHaveBeenCalled()
    })

    it('only allows POST /respond to be called once', async () => {
      const app = createServer(config)

      // First call succeeds
      await request(app)
        .post('/respond')
        .send({ selected: ['1'] })
        .expect(200)

      // Second call fails
      const res = await request(app)
        .post('/respond')
        .send({ selected: ['2'] })
        .expect(400)

      expect(res.body.error).toContain('already')
      expect(onResponseMock).toHaveBeenCalledTimes(1)
    })

    it('preserves item order matching input array order', async () => {
      const app = createServer(config)

      // Select items in different order than they appear in input
      await request(app)
        .post('/respond')
        .send({ selected: ['3', '1', '2'] })
        .expect(200)

      // Should return items in the order they appear in the input array
      expect(onResponseMock).toHaveBeenCalledWith({
        selected: [
          { id: '1', text: 'Tweet A: Product launch announcement' },
          { id: '2', text: 'Tweet B: Customer testimonial' },
          { id: '3', text: 'Tweet C: Behind the scenes' },
        ],
      })
    })
  })

  describe('Health check', () => {
    it('responds to GET /health', async () => {
      const app = createServer(config)

      const res = await request(app).get('/health').expect(200)

      expect(res.body.status).toBe('healthy')
      expect(res.body.applet).toBe('grid')
    })
  })
})
