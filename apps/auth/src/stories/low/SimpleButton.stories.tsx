import type { Meta, StoryObj } from '@storybook/react'

import { SimpleButton } from '@/components/daisy/SimpleButton'

const meta: Meta<typeof SimpleButton> = {
  title: 'Low/SimpleButton',
  component: SimpleButton,
  args: {
    children: 'Click me',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
  parameters: {
    layout: 'centered',
  },
}

export default meta

type Story = StoryObj<typeof SimpleButton>

export const Default: Story = {}

export const Outline: Story = {
  args: {
    variant: 'outline',
  },
}

export const Destructive: Story = {
  args: {
    variant: 'destructive',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large button',
  },
}

export const WithCustomClasses: Story = {
  args: {
    extraClasses: 'uppercase tracking-wide',
    children: 'Custom classes',
  },
}
