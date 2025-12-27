import { Link } from 'react-router-dom'

type ProviderCardProps = {
  id: string
  name: string
  logo: string
  about: string
}

// R-BUILD-41: Provider summary card with quick actions.
export const ProviderCard = ({ id, name, logo, about }: ProviderCardProps) => (
  <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm">
    <header className="flex items-center gap-4">
      <img
        alt={`${name} logo`}
        src={logo}
        className="h-12 w-12 rounded-md border border-muted bg-white object-contain p-2"
      />
      <div className="min-w-0">
        <h3 className="text-lg font-semibold leading-tight">{name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{about}</p>
      </div>
    </header>

    <footer className="flex flex-wrap gap-2">
      <Link
        className="btn btn-primary btn-sm"
        to={`/providers/${id}/connect`}
        aria-label={`Connect to ${name}`}
      >
        Connect
      </Link>
      <Link
        className="btn btn-outline btn-sm"
        to={`/providers/${id}/settings`}
        aria-label={`View ${name} settings`}
      >
        Settings
      </Link>
    </footer>
  </article>
)
