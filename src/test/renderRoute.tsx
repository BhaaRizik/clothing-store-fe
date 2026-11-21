import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ThemeProvider } from 'styled-components'
import { theme } from '@/shared/theme/theme'
import { CurrentLocation } from './CurrentLocation'

type RenderRouteOptions = {
  /** Route pattern the element is mounted at, e.g. `/categories/:slug`. */
  path?: string
  /** Initial URL. */
  url?: string
}

/**
 * Renders an element inside the app providers (fresh QueryClient without retries, theme, memory router).
 * Any other URL renders a probe showing the current pathname, so navigation can be asserted.
 */
export function renderRoute(element: ReactElement, { path = '/', url = path }: RenderRouteOptions = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  })
  const router = createMemoryRouter(
    [
      { path, element },
      { path: '*', element: <CurrentLocation /> },
    ],
    { initialEntries: [url] },
  )
  const user = userEvent.setup()
  const result = render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { ...result, user, router, queryClient }
}
