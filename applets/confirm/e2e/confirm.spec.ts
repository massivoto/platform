/**
 * E2E Tests for Confirm Applet
 *
 * Theme: Social Media Automation
 * Tests use content approval workflows where human reviewers validate
 * AI-generated social media posts before publishing.
 *
 * Requirements:
 * - R-CONFIRM-82: E2E tests with Playwright: load page, verify message displayed, click Approve
 * - R-CONFIRM-83: E2E tests: click Reject, verify response sent
 * - R-CONFIRM-84: E2E tests: verify resource (image) is displayed when resourceUrl provided
 *
 * Acceptance Criteria:
 * - AC-CONFIRM-01: Emma sees title "Confirmation" and message text
 * - AC-CONFIRM-02: Carlos sees image displayed above message
 * - AC-CONFIRM-03: Emma clicks Approve, waitForResponse resolves with { approved: true }
 * - AC-CONFIRM-04: Carlos clicks Reject, waitForResponse resolves with { approved: false }
 */

import { test, expect, type Page } from '@playwright/test'
import { createServer, type CreateServerConfig } from '../dist/server.js'
import type { Server } from 'http'

/**
 * Helper to start the server and return cleanup function.
 */
async function startServer(config: CreateServerConfig): Promise<{
  baseUrl: string
  server: Server
  close: () => Promise<void>
}> {
  const app = createServer(config)

  return new Promise((resolve, reject) => {
    // Use port 0 to let OS assign an available port
    const server = app.listen(0, () => {
      const address = server.address()
      if (typeof address === 'object' && address !== null) {
        const port = address.port
        const baseUrl = `http://localhost:${port}`
        resolve({
          baseUrl,
          server,
          close: () =>
            new Promise<void>((res, rej) => {
              server.close((err) => (err ? rej(err) : res()))
            }),
        })
      } else {
        reject(new Error('Failed to get server address'))
      }
    })
  })
}

test.describe('Confirm Applet E2E', () => {
  /**
   * AC-CONFIRM-01: Given Emma launches a confirm applet with message "Publish this tweet?",
   * when the page loads, then she sees the title "Confirmation" and the message text.
   *
   * R-CONFIRM-82: load page, verify message displayed
   */
  test('Emma sees default title and message when page loads', async ({
    page,
  }) => {
    let responseReceived: { approved: boolean } | null = null
    const serverHandle = await startServer({
      input: {
        message: 'Publish this tweet?',
      },
      onResponse: (data) => {
        responseReceived = data
      },
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Verify title "Confirmation" (default when no title provided)
      const title = page.locator('h1')
      await expect(title).toHaveText('Confirmation')

      // Verify message text
      const message = page.locator('.message')
      await expect(message).toHaveText('Publish this tweet?')

      // Verify both buttons are present
      await expect(page.locator('.btn-approve')).toBeVisible()
      await expect(page.locator('.btn-reject')).toBeVisible()
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-CONFIRM-02: Given Carlos sees a confirm applet with an image resourceUrl,
   * when the page loads, then the image is displayed above the message.
   *
   * R-CONFIRM-84: verify resource (image) is displayed when resourceUrl provided
   */
  test('Carlos sees image displayed when resourceUrl is provided', async ({
    page,
  }) => {
    // Use a URL with image extension (getResourceType checks file extension)
    // The image doesn't need to actually load - we just verify the img element is rendered
    const testImageUrl = 'https://example.com/social-media-preview.png'

    const serverHandle = await startServer({
      input: {
        message: 'Approve this social media image?',
        title: 'Image Review',
        resourceUrl: testImageUrl,
      },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Verify custom title
      const title = page.locator('h1')
      await expect(title).toHaveText('Image Review')

      // Verify image element is present with correct src
      // Note: The image may not actually load (404), but the <img> element should exist
      const image = page.locator('.resource-container img')
      await expect(image).toHaveAttribute('src', testImageUrl)

      // Verify message is below the image
      const message = page.locator('.message')
      await expect(message).toHaveText('Approve this social media image?')
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-CONFIRM-03: Given Emma clicks the "Approve" button,
   * when the request completes, then waitForResponse() resolves with { approved: true }.
   *
   * R-CONFIRM-82: click Approve
   */
  test('Emma clicks Approve and response resolves with approved: true', async ({
    page,
  }) => {
    let responseReceived: { approved: boolean } | null = null
    const serverHandle = await startServer({
      input: {
        message: 'Publish this tweet about product launch?',
        title: 'Tweet Approval',
      },
      onResponse: (data) => {
        responseReceived = data
      },
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Wait for the page to load
      await expect(page.locator('h1')).toHaveText('Tweet Approval')

      // Click Approve button
      await page.locator('.btn-approve').click()

      // Wait for response and verify submitted state
      await expect(page.locator('.submitted')).toBeVisible()

      // Verify the onResponse callback was called with { approved: true }
      expect(responseReceived).toEqual({ approved: true })
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-CONFIRM-04: Given Carlos clicks the "Reject" button,
   * when the request completes, then waitForResponse() resolves with { approved: false }.
   *
   * R-CONFIRM-83: click Reject, verify response sent
   */
  test('Carlos clicks Reject and response resolves with approved: false', async ({
    page,
  }) => {
    let responseReceived: { approved: boolean } | null = null
    const serverHandle = await startServer({
      input: {
        message: 'This meme might be controversial. Publish anyway?',
        title: 'Content Moderation',
      },
      onResponse: (data) => {
        responseReceived = data
      },
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Wait for the page to load
      await expect(page.locator('h1')).toHaveText('Content Moderation')

      // Click Reject button
      await page.locator('.btn-reject').click()

      // Wait for response and verify submitted state
      await expect(page.locator('.submitted')).toBeVisible()

      // Verify the onResponse callback was called with { approved: false }
      expect(responseReceived).toEqual({ approved: false })
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * Additional test: Verify submitted state shows correct message.
   */
  test('Shows submission confirmation after response', async ({ page }) => {
    const serverHandle = await startServer({
      input: {
        message: 'Approve this content?',
      },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Click Approve
      await page.locator('.btn-approve').click()

      // Verify submitted state
      const submittedContainer = page.locator('.submitted')
      await expect(submittedContainer).toBeVisible()
      await expect(submittedContainer.locator('h2')).toHaveText(
        'Response Submitted',
      )
      await expect(submittedContainer.locator('p')).toHaveText(
        'You can close this window.',
      )
    } finally {
      await serverHandle.close()
    }
  })
})
