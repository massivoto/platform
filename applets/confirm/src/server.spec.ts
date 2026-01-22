/**
 * Server Tests for Confirm Applet
 *
 * Requirements:
 * - R-CONFIRM-21: createServer factory
 * - R-CONFIRM-22: GET / serves frontend
 * - R-CONFIRM-23: GET /api/input returns input data
 * - R-CONFIRM-24: POST /respond accepts { approved: boolean }
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import { createServer, type CreateServerConfig } from './server.js'

describe('Confirm Applet Server', () => {
  let config: CreateServerConfig
  let onResponseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onResponseMock = vi.fn()
    config = {
      input: {
        message: 'Do you approve this content?',
        title: 'Content Review',
      },
      onResponse: onResponseMock,
    }
  })

  describe('createServer', () => {
    // R-CONFIRM-21: Implement Express server with createServer(config) factory
    it('creates an Express app instance', () => {
      const app = createServer(config)
      expect(app).toBeDefined()
      expect(typeof app.listen).toBe('function')
    })
  })

  describe('GET /api/input', () => {
    // R-CONFIRM-23: GET /api/input returns input data
    it('returns the input data with message and title', async () => {
      const app = createServer(config)

      const res = await request(app)
        .get('/api/input')
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body).toEqual({
        message: 'Do you approve this content?',
        title: 'Content Review',
      })
    })

    it('returns input data with optional resourceUrl when provided', async () => {
      const configWithResource: CreateServerConfig = {
        input: {
          message: 'Review this image',
          resourceUrl: 'https://example.com/image.jpg',
        },
        onResponse: onResponseMock,
      }
      const app = createServer(configWithResource)

      const res = await request(app).get('/api/input').expect(200)

      expect(res.body).toEqual({
        message: 'Review this image',
        resourceUrl: 'https://example.com/image.jpg',
      })
    })

    it('returns input data without title when not provided', async () => {
      const configWithoutTitle: CreateServerConfig = {
        input: {
          message: 'Simple confirmation',
        },
        onResponse: onResponseMock,
      }
      const app = createServer(configWithoutTitle)

      const res = await request(app).get('/api/input').expect(200)

      expect(res.body).toEqual({
        message: 'Simple confirmation',
      })
    })
  })

  describe('POST /respond', () => {
    // R-CONFIRM-24: POST /respond accepts { approved: boolean } and calls onResponse
    it('calls onResponse with approved: true when approve is clicked', async () => {
      const app = createServer(config)

      const res = await request(app)
        .post('/respond')
        .send({ approved: true })
        .expect(200)
        .expect('Content-Type', /json/)

      expect(res.body).toEqual({ ok: true })
      expect(onResponseMock).toHaveBeenCalledTimes(1)
      expect(onResponseMock).toHaveBeenCalledWith({ approved: true })
    })

    it('calls onResponse with approved: false when reject is clicked', async () => {
      const app = createServer(config)

      const res = await request(app)
        .post('/respond')
        .send({ approved: false })
        .expect(200)

      expect(res.body).toEqual({ ok: true })
      expect(onResponseMock).toHaveBeenCalledTimes(1)
      expect(onResponseMock).toHaveBeenCalledWith({ approved: false })
    })

    it('returns 400 when approved field is missing', async () => {
      const app = createServer(config)

      const res = await request(app).post('/respond').send({}).expect(400)

      expect(res.body.error).toContain('approved')
      expect(onResponseMock).not.toHaveBeenCalled()
    })

    it('returns 400 when approved is not a boolean', async () => {
      const app = createServer(config)

      const res = await request(app)
        .post('/respond')
        .send({ approved: 'yes' })
        .expect(400)

      expect(res.body.error).toContain('approved')
      expect(onResponseMock).not.toHaveBeenCalled()
    })

    it('only allows POST /respond to be called once', async () => {
      const app = createServer(config)

      // First call succeeds
      await request(app).post('/respond').send({ approved: true }).expect(200)

      // Second call fails
      const res = await request(app)
        .post('/respond')
        .send({ approved: false })
        .expect(400)

      expect(res.body.error).toContain('already')
      expect(onResponseMock).toHaveBeenCalledTimes(1)
    })
  })
})
