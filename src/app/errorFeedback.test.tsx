import { screen, waitFor, within } from '@testing-library/react'
import { AxiosError, AxiosHeaders, type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CartPage } from '@/features/cart/pages/CartPage'
import { writeCartId } from '@/features/cart/utils/cartIdStorage'
import { CategoryListPage } from '@/features/categories/pages/CategoryListPage'
import { ProductDetailsPage } from '@/features/product-details/pages/ProductDetailsPage'
import { httpClient } from '@/shared/api/httpClient'
import { CART_ID, makeCart, makeCartItem } from '@/test/cart'
import { ils, makeCategory } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'

/*
 * SCRUM-42 end-to-end on the client: the real pages, hooks, API modules, httpClient and toApiError run unchanged.
 * Only the HTTP transport is replaced. Error bodies are copied from the running backend (feature/SCRUM-42).
 */

type Reply =
  | { status: number; body: unknown; contentType?: string }
  | { networkError: 'timeout' | 'offline' }

type Route = { method: string; url: string; replies: Reply[] }

const problem = (status: number, title: string, detail: string, code: string, extra: Record<string, unknown> = {}) => ({
  detail,
  status,
  title,
  type: 'about:blank',
  code,
  ...extra,
})

const BACKEND = {
  serviceUnavailable: problem(
    503,
    'Service unavailable',
    'The service is temporarily unavailable. Please try again later.',
    'SERVICE_UNAVAILABLE',
  ),
  internalError: problem(500, 'Internal server error', 'An unexpected error occurred. Please try again later.', 'INTERNAL_ERROR'),
  productNotFound: problem(404, 'Resource not found', 'Product not found.', 'PRODUCT_NOT_FOUND'),
  routeNotFound: problem(404, 'Route not found', 'The requested endpoint does not exist.', 'ROUTE_NOT_FOUND'),
  insufficientStock: problem(
    409,
    'Conflict',
    'Not enough stock is available for the requested quantity.',
    'INSUFFICIENT_STOCK',
  ),
  quantityOutOfRange: problem(400, 'Validation failed', 'One or more request parameters are invalid.', 'VALIDATION_ERROR', {
    errors: [{ field: 'quantity', message: 'Quantity must be between 1 and 10.' }],
  }),
}

let routes: Route[] = []
const calls: string[] = []
const originalAdapter = httpClient.defaults.adapter

const respond = (route: Route) => {
  routes.push(route)
}

