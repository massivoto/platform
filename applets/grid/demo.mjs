/**
 * Demo script for the Grid Applet
 *
 * Run with: node demo.mjs
 *
 * This starts a local server with sample data so you can test
 * the applet UI manually in your browser.
 */

import { createServer } from './dist/index.js'

const sampleItems = [
  {
    id: '1',
    text: 'Tweet A: Excited to announce our new product launch! Check it out now.',
  },
  {
    id: '2',
    text: 'Tweet B: Our customers love the new features. Here is what they are saying...',
    metadata: { author: 'AI', tone: 'testimonial' },
  },
  {
    id: '3',
    text: 'Tweet C: Behind the scenes look at how we built this amazing product.',
    resource: {
      url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400',
      type: 'image',
    },
  },
  {
    id: '4',
    text: 'Tweet D: Industry insights - 5 trends shaping the future of automation.',
    metadata: { author: 'AI', tone: 'thought-leadership' },
  },
  {
    id: '5',
    text: 'Tweet E: Limited time offer! Get 20% off your first month.',
    metadata: { author: 'AI', tone: 'promotional' },
  },
]

const app = createServer({
  input: {
    items: sampleItems,
    title: 'Select tweets to publish',
  },
  onResponse: ({ selected }) => {
    console.log('\n=== Selection Received ===')
    console.log(`Selected ${selected.length} items:`)
    selected.forEach((item, index) => {
      console.log(`  ${index + 1}. [${item.id}] ${item.text.slice(0, 50)}...`)
    })
    console.log('==========================\n')

    // Exit after response in demo mode
    setTimeout(() => {
      console.log('Demo complete. Exiting...')
      process.exit(0)
    }, 1000)
  },
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`Grid Applet Demo running at http://localhost:${PORT}`)
  console.log('Open this URL in your browser to test the applet.')
  console.log('Select items and click Submit to see the response.\n')
})
