import type { Meta, StoryObj } from '@storybook/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import { Topbar } from '@/components/Topbar.js'

const createRouterDecorator = (routeTitle: string) => {
  return (Story: () => JSX.Element) => {
    const router = createMemoryRouter(
      [
        {
          path: '/',
          element: <Story />,
          handle: {
            title: routeTitle,
          },
        },
      ],
      { initialEntries: ['/'] },
    )

    return <RouterProvider router={router} />
  }
}

const meta = {
  title: 'Low-Level/Topbar',
  component: Topbar,
  args: {
    title: '',
  },
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Topbar>

export default meta

type Story = StoryObj<typeof meta>

export const WithRouteHandleTitle: Story = {
  decorators: [createRouterDecorator('Dashboard')],
}

export const WithManualOverride: Story = {
  args: {
    title: 'Integrations',
  },
  decorators: [createRouterDecorator('Providers')],
}
