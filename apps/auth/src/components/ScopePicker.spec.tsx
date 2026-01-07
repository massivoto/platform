import { expect, describe, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { ScopePicker } from './ScopePicker'

describe('ScopePicker', () => {
  it('pre-checks and disables mandatory scopes', () => {
    render(<ScopePicker />)

    const mandatoryCheckbox = screen.getByLabelText('Read profile scope')
    expect(mandatoryCheckbox).toBeChecked()
    expect(mandatoryCheckbox).toBeDisabled()
  })

  it('toggles optional scopes and resets to defaults', () => {
    render(<ScopePicker />)

    const sendEmailsCheckbox = screen.getByLabelText('Send emails scope')
    expect(sendEmailsCheckbox).not.toBeChecked()
    const summary = () => screen.getByTestId('scope-summary')
    expect(summary()).toHaveTextContent('Selected scopes (2)')
    expect(summary()).not.toHaveTextContent('Send emails')

    fireEvent.click(sendEmailsCheckbox)
    expect(sendEmailsCheckbox).toBeChecked()
    expect(summary()).toHaveTextContent('Selected scopes (3)')
    expect(summary()).toHaveTextContent('Send emails')

    fireEvent.click(screen.getByRole('button', { name: 'Reset to defaults' }))
    expect(sendEmailsCheckbox).not.toBeChecked()
    expect(summary()).toHaveTextContent('Selected scopes (2)')
    expect(summary()).not.toHaveTextContent('Send emails')
  })

  it('keeps disabled scopes unchecked', () => {
    render(<ScopePicker />)

    const calendarCheckbox = screen.getByLabelText('Read calendar scope')
    expect(calendarCheckbox).not.toBeChecked()
    expect(calendarCheckbox).toBeDisabled()
  })

  it('allows adding a scope to the selection and reflects it in the summary', () => {
    render(<ScopePicker />)

    const sendEmailsCheckbox = screen.getByLabelText('Send emails scope')
    fireEvent.click(sendEmailsCheckbox)

    const summary = screen.getByTestId('scope-summary')
    expect(summary).toHaveTextContent('Selected scopes (3)')
    expect(summary).toHaveTextContent('Send emails')
  })

  it('calls onChange with the current selection', async () => {
    const handleChange = vi.fn()

    render(<ScopePicker onChange={handleChange} />)

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith([
        expect.objectContaining({ id: 'profile.read' }),
        expect.objectContaining({ id: 'emails.read' }),
      ]),
    )

    handleChange.mockClear()

    const sendEmailsCheckbox = screen.getByLabelText('Send emails scope')
    fireEvent.click(sendEmailsCheckbox)

    await waitFor(() =>
      expect(handleChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'profile.read' }),
          expect.objectContaining({ id: 'emails.read' }),
          expect.objectContaining({ id: 'emails.send' }),
        ]),
      ),
    )
  })
})
