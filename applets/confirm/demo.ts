/**
 * Demo script for the Confirm Applet
 *
 * Run with: npx vite-node applets/confirm/demo.ts
 *
 * Opens a confirmation dialog and logs the user's response.
 */

import { createServer } from './dist/server.js'

const PORT = 3333

const app = createServer({
  input: {
    message: 'Do you approve this social media post for publication?',
    title: 'Content Review',
    // Uncomment to test with an image:
    // resourceUrl: 'https://picsum.photos/400/300',
  },
  onResponse: ({ approved }) => {
    console.log('')
    console.log('========================================')
    console.log(`  USER RESPONSE: ${approved ? 'APPROVED' : 'REJECTED'}`)
    console.log('========================================')
    console.log('')

    // Exit after response
    setTimeout(() => {
      console.log('Server shutting down...')
      process.exit(0)
    }, 1000)
  },
})

app.listen(PORT, () => {
  console.log('')
  console.log('========================================')
  console.log('  CONFIRM APPLET DEMO')
  console.log('========================================')
  console.log('')
  console.log(`  Open in browser: http://localhost:${PORT}`)
  console.log('')
  console.log('  Waiting for user response...')
  console.log('')
})
