import { Link, useParams } from 'react-router-dom'

import { getProvider, Provider } from '@/lib/providers/provider-registry.js'

// R-BUILD-23: Provider settings page shows the selected provider with a placeholder panel.
export const ProviderSettingsPage = () => {
  const { id } = useParams<{ id: string }>()
  const provider: Provider | undefined = id ? getProvider(id) : undefined

  if (!id || !provider) {
    return (
      <section aria-live="polite">
        <h2>Provider not found</h2>
        <p>The provider you are looking for does not exist in the registry.</p>
      </section>
    )
  }

  return (
    <section aria-labelledby="provider-settings-heading" className="space-y-6">
      <nav className="breadcrumbs text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>Provider</li>
          <li>Settings</li>
        </ul>
      </nav>

      <header className="rounded-lg border border-border bg-card/40 p-4">
        <h1 id="provider-settings-heading" className="text-xl font-semibold leading-tight">
          {provider.name}
        </h1>
        <p className="text-sm text-muted-foreground">Manage configuration for this provider.</p>
      </header>
      <div className="rounded-lg border border-dashed border-muted-foreground p-6">
        <h3 className="text-lg font-medium">Provider preferences</h3>
        <p className="text-sm text-muted-foreground">Settings will live here.</p>
      </div>
    </section>
  )
}
