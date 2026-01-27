/**
 * E2E Tests for Grid Applet
 *
 * Theme: Social Media Automation
 * Tests use content curation workflows where users select from
 * AI-generated social media post options.
 *
 * Requirements:
 * - R-GRID-63: E2E tests with Playwright: load page, verify items displayed, select 2 items, submit
 * - R-GRID-64: E2E tests: verify response contains full GridItem objects (not just IDs)
 *
 * Acceptance Criteria:
 * - AC-GRID-01: Emma sees all items with checkboxes
 * - AC-GRID-02: Carlos clicks on an item card, checkbox toggles
 * - AC-GRID-03: Emma selects 3 items and clicks Submit, waitForResponse resolves with full items
 * - AC-GRID-04: Item with resource URL displays the image
 * - AC-GRID-05: Item with metadata displays key/value pairs
 * - AC-GRID-06: Carlos submits with no items selected, resolves with empty array
 */

import { test, expect } from '@playwright/test'
import { createServer, type CreateServerConfig } from '../dist/server.js'
import type { Server } from 'http'
import type { GridItem } from '../dist/types.js'

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

test.describe('Grid Applet E2E', () => {
  const testItems: GridItem[] = [
    { id: '1', text: 'Tweet A: Product launch announcement' },
    { id: '2', text: 'Tweet B: Customer testimonial' },
    { id: '3', text: 'Tweet C: Behind the scenes' },
    { id: '4', text: 'Tweet D: Industry insights' },
    { id: '5', text: 'Tweet E: Promotional offer' },
  ]

  /**
   * AC-GRID-01: Given Emma launches a grid applet with 5 tweet options,
   * when the page loads, then she sees all 5 items with checkboxes.
   */
  test('Emma sees all items with checkboxes when page loads', async ({
    page,
  }) => {
    const serverHandle = await startServer({
      input: {
        items: testItems,
        title: 'Select tweets to publish',
      },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Verify title
      const title = page.locator('h1')
      await expect(title).toHaveText('Select tweets to publish')

      // Verify all 5 items are visible
      const gridItems = page.locator('.grid-item')
      await expect(gridItems).toHaveCount(5)

      // Verify each item has a checkbox
      const checkboxes = page.locator('.grid-item input[type="checkbox"]')
      await expect(checkboxes).toHaveCount(5)

      // Verify selection count shows 0 of 5
      const count = page.locator('.selection-count')
      await expect(count).toHaveText('0 of 5 selected')
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-GRID-02: Given Carlos clicks on an item card,
   * when the checkbox toggles, then the item is visually highlighted as selected.
   */
  test('Carlos clicks on item card to toggle selection', async ({ page }) => {
    const serverHandle = await startServer({
      input: { items: testItems },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Initially no items selected
      const firstItem = page.locator('.grid-item').first()
      await expect(firstItem).not.toHaveClass(/selected/)

      // Click on the item card
      await firstItem.click()

      // Now it should be selected
      await expect(firstItem).toHaveClass(/selected/)
      await expect(firstItem.locator('input[type="checkbox"]')).toBeChecked()

      // Verify count updated
      const count = page.locator('.selection-count')
      await expect(count).toHaveText('1 of 5 selected')

      // Click again to deselect
      await firstItem.click()
      await expect(firstItem).not.toHaveClass(/selected/)
      await expect(count).toHaveText('0 of 5 selected')
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-GRID-03: Given Emma has selected 3 items and clicks Submit,
   * when the response completes, then waitForResponse resolves with the 3 full GridItem objects.
   */
  test('Emma selects 3 items and submits, receives full GridItem objects', async ({
    page,
  }) => {
    let responseReceived: { selected: GridItem[] } | null = null
    const serverHandle = await startServer({
      input: {
        items: testItems,
        title: 'Select tweets to publish',
      },
      onResponse: (data) => {
        responseReceived = data
      },
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Wait for items to load
      await expect(page.locator('.grid-item')).toHaveCount(5)

      // Select items 1, 3, and 5
      await page.locator('.grid-item').nth(0).click() // Tweet A
      await page.locator('.grid-item').nth(2).click() // Tweet C
      await page.locator('.grid-item').nth(4).click() // Tweet E

      // Verify count
      await expect(page.locator('.selection-count')).toHaveText(
        '3 of 5 selected',
      )

      // Submit
      await page.locator('.btn-submit').click()

      // Wait for submitted state
      await expect(page.locator('.submitted')).toBeVisible()

      // Verify response contains full GridItem objects
      expect(responseReceived).not.toBeNull()
      expect(responseReceived?.selected).toHaveLength(3)
      expect(responseReceived?.selected).toEqual([
        { id: '1', text: 'Tweet A: Product launch announcement' },
        { id: '3', text: 'Tweet C: Behind the scenes' },
        { id: '5', text: 'Tweet E: Promotional offer' },
      ])
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-GRID-04: Given an item has a resource URL (image),
   * when the grid renders, then the image is displayed in the item card.
   */
  test('Item with resource URL displays the image', async ({ page }) => {
    const itemsWithImage: GridItem[] = [
      {
        id: '1',
        text: 'Tweet with image',
        resource: {
          url: 'https://example.com/social-preview.png',
          type: 'image',
        },
      },
    ]

    const serverHandle = await startServer({
      input: { items: itemsWithImage },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Verify image element is present
      const image = page.locator('.resource-container img')
      await expect(image).toHaveAttribute(
        'src',
        'https://example.com/social-preview.png',
      )
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-GRID-05: Given an item has metadata { "author": "AI", "tone": "casual" },
   * when the grid renders, then the metadata is displayed as key/value pairs.
   */
  test('Item with metadata displays key/value pairs', async ({ page }) => {
    const itemsWithMetadata: GridItem[] = [
      {
        id: '1',
        text: 'Tweet with metadata',
        metadata: {
          author: 'AI',
          tone: 'casual',
        },
      },
    ]

    const serverHandle = await startServer({
      input: { items: itemsWithMetadata },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Verify metadata is displayed
      const metadata = page.locator('.metadata')
      await expect(metadata).toBeVisible()

      // Check keys and values
      await expect(metadata.locator('dt').first()).toHaveText('author')
      await expect(metadata.locator('dd').first()).toHaveText('AI')
      await expect(metadata.locator('dt').nth(1)).toHaveText('tone')
      await expect(metadata.locator('dd').nth(1)).toHaveText('casual')
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * AC-GRID-06: Given Carlos submits with no items selected,
   * when the response completes, then waitForResponse resolves with { selected: [] }.
   */
  test('Carlos submits with no items selected, resolves with empty array', async ({
    page,
  }) => {
    let responseReceived: { selected: GridItem[] } | null = null
    const serverHandle = await startServer({
      input: { items: testItems },
      onResponse: (data) => {
        responseReceived = data
      },
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Wait for items to load
      await expect(page.locator('.grid-item')).toHaveCount(5)

      // Submit without selecting any items
      await page.locator('.btn-submit').click()

      // Wait for submitted state
      await expect(page.locator('.submitted')).toBeVisible()

      // Verify empty selection
      expect(responseReceived).toEqual({ selected: [] })
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * Additional test: Shows default title when no title provided.
   */
  test('Shows default title "Select Items" when no title provided', async ({
    page,
  }) => {
    const serverHandle = await startServer({
      input: { items: testItems },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      const title = page.locator('h1')
      await expect(title).toHaveText('Select Items')
    } finally {
      await serverHandle.close()
    }
  })

  /**
   * Additional test: Shows submission confirmation after response.
   */
  test('Shows submission confirmation after response', async ({ page }) => {
    const serverHandle = await startServer({
      input: { items: testItems },
      onResponse: () => {},
    })

    try {
      await page.goto(serverHandle.baseUrl)

      // Select one item and submit
      await page.locator('.grid-item').first().click()
      await page.locator('.btn-submit').click()

      // Verify submitted state
      const submittedContainer = page.locator('.submitted')
      await expect(submittedContainer).toBeVisible()
      await expect(submittedContainer.locator('h2')).toHaveText(
        'Selection Submitted',
      )
      await expect(submittedContainer.locator('p')).toHaveText(
        'You can close this window.',
      )
    } finally {
      await serverHandle.close()
    }
  })
})
