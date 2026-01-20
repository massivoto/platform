/**
 * Vinyl Classics distributor fixture.
 * Provides classic rock albums from the 60s and 70s.
 *
 * Abbey Road demonstrates lifecycle management:
 * - init() sets up playback capability
 * - play() requires init() to be called first
 * - dispose() cleans up playback state
 */

import { Album } from './types.js'

/**
 * Abbey Road - demonstrates lifecycle-dependent play() method.
 * Per PRD AC-REG-06/AC-REG-07, init() must be called before play() works.
 */
function createAbbeyRoad(): Album {
  let initialized = false

  return {
    id: '@classics/abbey-road',
    type: 'album',
    title: 'Abbey Road',
    artist: 'The Beatles',
    year: 1969,
    init: async () => {
      initialized = true
    },
    dispose: async () => {
      initialized = false
    },
    play: async () => {
      if (!initialized) {
        throw new Error('Album not initialized - call init() first')
      }
      return { status: 'playing', track: 'Come Together' }
    },
  }
}

/**
 * Let It Be - simple album without lifecycle requirements.
 */
function createLetItBe(): Album {
  return {
    id: '@classics/let-it-be',
    type: 'album',
    title: 'Let It Be',
    artist: 'The Beatles',
    year: 1970,
    init: async () => {},
    dispose: async () => {},
    play: async () => ({ status: 'playing', track: 'Let It Be' }),
  }
}

export const albums = [
  { key: '@classics/abbey-road', value: createAbbeyRoad() },
  { key: '@classics/let-it-be', value: createLetItBe() },
]
