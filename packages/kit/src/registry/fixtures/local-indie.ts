/**
 * Local Indie distributor fixture.
 * Provides jazz albums with unique keys (no conflicts).
 */

import { createAlbum } from './types.js'

export const albums = [
  {
    key: '@indie/blue-train',
    value: createAlbum(
      '@indie/blue-train',
      'Blue Train',
      'John Coltrane',
      1958,
    ),
  },
  {
    key: '@indie/kind-of-blue',
    value: createAlbum(
      '@indie/kind-of-blue',
      'Kind of Blue',
      'Miles Davis',
      1959,
    ),
  },
]
