import { Link, useParams } from 'react-router-dom'

import { getProvider, Provider } from '@/lib/providers/provider-registry.js'

// R-BUILD-22: Provider connect page shows selected provider details and a placeholder flow.
export const ProviderConnectPage = () => {
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
    <section aria-labelledby="provider-connect-heading" className="space-y-6">
      <nav className="breadcrumbs text-sm text-muted-foreground" aria-label="Breadcrumb">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>Provider</li>
          <li>Connect</li>
        </ul>
      </nav>

      <header className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card/40 p-4">
        <img
          alt={`${provider.name} logo`}
          src={provider.logo}
          className="h-12 w-12 rounded-md border border-muted bg-white object-contain p-2"
        />
        <div className="min-w-0">
          <h1 id="provider-connect-heading" className="text-xl font-semibold leading-tight">
            {provider.name}
          </h1>
          <p className="text-sm text-muted-foreground">{provider.about}</p>
        </div>
      </header>

      <article className="rounded-lg border border-dashed border-muted-foreground p-6">
        <h3 className="text-lg font-medium">Connect flow</h3>
        <p className="text-sm text-muted-foreground">Connect flow will live here.</p>
      </article>
    </section>
  )
}
