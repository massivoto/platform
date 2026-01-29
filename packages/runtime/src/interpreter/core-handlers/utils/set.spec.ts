import { describe, it, expect } from 'vitest'

import { Stream } from '@masala/parser'
import { ExecutionContext } from '@massivoto/kit'
import { Interpreter } from '../../interpreter.js'
import { InstructionNode } from '../../parser/ast.js'
import { buildInstructionParser } from '../../parser/instruction-parser.js'

describe('Interpreter with parsed instruction', () => {
  const registry = registerStandardCommandHandlers()
  const interpreter = new Interpreter(registry)
  const parser = buildInstructionParser()

  const baseContext: ExecutionContext = fromPartialContext({
    env: { MODE: 'test' },
    data: {
      tweets: [{ id: 'a' }, { id: 'b' }],
      count: 42,
      users: ['a', 'b', 'c'],
      nested: {
        deep: {
          value: 99,
        },
      },
    },

    user: {
      id: 'user-123',
      extra: {},
    },
  })

  it('should evaluate literal input and store in output', async () => {
    const dsl = '@utils/set input=3 output=finalCount'
    const result = parser.parse(Stream.ofChars(dsl))
    expect(result.isAccepted()).toBe(true)

    const ast = result.value as InstructionNode

    const statementResult = await interpreter.execute(ast, baseContext)
    expect(statementResult.context.data.finalCount).toBe(3)
  })

  it('should evaluate identifier input from context.data and store in output', async () => {
    const dsl = '@utils/set input={count} output=backup'
    const result = parser.parse(Stream.ofChars(dsl))
    expect(result.isAccepted()).toBe(true)

    const ast = result.value as InstructionNode

    const statementResult = await interpreter.execute(ast, baseContext)
    expect(statementResult.context.data.backup).toBe(42)
  })

  /*
  it('should evaluate expression input like {users:tail:2}', async () => {
    const dsl = '@utils/set input={users:tail:2} output=recentUsers'
    const result = parser.parse(Stream.ofChars(dsl))
    expect(result.isAccepted()).toBe(true)

    const ast = result.value as InstructionNode
    const context = structuredClone(baseContext)

    await interpreter.execute(ast, context)
    expect(context.data.recentUsers).toEqual(['b', 'c'])
  })*/
})