const fakeBackend: AxiosAdapter = (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toUpperCase()
  const url = config.url ?? ''
  calls.push(`${method} ${url}`)
  const route = routes.find((candidate) => candidate.method === method && candidate.url === url)
  if (!route) throw new Error(`Unexpected request ${method} ${url}`)
  const reply = route.replies.length > 1 ? route.replies.shift()! : route.replies[0]

  if ('networkError' in reply) {
    const code = reply.networkError === 'timeout' ? AxiosError.ECONNABORTED : AxiosError.ERR_NETWORK
    return Promise.reject(new AxiosError(reply.networkError, code, config, {}))
  }
  const ok = reply.status < 400
  const response: AxiosResponse = {
    data: JSON.stringify(reply.body),
    status: reply.status,
    statusText: '',
    headers: new AxiosHeaders({
      'Content-Type': reply.contentType ?? (ok ? 'application/json' : 'application/problem+json'),
    }),
    config,
    request: {},
  }
  if (config.validateStatus?.(reply.status)) return Promise.resolve(response)
  return Promise.reject(
    new AxiosError(`Request failed with status code ${reply.status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response),
  )
}

beforeEach(() => {
  routes = []
  calls.length = 0
  httpClient.defaults.adapter = fakeBackend
})

afterEach(() => {
  httpClient.defaults.adapter = originalAdapter
})

const countCalls = (call: string) => calls.filter((c) => c === call).length

describe('SCRUM-42 error feedback with real backend error responses', () => {
  describe('page load failures', () => {
    it.each([
      ['a 503 SERVICE_UNAVAILABLE', { status: 503, body: BACKEND.serviceUnavailable }, "There's a problem on our side. Please try again later."],
      ['a 500 INTERNAL_ERROR', { status: 500, body: BACKEND.internalError }, "There's a problem on our side. Please try again later."],
      ['the server being unreachable', { networkError: 'offline' }, "We can't reach the server. Check your internet connection and try again."],
      ['a timeout', { networkError: 'timeout' }, 'The server took too long to respond. Please try again.'],
      ['a 404 ROUTE_NOT_FOUND', { status: 404, body: BACKEND.routeNotFound }, 'Something unexpected happened. Please try again.'],
    ] as [string, Reply, string][])('shows the matching error after %s and recovers on Try again', async (_label, failure, message) => {
      respond({
        method: 'GET',
        url: '/categories',
        replies: [failure, { status: 200, body: [makeCategory()] }],
      })
      const { user } = renderRoute(<CategoryListPage />, { path: '/categories' })

      const alert = await screen.findByRole('alert')
      expect(alert).toHaveTextContent("We couldn't load the categories")
      expect(alert).toHaveTextContent(message)
      expect(screen.queryByRole('list')).not.toBeInTheDocument()

      await user.click(within(alert).getByRole('button', { name: 'Try again' }))

      expect(await screen.findByRole('link', { name: 'Women' })).toBeInTheDocument()
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('shows "Product not found" for the backend PRODUCT_NOT_FOUND response, not a generic error', async () => {
      respond({ method: 'GET', url: '/products/gone-shirt', replies: [{ status: 404, body: BACKEND.productNotFound }] })
      renderRoute(<ProductDetailsPage />, { path: '/products/:slug', url: '/products/gone-shirt' })

      expect(await screen.findByRole('heading', { level: 1, name: 'Product not found' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    })
  })

  describe('cart changes', () => {
    const shirt = makeCartItem({ quantity: 2, lineTotal: ils('299.80') })
    const loadedCart = makeCart({ items: [shirt], itemCount: 2, subtotal: ils('299.80') })
    const itemUrl = `/cart/items/${encodeURIComponent(shirt.variantId)}`
    const quantity = () => screen.getByRole('group', { name: /Quantity/ })

    async function renderLoadedCart(getReplies: Reply[], patchReply: Reply) {
      writeCartId(CART_ID)
      respond({ method: 'GET', url: '/cart', replies: getReplies })
      respond({ method: 'PATCH', url: itemUrl, replies: [patchReply] })
      const result = renderRoute(<CartPage />, { path: '/cart' })
      await screen.findByRole('list', { name: 'Cart items' })
      return result
    }

    it.each([
      ['a 500 INTERNAL_ERROR', { status: 500, body: BACKEND.internalError }, "There's a problem on our side"],
      ['a 503 SERVICE_UNAVAILABLE', { status: 503, body: BACKEND.serviceUnavailable }, "There's a problem on our side"],
      ['a timeout', { networkError: 'timeout' }, 'took too long'],
      ['the server being unreachable', { networkError: 'offline' }, "can't reach the server"],
    ] as [string, Reply, string][])(
      'after %s the cart is reloaded from the server and no success is shown',
      async (_label, failure, message) => {
        const appliedOnServer = makeCart({ items: [{ ...shirt, quantity: 3, lineTotal: ils('449.70') }], itemCount: 3, subtotal: ils('449.70') })
        const { user } = await renderLoadedCart([{ status: 200, body: loadedCart }, { status: 200, body: appliedOnServer }], failure)

        await user.click(screen.getByRole('button', { name: 'Increase quantity' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(new RegExp(message, 'i'))
        await waitFor(() => expect(countCalls('GET /cart')).toBe(2))
        await waitFor(() => expect(quantity()).toHaveTextContent('3'))
        expect(screen.queryByText(/updated|success/i)).not.toBeInTheDocument()
      },
    )

    it.each([
      ['409 INSUFFICIENT_STOCK', { status: 409, body: BACKEND.insufficientStock }, 'Not enough stock is available for the selected quantity.'],
      ['400 VALIDATION_ERROR', { status: 400, body: BACKEND.quantityOutOfRange }, 'Quantity must be between 1 and 10.'],
    ] as [string, Reply, string][])(
      'a business rejection (%s) shows its own message and keeps the confirmed quantity',
      async (_label, failure, message) => {
        const { user } = await renderLoadedCart([{ status: 200, body: loadedCart }], failure)

        await user.click(screen.getByRole('button', { name: 'Increase quantity' }))

        expect(await screen.findByRole('alert')).toHaveTextContent(message)
        expect(quantity()).toHaveTextContent('2')
        expect(screen.queryByText(/updated|success/i)).not.toBeInTheDocument()
      },
    )
  })
})
