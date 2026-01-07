import { useEffect, useMemo, useState } from 'react'
import type { CheckedState } from '@radix-ui/react-checkbox'

import { Checkbox } from '@/components/ui/checkbox'

type ScopeDefinition = {
  id: string
  label: string
  description: string
  mandatory?: boolean
  defaultSelected?: boolean
  disabled?: boolean
}

const DEFAULT_SCOPES: ScopeDefinition[] = [
  {
    id: 'profile.read',
    label: 'Read profile',
    description: 'Allows access to your basic profile information.',
    mandatory: true,
  },
  {
    id: 'emails.read',
    label: 'Read emails',
    description: 'Fetch inbox messages for automation workflows.',
    defaultSelected: true,
  },
  {
    id: 'emails.send',
    label: 'Send emails',
    description: 'Send messages on your behalf.',
  },
  {
    id: 'calendar.read',
    label: 'Read calendar',
    description: 'View upcoming events to avoid scheduling conflicts.',
    disabled: true,
  },
]

const getDefaultSelection = () =>
  DEFAULT_SCOPES.reduce<Record<string, boolean>>((acc, scope) => {
    acc[scope.id] = scope.mandatory ? true : Boolean(scope.defaultSelected)
    return acc
  }, {})

// R-BUILD-43: Visual scaffold for choosing provider scopes.
export type ScopePickerProps = {
  onChange?: (selectedScopes: ScopeDefinition[]) => void
}

export const ScopePicker = ({ onChange }: ScopePickerProps) => {
  const [selection, setSelection] = useState<Record<string, boolean>>(() => getDefaultSelection())

  const handleToggle = (scope: ScopeDefinition, nextValue: CheckedState) => {
    if (scope.mandatory || scope.disabled) {
      return
    }

    setSelection((prev) => ({
      ...prev,
      [scope.id]: Boolean(nextValue),
    }))
  }

  const handleReset = () => {
    setSelection(getDefaultSelection())
  }

  const selectedScopes = useMemo(
    () => DEFAULT_SCOPES.filter((scope) => selection[scope.id]),
    [selection],
  )

  useEffect(() => {
    onChange?.(selectedScopes)
  }, [onChange, selectedScopes])

  return (
    <section className="space-y-4">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Scopes</h2>
          <p className="text-sm text-muted-foreground">
            Select the permissions to request from users.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleReset}>
          Reset to defaults
        </button>
      </header>

      <ul className="space-y-3">
        {DEFAULT_SCOPES.map((scope) => {
          const checked = selection[scope.id]

          return (
            <li
              key={scope.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-border bg-card/60 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{scope.label}</span>
                  {scope.mandatory ? (
                    <span className="badge badge-sm badge-primary" aria-label="Mandatory scope">
                      Required
                    </span>
                  ) : null}
                  {scope.disabled ? (
                    <span className="badge badge-sm" aria-label="Scope unavailable">
                      Unavailable
                    </span>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">{scope.description}</p>
              </div>

              <div className="flex items-center">
                <Checkbox
                  checked={checked}
                  disabled={scope.mandatory || scope.disabled}
                  onCheckedChange={(value) => handleToggle(scope, value)}
                  aria-label={`${scope.label} scope`}
                  className="h-5 w-5 border-primary data-[state=checked]:bg-primary"
                />
              </div>
            </li>
          )
        })}
      </ul>

      <aside
        className="rounded-md border border-dashed border-border bg-base-100/80 p-4 text-sm"
        aria-live="polite"
        data-testid="scope-summary"
      >
        <p className="font-medium">Selected scopes ({selectedScopes.length})</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          {selectedScopes.map((scope) => (
            <li key={scope.id}>{scope.label}</li>
          ))}
        </ul>
      </aside>
    </section>
  )
}
