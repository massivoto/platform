import { Provider, ProviderKind } from './provider.types'

export const GMAIL_PROVIDER: Provider = {
  id: 'google-gmail',
  name: 'Gmail',
  kind: ProviderKind.OAUTH2_PKCE,
  categories: ['EMAIL'],
  scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/gmail.readonly'],
  logo: '',
  about: '',
}

export const GOOGLE_CALENDAR_PROVIDER: Provider = {
  id: 'google-calendar',
  name: 'Google Calendar',
  kind: ProviderKind.OAUTH2_PKCE,
  categories: ['CALENDAR'],
  scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
  logo: '',
  about: '',
}

export const DOCUMENT_GENERATOR_PROVIDER: Provider = {
  id: 'document-generator',
  name: 'Document Generator',
  kind: ProviderKind.API_KEY,
  categories: ['DOCUMENT'],
  scopes: [], // pas de scopes sans OAuth
  logo: '',
  about: 'Generate documents programmatically (PDF, DOCX, etc.)',
}

export const WEBHOOK_PROVIDER: Provider = {
  id: 'webhook',
  name: 'Webhook',
  kind: ProviderKind.KEY_AND_SECRET,
  categories: ['WEBHOOK'],
  scopes: [],
  logo: '',
  about: 'Receive and verify webhook events',
}

export const CUSTOM_API_PROVIDER: Provider = {
  id: 'custom-api',
  name: 'Custom API Service',
  logo: '',
  about: 'A custom API service using OAuth2 Client Credentials',
  scopes: ['api:read', 'api:write', 'data:access'],
  kind: ProviderKind.OAUTH2_CLIENT_CREDENTIALS,
  categories: ['DOCUMENT'],
}

// export const OPENAI_PROVIDER: Provider = {
//   id: 'openai',
//   name: 'OpenAI',
//   logo: '/logos/openai.svg',
//   about: 'Access GPT models for text generation',
//   scopes: ['models:read', 'completions:create'],
//   kind: ProviderKind.API_KEY,
//   categories: ['DOCUMENT'],
// }

// export const ANTHROPIC_PROVIDER: Provider = {
//   id: 'anthropic',
//   name: 'Anthropic',
//   logo: '/logos/anthropic.svg',
//   about: 'Access Claude AI models',
//   scopes: ['messages:create', 'models:read'],
//   kind: ProviderKind.API_KEY,
//   categories: ['DOCUMENT'],
// }
