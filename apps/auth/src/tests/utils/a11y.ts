import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import * as axe from 'axe-core'

// R-FOUNDATION-61: Vitest-compatible a11y helper using axe-core
export async function expectAccessible(ui: ReactElement): Promise<void> {
  const { container, unmount } = render(ui)
  try {
    const results = await axe.run(container)
    if (results.violations.length > 0) {
      const details = results.violations
        .map((v) => `${v.id} (${v.help}):\n${v.nodes.map((n) => `  - ${n.html}`).join('\n')}`)
        .join('\n\n')
      throw new Error(`Accessibility violations:\n${details}`)
    }
  } finally {
    unmount()
  }
}
