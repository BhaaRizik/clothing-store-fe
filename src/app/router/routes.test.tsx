import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { ThemeProvider } from 'styled-components'
import { describe, expect, it, vi } from 'vitest'
import { getProducts } from '@/features/catalog/api/productApi'
import { getCategories, getCategory } from '@/features/categories/api/categoryApi'
import { getPromotions } from '@/features/home/api/promotionApi'
import { getProductDetails } from '@/features/product-details/api/productDetailsApi'
import { theme } from '@/shared/theme/theme'
import { countH1, ils, makeCategory, notFound } from '@/test/fixtures'
import { makeProducts, productPage } from '@/test/products'
import { routes } from './routes'

vi.mock('@/features/categories/api/categoryApi')
vi.mock('@/features/catalog/api/productApi')
vi.mock('@/features/product-details/api/productDetailsApi')
vi.mock('@/features/home/api/promotionApi')

/** Renders the real route table (layout, lazy feature routes, not-found). */
function renderApp(url: string) {
  const router = createMemoryRouter(routes, { initialEntries: [url] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const user = userEvent.setup()
  render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <RouterProvider router={router} />
      </ThemeProvider>
    </QueryClientProvider>,
  )
  return { router, user }
}

const productDetails = {
  id: 'p-1',
  slug: 'product-1',
  name: 'Product 1',
  description: 'A product',
  brand: null,
  images: [],
  price: ils('50.00'),
  salePrice: null,
  category: { slug: 'women', name: 'Women' },
  variants: [],
}

describe('app routes', () => {
  it('renders the layout and the homepage at /', async () => {
    vi.mocked(getPromotions).mockResolvedValue([])
    vi.mocked(getCategories).mockResolvedValue([makeCategory()])
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 1), 0, 1, 8))
    renderApp('/')

    expect(await screen.findByRole('heading', { level: 1, name: 'Welcome to Clothing Store' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Clothing Store' })).toHaveAttribute('href', '/')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(nav).toContainElement(screen.getByRole('link', { name: 'Categories' }))
    expect(await screen.findByRole('link', { name: 'Women' })).toHaveAttribute('href', '/categories/women')
    expect(await screen.findByRole('link', { name: 'Product 1' })).toHaveAttribute('href', '/products/product-1')
    expect(screen.getByRole('link', { name: 'View all categories' })).toHaveAttribute('href', '/categories')
    expect(countH1()).toBe(1)
  })

  it('renders the category list at /categories', async () => {
    vi.mocked(getCategories).mockResolvedValue([makeCategory()])
    renderApp('/categories')

    expect(await screen.findByRole('heading', { level: 1, name: 'Shop by category' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Women' })).toHaveAttribute('href', '/categories/women')
    expect(screen.getByRole('link', { name: 'Categories' })).toHaveAttribute('aria-current', 'page')
    expect(countH1()).toBe(1)
  })

  it('renders the product listing at /categories/:slug', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 1), 0, 1))
    renderApp('/categories/women')

    expect(await screen.findByRole('heading', { level: 1, name: 'Women' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Product 1' })).toHaveAttribute('href', '/products/product-1')
    expect(getCategory).toHaveBeenCalledWith('women')
    expect(countH1()).toBe(1)
  })

  it('renders the product details at /products/:slug', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(productDetails)
    renderApp('/products/product-1')

    expect(await screen.findByRole('heading', { level: 1, name: 'Product 1' })).toBeInTheDocument()
    expect(getProductDetails).toHaveBeenCalledWith('product-1')
    expect(countH1()).toBe(1)
  })

  it('navigates categories → listing → details through real links', async () => {
    vi.mocked(getCategories).mockResolvedValue([makeCategory()])
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 1), 0, 1))
    vi.mocked(getProductDetails).mockResolvedValue(productDetails)
    const { router, user } = renderApp('/categories')

    await user.click(await screen.findByRole('link', { name: 'Women' }))
    await user.click(await screen.findByRole('link', { name: 'Product 1' }))

    expect(await screen.findByRole('link', { name: 'Back to Women' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/products/product-1')
    expect(countH1()).toBe(1)
  })

  it.each([
    ['/categories/unknown', 'Category not found'],
    ['/products/unknown', 'Product not found'],
  ])('renders a single not-found h1 at %s', async (url, title) => {
    vi.mocked(getCategory).mockRejectedValue(notFound('CATEGORY_NOT_FOUND'))
    vi.mocked(getProductDetails).mockRejectedValue(notFound('PRODUCT_NOT_FOUND'))
    renderApp(url)

    expect(await screen.findByRole('heading', { level: 1, name: title })).toBeInTheDocument()
    expect(countH1()).toBe(1)
  })

  it('renders a not-found page for unknown URLs', async () => {
    renderApp('/no-such-page')

    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute('href', '/categories')
    expect(countH1()).toBe(1)
  })
})
