import { expect, describe, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'

import { appRouter } from './app-router'
import { UserProvider } from './context/userContext'

const renderWithRoute = (initialEntry: string) => {
  const router = createMemoryRouter(appRouter.routes, { initialEntries: [initialEntry] })
  return render(
    <UserProvider>
      <RouterProvider router={router} />
    </UserProvider>,
  )
}

describe('appRouter', () => {
  it('renders the home page for the root path', () => {
    renderWithRoute('/')

    expect(screen.getByText('Massivoto integrations')).toBeInTheDocument()
  })

  /*
  it('renders the provider connect page', () => {
    renderWithRoute('/providers/openai/connect');

    const provider = getProvider('openai');
    if (!provider) {
      throw new Error('Expected the openai provider fixture to be present');
    }

    const breadcrumb = screen.getByLabelText('Breadcrumb');
    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByText('Provider')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Connect')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: provider.name })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: `${provider.name} logo` })).toHaveAttribute(
      'src',
      provider.logo,
    );
    expect(screen.getByText(provider.about)).toBeInTheDocument();
    expect(screen.getByText('Connect flow will live here.')).toBeInTheDocument();
  });

  it('renders the provider settings page', () => {
    renderWithRoute('/providers/openai/settings');

    const provider = getProvider('openai');
    if (!provider) {
      throw new Error('Expected the openai provider fixture to be present');
    }

    const breadcrumb = screen.getByLabelText('Breadcrumb');
    expect(within(breadcrumb).getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/');
    expect(within(breadcrumb).getByText('Provider')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Settings')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: provider.name })).toBeInTheDocument();
    expect(screen.getByText('Settings will live here.')).toBeInTheDocument();
  });

  it('renders the not found page for unknown routes', () => {
    renderWithRoute('/does-not-exist');

    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

   */
})
