import { act, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { countH1, ils, notFound, serverError } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { getProductDetails } from '../api/productDetailsApi'
import type { ProductDetailsResponse } from '../types/productDetails'
import { ProductDetailsPage } from './ProductDetailsPage'

vi.mock('../api/productDetailsApi')

function makeDetails(overrides: Partial<ProductDetailsResponse> = {}): ProductDetailsResponse {
  return {
    id: 'p-1',
    slug: 'linen-shirt',
    name: 'Linen Shirt',
    description: 'Breathable linen shirt for warm days.',
    brand: 'Northwind',
    images: [
      { url: 'https://cdn.example.com/linen-front.jpg', alt: 'Linen shirt, front' },
      { url: 'https://cdn.example.com/linen-back.jpg', alt: 'Linen shirt, back' },
    ],
    price: ils('149.90'),
    salePrice: ils('119.90'),
    category: { slug: 'men', name: 'Men' },
    ...overrides,
  }
}

const renderPage = (slug = 'linen-shirt') =>
  renderRoute(<ProductDetailsPage />, { path: '/products/:slug', url: `/products/${slug}` })

describe('ProductDetailsPage', () => {
  it('shows the product details with a link back to its category', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails())
    const { user } = renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Loading product')
    expect(await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(countH1()).toBe(1)
    expect(screen.getByText('Northwind')).toBeInTheDocument()
    expect(screen.getByText('Breathable linen shirt for warm days.')).toBeInTheDocument()
    expect(screen.getByText('Sale price:')).toBeInTheDocument()
    expect(screen.getByText('₪119.90')).toBeVisible()
    expect(screen.getByText('Original price:')).toBeInTheDocument()
    expect(screen.getByText('₪149.90')).toBeVisible()
    expect(screen.getByRole('link', { name: 'Back to Men' })).toHaveAttribute('href', '/categories/men')
    expect(screen.getByRole('img', { name: 'Linen shirt, front' })).toBeInTheDocument()
    expect(getProductDetails).toHaveBeenCalledWith('linen-shirt')

    await user.click(screen.getByRole('button', { name: 'Show image 2 of 2' }))
    expect(screen.getByRole('img', { name: 'Linen shirt, back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 2 of 2' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a fallback image when the product has no images', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ images: [], salePrice: null, brand: null }))
    renderPage()

    expect(await screen.findByRole('img', { name: 'No image available for Linen Shirt' })).toBeInTheDocument()
    expect(screen.getByText('₪149.90')).toBeVisible()
    expect(screen.queryByText('Original price:')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show image/i })).not.toBeInTheDocument()
  })

  it.each([
    ['empty', ''],
    ['whitespace-only', '  '],
    ['null', null],
  ])('uses the product name as alt text when the image alt is %s', async (_label, alt) => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ images: [{ url: 'https://cdn.example.com/a.jpg', alt }] }))
    renderPage()

    expect(await screen.findByRole('img', { name: 'Linen Shirt' })).toHaveAttribute('src', 'https://cdn.example.com/a.jpg')
  })

  it('shows a fallback for an image with a null url', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ images: [{ url: null, alt: 'Linen shirt' }] }))
    renderPage()

    expect(await screen.findByRole('img', { name: 'No image available for Linen Shirt' })).toBeInTheDocument()
  })

  it.each([
    ['null', null],
    ['empty', ''],
    ['whitespace-only', '   '],
  ])('renders without a description paragraph when the description is %s', async (_label, description) => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ description }))
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByText('Breathable linen shirt for warm days.')).not.toBeInTheDocument()
    expect(screen.queryByText(/null/)).not.toBeInTheDocument()
  })

  it('shows "Price unavailable" when the price is null', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ price: null, salePrice: null }))
    renderPage()

    expect(await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.getByText('Price unavailable')).toBeVisible()
  })

  it('shows a not-found state (as the page h1) for an unknown product slug', async () => {
    vi.mocked(getProductDetails).mockRejectedValue(notFound('PRODUCT_NOT_FOUND'))
    renderPage('missing')

    expect(await screen.findByRole('heading', { level: 1, name: 'Product not found' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse categories' })).toHaveAttribute('href', '/categories')
    expect(countH1()).toBe(1)
  })

  it('shows an error with retry for other failures', async () => {
    vi.mocked(getProductDetails).mockRejectedValueOnce(serverError()).mockResolvedValueOnce(makeDetails())
    const { user } = renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { level: 1 })).toHaveTextContent("We couldn't load this product")
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(getProductDetails).toHaveBeenCalledTimes(2)
  })

  it('keeps the product when a background refetch fails', async () => {
    vi.mocked(getProductDetails).mockResolvedValueOnce(makeDetails()).mockRejectedValueOnce(notFound('PRODUCT_NOT_FOUND'))
    const { queryClient } = renderPage()
    expect(await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()

    await act(() => queryClient.refetchQueries())

    expect(await screen.findByRole('status')).toHaveTextContent("We couldn't refresh this page")
    expect(getProductDetails).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Product not found' })).not.toBeInTheDocument()
  })
})
