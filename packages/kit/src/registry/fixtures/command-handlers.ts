/**
 * Command handler fixtures.
 * Theme: Record Store - commands for managing vinyl inventory.
 */

import { FixtureCommandHandler, CommandResult } from './types.js'

/**
 * Create a command handler fixture.
 */
function createCommandHandler(
  id: string,
  executeFn: (
    args: Record<string, unknown>,
    options?: { timeout?: number },
  ) => Promise<CommandResult>,
): FixtureCommandHandler {
  return {
    id,
    type: 'command',
    init: async () => {},
    dispose: async () => {},
    execute: executeFn,
  }
}

/**
 * @utils/echo - Echoes back the input message.
 */
const echoHandler = createCommandHandler('@utils/echo', async (args) => {
  const message = args.message as string
  return { success: true, value: message }
})

/**
 * @utils/add - Adds two numbers together.
 */
const addHandler = createCommandHandler('@utils/add', async (args) => {
  const a = args.a as number
  const b = args.b as number
  return { success: true, value: a + b }
})

/**
 * @utils/fail - Always fails with an error.
 */
const failHandler = createCommandHandler('@utils/fail', async () => {
  return { success: false, error: 'This command always fails' }
})

/**
 * @utils/slow - Simulates a slow operation.
 */
const slowHandler = createCommandHandler(
  '@utils/slow',
  async (args, options) => {
    const delay = (args.delay as number) || 100
    const timeout = options?.timeout || 5000

    if (delay > timeout) {
      return { success: false, error: 'Operation would exceed timeout' }
    }

    await new Promise((resolve) => setTimeout(resolve, delay))
    return { success: true, value: `Completed after ${delay}ms` }
  },
)

export const commands = [
  { key: echoHandler.id, value: echoHandler },
  { key: addHandler.id, value: addHandler },
  { key: failHandler.id, value: failHandler },
  { key: slowHandler.id, value: slowHandler },
]
