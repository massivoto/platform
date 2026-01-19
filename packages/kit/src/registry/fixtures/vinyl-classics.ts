/**
 * Vinyl Classics distributor fixture.
 * Provides classic rock albums from the 60s and 70s.
 */

import { createAlbum } from './types.js'

export const albums = [
  {
    key: '@classics/abbey-road',
    value: createAlbum(
      '@classics/abbey-road',
      'Abbey Road',
      'The Beatles',
      1969,
    ),
  },
  {
    key: '@classics/let-it-be',
    value: createAlbum(
      '@classics/let-it-be',
      'Let It Be',
      'The Beatles',
      1970,
    ),
  },
]
