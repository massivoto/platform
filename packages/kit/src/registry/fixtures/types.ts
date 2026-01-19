/**
 * Test fixtures for registry tests.
 * Theme: Record Store - vinyl albums from different distributors.
 */

import { RegistryItem } from '../types.js'

/**
 * Test registry item representing a vinyl album.
 */
export interface Album extends RegistryItem {
  kind: 'album'
  title: string
  artist: string
  year: number
}

/**
 * Create an album fixture with default init/dispose.
 */
export function createAlbum(
  id: string,
  title: string,
  artist: string,
  year: number,
): Album {
  return {
    id,
    kind: 'album',
    title,
    artist,
    year,
    init: async () => {},
    dispose: async () => {},
  }
}

/**
 * Standard fixture export format.
 * Each fixture module exports entries in this format.
 */
export interface FixtureExports {
  albums: Array<{ key: string; value: Album }>
}

/**
 * Adapter function for converting fixture exports to a Map.
 * Accepts unknown (from dynamic import) and casts to expected type.
 */
export function fixtureAdapter(exports: unknown): Map<string, Album> {
  const typed = exports as FixtureExports
  return new Map(typed.albums.map(({ key, value }) => [key, value]))
}
