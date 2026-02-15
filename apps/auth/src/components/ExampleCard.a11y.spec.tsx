import { expect, describe, it } from 'vitest'
import { expectAccessible } from '@/tests/utils/a11y'
import { ExampleCard } from './ExampleCard.js'

describe('a11y: ExampleCard', () => {
  it('has no obvious accessibility violations', async () => {
    await expectAccessible(<ExampleCard title="Status" description="Track the latest numbers" />)
  })
})
