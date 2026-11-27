import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../api/apiError'
import { theme } from '../theme/theme'
import { ErrorState } from './ErrorState'

function renderErrorState(props: Partial<Parameters<typeof ErrorState>[0]> = {}) {
  const onRetry = vi.fn()
  render(
    <ThemeProvider theme={theme}>
      <ErrorState title="We couldn't load the products" onRetry={onRetry} {...props} />
    </ThemeProvider>,
  )
  return { onRetry, user: userEvent.setup() }
}

describe('ErrorState', () => {
  it('blames the server, not the connection, for server failures', () => {
    renderErrorState({ error: new ApiError({ status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Unavailable' }) })

    const alert = screen.getByRole('alert')
    expect(within(alert).getByRole('heading')).toHaveTextContent("We couldn't load the products")
    expect(alert).toHaveTextContent("There's a problem on our side. Please try again later.")
    expect(alert).not.toHaveTextContent(/connection/i)
  })

  it('says the server cannot be reached for network failures', () => {
    renderErrorState({ error: new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Unable to reach the server.' }) })

    expect(screen.getByRole('alert')).toHaveTextContent(
      "We can't reach the server. Check your internet connection and try again.",
    )
  })

  it('says the server took too long for timeouts', () => {
    renderErrorState({ error: new ApiError({ status: 0, code: 'TIMEOUT', message: 'The request timed out.' }) })

    expect(screen.getByRole('alert')).toHaveTextContent('The server took too long to respond. Please try again.')
  })

  it('uses the kind of failure as the title when none is given', () => {
    renderErrorState({ title: undefined, error: new ApiError({ status: 500, code: 'INTERNAL_ERROR', message: 'Boom' }) })

    expect(within(screen.getByRole('alert')).getByRole('heading')).toHaveTextContent('Something went wrong on our side')
  })

  it('keeps an explicit description and extra actions', () => {
    renderErrorState({
      description: 'Custom description.',
      error: new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'x' }),
      actions: <a href="/categories">Browse categories</a>,
    })

    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('Custom description.')
    expect(alert).not.toHaveTextContent(/reach the server/)
    expect(within(alert).getByRole('link', { name: 'Browse categories' })).toBeInTheDocument()
  })

  it('offers a keyboard-reachable retry', async () => {
    const { onRetry, user } = renderErrorState({ error: new ApiError({ status: 500, code: 'HTTP_500', message: 'x' }) })

    await user.tab()
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
  })
})
