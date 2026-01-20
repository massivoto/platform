/**
 * Retro Beats distributor fixture.
 * Provides albums that overlap with other distributors (for conflict testing).
 */

import { createAlbum } from './types.js'

export const albums = [
  {
    key: '@classics/abbey-road', // CONFLICT: same key as vinyl-classics
    value: createAlbum(
      '@classics/abbey-road',
      'Abbey Road (Remastered)',
      'The Beatles',
      2019,
      'Come Together (2019 Mix)',
    ),
  },
  {
    key: '@retro/dark-side',
    value: createAlbum(
      '@retro/dark-side',
      'The Dark Side of the Moon',
      'Pink Floyd',
      1973,
      'Speak to Me',
    ),
  },
]
