import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CategoryResponse } from '@/features/categories'
import { getCategory } from '@/features/categories/api/categoryApi'
import { ApiError } from '@/shared/api/apiError'
import type { PageResponse } from '@/shared/types/page'
import { countH1, deferred, invalidSlug, makeCategory, notFound, serverError } from '@/test/fixtures'
import { makeProducts, productPage } from '@/test/products'
import { renderRoute } from '@/test/renderRoute'
import { getProducts } from '../api/productApi'
import type { ProductCardResponse } from '../types/product'
import { CategoryProductsPage } from './CategoryProductsPage'

vi.mock('@/features/categories/api/categoryApi')
vi.mock('../api/productApi')

const renderPage = (slug = 'women') =>
  renderRoute(<CategoryProductsPage />, { path: '/categories/:slug', url: `/categories/${slug}` })

describe('CategoryProductsPage', () => {
  it('shows the category header and its product cards', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 2), 0, 2))
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Women' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: 'Product 1' })).toHaveAttribute('href', '/products/product-1')
    expect(screen.getByRole('link', { name: 'Product 2' })).toBeInTheDocument()
    expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    expect(getCategory).toHaveBeenCalledWith('women')
    expect(getProducts).toHaveBeenCalledWith({ category: 'women', page: 0, size: 20, sort: 'newest' })
  })

  it('uses a heading hierarchy without skipped levels and a single h1', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 1), 0, 1))
    renderPage()

    await screen.findByRole('link', { name: 'Product 1' })
    expect(countH1()).toBe(1)
    const section = screen.getByRole('region', { name: 'Products' })
    expect(within(section).getByRole('heading', { level: 2, name: 'Products' })).toBeInTheDocument()
    expect(within(section).getByRole('heading', { level: 3, name: 'Product 1' })).toBeInTheDocument()
  })

  it('shows loading states for the category and then for its products', async () => {
    const category = deferred<CategoryResponse>()
    const products = deferred<PageResponse<ProductCardResponse>>()
    vi.mocked(getCategory).mockReturnValue(category.promise)
    vi.mocked(getProducts).mockReturnValue(products.promise)
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading category')
    expect(getProducts).not.toHaveBeenCalled()

    await act(async () => category.resolve(makeCategory()))
    expect(await screen.findByRole('heading', { level: 1, name: 'Women' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Loading products')

    await act(async () => products.resolve(productPage(makeProducts(1, 1), 0, 1)))
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(screen.queryByText('Loading products')).not.toBeInTheDocument()
  })

  it('shows an empty state with a link to other categories, without a count or "Load more"', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage([], 0, 0))
    renderPage()

    expect(await screen.findByRole('heading', { name: 'No products in this category yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse other categories' })).toHaveAttribute('href', '/categories')
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    expect(screen.queryByText(/^Showing/)).not.toBeInTheDocument()
    expect(countH1()).toBe(1)
  })

  it('shows a not-found state (as the page h1) for an unknown category slug', async () => {
    vi.mocked(getCategory).mockRejectedValue(notFound('CATEGORY_NOT_FOUND'))
    renderPage('does-not-exist')

    expect(await screen.findByRole('heading', { level: 1, name: 'Category not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse all categories' })).toHaveAttribute('href', '/categories')
    expect(getProducts).not.toHaveBeenCalled()
    expect(countH1()).toBe(1)
  })

  it('shows the not-found state for a malformed category slug the backend rejects with 400', async () => {
    vi.mocked(getCategory).mockRejectedValue(invalidSlug())
    renderPage('Bad_Slug')

    expect(await screen.findByRole('heading', { level: 1, name: 'Category not found' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(getProducts).not.toHaveBeenCalled()
    expect(countH1()).toBe(1)
  })

  it('shows the not-found state when the product list rejects the category filter with 400', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockRejectedValue(invalidSlug('category'))
    renderPage()

    expect(await screen.findByRole('heading', { level: 2, name: 'Category not found' })).toBeInTheDocument()
  })

  it('shows an error, not "not found", when the product list rejects another parameter with 400', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts).mockRejectedValue(invalidSlug('page'))
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the products")
    expect(screen.queryByRole('heading', { name: 'Category not found' })).not.toBeInTheDocument()
  })

  it('shows an error when the category request fails, then recovers on retry', async () => {
    vi.mocked(getCategory).mockRejectedValueOnce(serverError()).mockResolvedValueOnce(makeCategory())
    vi.mocked(getProducts).mockResolvedValue(productPage(makeProducts(1, 1), 0, 1))
    const { user } = renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { level: 1 })).toHaveTextContent("We couldn't load this category")
    expect(getProducts).not.toHaveBeenCalled()

    await user.click(within(alert).getByRole('button', { name: 'Try again' }))

    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(getCategory).toHaveBeenCalledTimes(2)
    expect(getProducts).toHaveBeenCalledTimes(1)
  })

  it('shows an error with retry when products fail to load', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts)
      .mockRejectedValueOnce(serverError())
      .mockResolvedValueOnce(productPage(makeProducts(1, 1), 0, 1))
    const { user } = renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load the products")
    expect(screen.getByRole('alert')).toHaveTextContent("There's a problem on our side. Please try again later.")
    expect(countH1()).toBe(1)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(getProducts).toHaveBeenCalledTimes(2)
  })

  it('loads the next page with "Load more", focuses the first new card and hides the button on the last page', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts)
      .mockResolvedValueOnce(productPage(makeProducts(1, 20), 0, 25))
      .mockResolvedValueOnce(productPage(makeProducts(21, 5), 1, 25))
    const { user } = renderPage()

    expect(await screen.findByText('Showing 20 of 25 products')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Load more' }))

    const firstNew = await screen.findByRole('link', { name: 'Product 21' })
    await waitFor(() => expect(firstNew).toHaveFocus())
    expect(screen.getByRole('link', { name: 'Product 25' })).toBeInTheDocument()
    expect(screen.getByText('Showing 25 of 25 products')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    expect(getProducts).toHaveBeenLastCalledWith({ category: 'women', page: 1, size: 20, sort: 'newest' })
  })

  it('keeps the button focusable with aria-disabled while loading and ignores repeated clicks', async () => {
    const nextPage = deferred<PageResponse<ProductCardResponse>>()
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts)
      .mockResolvedValueOnce(productPage(makeProducts(1, 20), 0, 40))
      .mockReturnValueOnce(nextPage.promise)
    const { user } = renderPage()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))
    const loadingButton = screen.getByRole('button', { name: 'Loading…' })
    expect(loadingButton).toHaveAttribute('aria-disabled', 'true')
    expect(loadingButton).toBeEnabled()
    expect(loadingButton).toHaveFocus()

    await user.click(loadingButton)
    await user.click(loadingButton)
    expect(getProducts).toHaveBeenCalledTimes(2)

    await act(async () => nextPage.resolve(productPage(makeProducts(21, 20), 1, 40)))
    await waitFor(() => expect(screen.getByRole('link', { name: 'Product 21' })).toHaveFocus())
  })

  it.each([
    [serverError(), "We couldn't load more products. There's a problem on our side. Please try again later."],
    [
      new ApiError({ status: 0, code: 'NETWORK_ERROR', message: 'Unable to reach the server.' }),
      "We couldn't load more products. We can't reach the server. Check your internet connection and try again.",
    ],
  ])('explains why "Load more" failed (%s) and keeps the retry', async (error, message) => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts)
      .mockResolvedValueOnce(productPage(makeProducts(1, 20), 0, 25))
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(productPage(makeProducts(21, 5), 1, 25))
    const { user } = renderPage()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    await user.click(screen.getByRole('button', { name: 'Load more' }))
    expect(await screen.findByRole('link', { name: 'Product 25' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('keeps loaded items when "Load more" fails and recovers on the next attempt', async () => {
    vi.mocked(getCategory).mockResolvedValue(makeCategory())
    vi.mocked(getProducts)
      .mockResolvedValueOnce(productPage(makeProducts(1, 20), 0, 25))
      .mockRejectedValueOnce(serverError())
      .mockResolvedValueOnce(productPage(makeProducts(21, 5), 1, 25))
    const { user } = renderPage()

    await user.click(await screen.findByRole('button', { name: 'Load more' }))

    expect(await screen.findByRole('alert')).toHaveTextContent("We couldn't load more products")
    expect(screen.getByRole('link', { name: 'Product 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Product 20' })).toBeInTheDocument()
    expect(screen.getByText('Showing 20 of 25 products')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Load more' }))

    expect(await screen.findByRole('link', { name: 'Product 25' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.getByText('Showing 25 of 25 products')).toBeInTheDocument()
    expect(getProducts).toHaveBeenCalledTimes(3)
  })

  it('keeps the category and products when a background refetch fails', async () => {
    vi.mocked(getCategory).mockResolvedValueOnce(makeCategory()).mockRejectedValue(serverError())
    vi.mocked(getProducts)
      .mockResolvedValueOnce(productPage(makeProducts(1, 2), 0, 2))
      .mockRejectedValue(serverError())
    const { queryClient } = renderPage()
    expect(await screen.findByRole('link', { name: 'Product 1' })).toBeInTheDocument()

    await act(() => queryClient.refetchQueries())

    expect(await screen.findAllByText("We couldn't refresh this page. Showing the last loaded information.")).not.toHaveLength(0)
    expect(getCategory).toHaveBeenCalledTimes(2)
    expect(getProducts).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { level: 1, name: 'Women' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Product 2' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
