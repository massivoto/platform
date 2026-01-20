/**
 * Test fixtures for registry tests.
 * Theme: Record Store - vinyl albums from different distributors.
 */

import { RegistryItem } from '../types.js'

/**
 * Result returned by album play() method.
 */
export interface PlayResult {
  status: 'playing'
  track: string
}

/**
 * Test registry item representing a vinyl album.
 */
export interface Album extends RegistryItem {
  type: 'album'
  title: string
  artist: string
  year: number
  /** Play the album. May require init() to be called first. */
  play(): Promise<PlayResult>
}

/**
 * Create an album fixture with default init/dispose and play.
 * The default play() returns the first track of the album.
 */
export function createAlbum(
  id: string,
  title: string,
  artist: string,
  year: number,
  firstTrack: string = 'Track 1',
): Album {
  return {
    id,
    type: 'album',
    title,
    artist,
    year,
    init: async () => {},
    dispose: async () => {},
    play: async () => ({ status: 'playing', track: firstTrack }),
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

// ============================================================================
// Command Handler Fixtures (for testing execute entrypoint)
// ============================================================================

/**
 * Result returned by command execution.
 */
export interface CommandResult<T = unknown> {
  success: boolean
  value?: T
  error?: string
}

/**
 * Test registry item representing a command handler.
 * Mimics the runtime CommandHandler interface.
 */
export interface FixtureCommandHandler extends RegistryItem {
  type: 'command'
  execute(
    args: Record<string, unknown>,
    options?: { timeout?: number },
  ): Promise<CommandResult>
}

/**
 * Fixture exports format for command handlers.
 */
export interface CommandHandlerExports {
  commands: Array<{ key: string; value: FixtureCommandHandler }>
}

/**
 * Adapter function for command handler fixtures.
 */
export function commandHandlerAdapter(
  exports: unknown,
): Map<string, FixtureCommandHandler> {
  const typed = exports as CommandHandlerExports
  return new Map(typed.commands.map(({ key, value }) => [key, value]))
}
