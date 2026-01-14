import {
  Plug,
  Zap,
  Database,
  Mail,
  Calendar,
  FileText,
  Brain,
  Terminal,
  Github,
} from 'lucide-react'
import { Topbar } from '../../components/Topbar'
import '../../styles/structure.scss'
import {
  CUSTOM_API_PROVIDER,
  DOCUMENT_GENERATOR_PROVIDER,
  GITHUB_PROVIDER,
  GMAIL_PROVIDER,
  GOOGLE_CALENDAR_PROVIDER,
  WEBHOOK_PROVIDER,
} from '@/lib/providers/provider'
import { Provider, ProviderKind } from '@/lib/providers/provider.types'
import { ConnectOAuthButton } from '@/components/integration/ConnectOAuthButton'
import { ConnectApiKeyButton } from '@/components/integration/ConnectApiKeyButton'
import { ConnectKeyAndSecretButton } from '@/components/integration/ConnectApiSecretButton'
import { ConnectGitHub } from '@/components/integration/ConnectGithubButton'
import { useUser } from '@/context/userContext'

// Mock user ID for development when not logged in
const DEV_USER_ID = 'dev-user-123'

// Mock data - will be replaced with IndexedDB later
const connectedIntegrations = [
  {
    id: '1',
    name: 'Zapier',
    description: 'Connect and automate workflows across 5,000+ apps',
    icon: Zap,
    status: 'connected',
  },
  {
    id: '2',
    name: 'Database Sync',
    description: 'Bi-directional sync with external databases',
    icon: Database,
    status: 'connected',
  },
]

const integrationCategories = [
  {
    id: 'EMAIL',
    name: 'Email Service',
    icon: Mail,
    description: 'Send and manage emails',
    providers: [GMAIL_PROVIDER],
  },
  {
    id: 'GITHUB',
    name: 'GitHub',
    icon: Github,
    providers: [GITHUB_PROVIDER],
  },
  {
    id: 'CALENDAR',
    name: 'Calendar',
    icon: Calendar,
    description: 'Sync and manage events',
    providers: [GOOGLE_CALENDAR_PROVIDER],
  },
  {
    id: 'DOCUMENT',
    name: 'Document',
    icon: Brain,
    description: 'Generate documents ',
    providers: [DOCUMENT_GENERATOR_PROVIDER],
  },
  {
    id: 'WEBHOOK',
    name: 'Webhook Handler',
    icon: Plug,
    description: 'Receive and process webhooks',
    providers: [WEBHOOK_PROVIDER],
  },
]

// Helper function to render the appropriate button for each provider kind
const renderProviderButton = (provider: Provider, userId: string) => {
  switch (provider.kind) {
    case ProviderKind.OAUTH2_PKCE:
      if (provider.id === 'github') {
        return <ConnectGitHub key={provider.id} provider={provider} userId={userId} />
      }
      return <ConnectOAuthButton key={provider.id} provider={provider} userId={userId} />

    case ProviderKind.API_KEY:
      return <ConnectApiKeyButton key={provider.id} provider={provider} />

    case ProviderKind.KEY_AND_SECRET:
      return <ConnectKeyAndSecretButton key={provider.id} provider={provider} />

    default:
      return (
        <button
          key={provider.id}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg transition duration-200"
        >
          Configure {provider.name}
        </button>
      )
  }
}

export const Dashboard = () => {
  const { user } = useUser()

  // Use user email as ID, or fallback to dev ID
  const userId = user?.email || DEV_USER_ID

  return (
    <div className="page-container">
      <Topbar title="Dashboard" />
      <main className="page-content">
        <div className="content-wrapper">
          {/* Connected Integrations Section */}
          <section className="mb-10">
            <div className="section-header">
              <h2 className="text-2xl font-bold text-gray-900">Connected Integrations</h2>
              <p className="text-gray-600">Active integrations ready to use</p>
            </div>
            <div className="integrations-grid mt-6">
              {connectedIntegrations.map((integration) => {
                const IconComponent = integration.icon
                return (
                  <div
                    key={integration.id}
                    className="integration-card bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="card-header flex items-center space-x-4">
                      <div className="card-icon bg-blue-100 p-3 rounded-lg">
                        <IconComponent size={24} className="text-blue-600" />
                      </div>
                      <div>
                        <h3 className="card-title text-lg font-semibold text-gray-900">
                          {integration.name}
                        </h3>
                        <p className="card-description text-gray-600 text-sm mt-1">
                          {integration.description}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="card-status status-connected inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                        Connected
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Available Integrations Section */}
          <section>
            <div className="section-header">
              <h2 className="text-2xl font-bold text-gray-900">Available Integrations</h2>
              <p className="text-gray-600">Connect new integrations to expand functionality</p>
            </div>

            <div className="integrations-grid mt-6">
              {integrationCategories.map((category) => {
                const IconComponent = category.icon
                return (
                  <div
                    key={category.id}
                    className="integration-card bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="card-header flex items-center space-x-4 mb-4">
                      <div className="card-icon bg-gray-100 p-3 rounded-lg">
                        <IconComponent size={24} className="text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <h3 className="card-title text-lg font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="card-description text-gray-600 text-sm mt-1">
                          {category.description}
                        </p>
                      </div>
                      <span className="card-status status-available px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        Available
                      </span>
                    </div>

                    {/* Providers in this category */}
                    <div className="space-y-3 mt-6">
                      {category.providers.map((provider) => (
                        <div key={provider.id} className="provider-item">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2"></div>
                          </div>

                          {provider.about && (
                            <p className="text-xs text-gray-500 mb-3">{provider.about}</p>
                          )}

                          {/* Render the appropriate button */}
                          {renderProviderButton(provider, userId)}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
