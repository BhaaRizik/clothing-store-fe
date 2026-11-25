import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { countH1, ils, notFound, serverError } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { variant } from '@/test/variants'
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
      { url: 'https://cdn.example.com/linen-front.jpg', alt: 'Linen shirt, front', color: null },
      { url: 'https://cdn.example.com/linen-back.jpg', alt: 'Linen shirt, back', color: null },
    ],
    price: ils('149.90'),
    salePrice: ils('119.90'),
    category: { slug: 'men', name: 'Men' },
    variants: [variant('v1', 'Navy', 'S'), variant('v2', 'Navy', 'M', false), variant('v3', 'White', 'M')],
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

    await user.click(screen.getByRole('button', { name: 'Show image 2 of 2: Linen shirt, back' }))
    expect(screen.getByRole('img', { name: 'Linen shirt, back' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show image 2 of 2: Linen shirt, back' })).toHaveAttribute('aria-pressed', 'true')
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
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ images: [{ url: 'https://cdn.example.com/a.jpg', alt, color: null }] }))
    renderPage()

    expect(await screen.findByRole('img', { name: 'Linen Shirt' })).toHaveAttribute('src', 'https://cdn.example.com/a.jpg')
  })

  it('shows a fallback for an image with a null url', async () => {
    vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ images: [{ url: null, alt: 'Linen shirt', color: null }] }))
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

    expect(await screen.findByText(/We couldn't refresh this page/)).toHaveAttribute('role', 'status')
    expect(getProductDetails).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('heading', { level: 1, name: 'Linen Shirt' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Product not found' })).not.toBeInTheDocument()
  })

  describe('variants', () => {
    const availability = () => within(screen.getByRole('region', { name: 'Product options' })).getByRole('status')

    it('shows the variant selector under the price and the availability of the chosen combination', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(makeDetails())
      const { user } = renderPage()

      expect(await screen.findByRole('group', { name: 'Color' })).toBeInTheDocument()
      expect(availability()).toHaveTextContent('Select a color and size')
      expect(screen.queryByText('Out of stock')).not.toBeInTheDocument()

      await user.click(screen.getByRole('radio', { name: 'White' }))
      expect(screen.getByRole('radio', { name: 'S' })).toBeDisabled()
      await user.click(screen.getByRole('radio', { name: 'M' }))
      expect(availability()).toHaveTextContent('In stock')

      await user.click(screen.getByRole('radio', { name: 'Navy' }))
      await user.click(screen.getByRole('radio', { name: 'M (out of stock)' }))
      expect(availability()).toHaveTextContent('Out of stock')
    })

    it('shows an "Out of stock" badge when every variant is unavailable', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(
        makeDetails({ variants: [variant('v1', 'Navy', 'S', false), variant('v2', 'Navy', 'M', false)] }),
      )
      renderPage()

      expect(await screen.findByText('Out of stock', { selector: 'p:not([role])' })).toBeVisible()
      expect(screen.getByRole('radio', { name: 'S (out of stock)' })).toBeEnabled()
    })

    it('shows "Currently unavailable" and no selectors when the product has no variants', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ variants: [] }))
      renderPage()

      expect(await screen.findByText('Currently unavailable')).toBeVisible()
      expect(screen.queryByRole('radio')).not.toBeInTheDocument()
      expect(screen.queryByRole('group')).not.toBeInTheDocument()
      expect(screen.queryByText('Out of stock')).not.toBeInTheDocument()
    })

    it('resets the selection when navigating to another product', async () => {
      vi.mocked(getProductDetails).mockImplementation(async (slug) =>
        slug === 'linen-shirt' ? makeDetails() : makeDetails({ id: 'p-2', slug, name: 'Cotton Shirt' }),
      )
      const { user, router } = renderPage()
      await user.click(await screen.findByRole('radio', { name: 'Navy' }))
      expect(screen.getByRole('radio', { name: 'Navy' })).toBeChecked()

      await act(() => router.navigate('/products/cotton-shirt'))

      expect(await screen.findByRole('heading', { level: 1, name: 'Cotton Shirt' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Navy' })).not.toBeChecked()
      expect(availability()).toHaveTextContent('Select a color and size')
    })
  
    it('offers no add-to-cart or buy control (the cart arrives with SCRUM-24)', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ variants: [variant('v1', 'Navy', 'S')] }))
      renderPage()

      expect(await screen.findByRole('radio', { name: 'Navy' })).toBeChecked()
      expect(availability()).toHaveTextContent('In stock')
      expect(screen.queryByRole('button', { name: /add to (cart|bag)|buy|purchase|checkout/i })).not.toBeInTheDocument()
    })

    it('updates the availability of the selected variant after a refetch while keeping the selection', async () => {
      vi.mocked(getProductDetails)
        .mockResolvedValueOnce(makeDetails())
        .mockResolvedValueOnce(makeDetails({ variants: [variant('v1', 'Navy', 'S', false), variant('v3', 'White', 'M')] }))
      const { user, queryClient } = renderPage()
      await user.click(await screen.findByRole('radio', { name: 'Navy' }))
      await user.click(screen.getByRole('radio', { name: 'S' }))
      expect(availability()).toHaveTextContent('In stock')

      await act(() => queryClient.refetchQueries())

      await waitFor(() => expect(availability()).toHaveTextContent('Out of stock'))
      expect(screen.getByRole('radio', { name: 'Navy (out of stock)' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'S (out of stock)' })).toBeChecked()
      expect(getProductDetails).toHaveBeenCalledTimes(2)
    })
  })

  describe('gallery follows the selected color', () => {
    const img = (name: string, color: string | null) => ({ url: `https://cdn.example.com/${name}.jpg`, alt: name, color })
    const colorful = makeDetails({
      images: [img('Shirt in White, front', 'White'), img('Shirt in Light blue, front', 'Light blue'), img('Shirt in White, back', 'White'), img('Fabric detail', null)],
      variants: [variant('v1', 'White', 'S'), variant('v2', 'Light blue', 'S'), variant('v3', 'Navy', 'S')],
    })
    const mainImage = () => screen.getAllByRole('img')[0]
    const thumbnails = () => screen.queryAllByRole('button', { name: /^Show image/ })

    it('shows all images until a color is selected, then the color images followed by untagged ones', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(colorful)
      const { user } = renderPage()

      expect(await screen.findByRole('img', { name: 'Shirt in White, front' })).toBe(mainImage())
      expect(thumbnails()).toHaveLength(4)

      await user.click(screen.getByRole('radio', { name: 'White' }))
      expect(mainImage()).toHaveAccessibleName('Shirt in White, front')
      expect(thumbnails()).toHaveLength(3)

      await user.click(screen.getByRole('button', { name: 'Show image 2 of 3: Shirt in White, back' }))
      expect(mainImage()).toHaveAccessibleName('Shirt in White, back')

      await user.click(screen.getByRole('radio', { name: 'Light blue' }))
      expect(mainImage()).toHaveAccessibleName('Shirt in Light blue, front')
      expect(mainImage()).toHaveAttribute('src', 'https://cdn.example.com/Shirt in Light blue, front.jpg')
      expect(thumbnails()).toHaveLength(2)
      expect(screen.getByRole('button', { name: 'Show image 1 of 2: Shirt in Light blue, front' })).toHaveAttribute('aria-pressed', 'true')
      expect(screen.getByRole('button', { name: 'Show image 2 of 2: Fabric detail' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('keeps the full gallery for a color without tagged images', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(colorful)
      const { user } = renderPage()

      await user.click(await screen.findByRole('radio', { name: 'Navy' }))

      expect(mainImage()).toHaveAccessibleName('Shirt in White, front')
      expect(thumbnails()).toHaveLength(4)
    })

    it('shows the matching image immediately for a single-color product', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(
        makeDetails({
          images: [img('Fabric detail', null), img('Shirt in Red, front', 'Red')],
          variants: [variant('v1', 'Red', 'S'), variant('v2', 'Red', 'M')],
        }),
      )
      renderPage()

      expect(await screen.findByRole('radio', { name: 'Red' })).toBeChecked()
      expect(mainImage()).toHaveAccessibleName('Shirt in Red, front')
    })
  
    it('resets to the first image when a color without tagged images is selected after picking a thumbnail', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(colorful)
      const { user } = renderPage()
      await user.click(await screen.findByRole('button', { name: 'Show image 3 of 4: Shirt in White, back' }))
      expect(mainImage()).toHaveAccessibleName('Shirt in White, back')

      await user.click(screen.getByRole('radio', { name: 'Navy' }))

      expect(mainImage()).toHaveAccessibleName('Shirt in White, front')
      expect(screen.getByRole('button', { name: 'Show image 1 of 4: Shirt in White, front' })).toHaveAttribute('aria-pressed', 'true')
    })

    it('falls back to the full default gallery when a refetch removes the selected color', async () => {
      vi.mocked(getProductDetails)
        .mockResolvedValueOnce(colorful)
        .mockResolvedValueOnce({ ...colorful, variants: [variant('v1', 'White', 'S'), variant('v3', 'Navy', 'S')] })
      const { user, queryClient } = renderPage()
      await user.click(await screen.findByRole('radio', { name: 'Light blue' }))
      expect(mainImage()).toHaveAccessibleName('Shirt in Light blue, front')

      await act(() => queryClient.refetchQueries())

      await waitFor(() => expect(mainImage()).toHaveAccessibleName('Shirt in White, front'))
      expect(thumbnails()).toHaveLength(4)
      expect(screen.queryByRole('radio', { name: 'Light blue' })).not.toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'White' })).not.toBeChecked()
    })

    it("shows the new product's default image after navigating to another product", async () => {
      vi.mocked(getProductDetails).mockImplementation(async (slug) =>
        slug === 'linen-shirt'
          ? colorful
          : makeDetails({ id: 'p-2', slug, name: 'Cotton Shirt', images: [img('Cotton front', null), img('Cotton back', null)] }),
      )
      const { user, router } = renderPage()
      await user.click(await screen.findByRole('button', { name: 'Show image 3 of 4: Shirt in White, back' }))

      await act(() => router.navigate('/products/cotton-shirt'))

      expect(await screen.findByRole('heading', { level: 1, name: 'Cotton Shirt' })).toBeInTheDocument()
      expect(mainImage()).toHaveAccessibleName('Cotton front')
      expect(screen.getByRole('button', { name: 'Show image 1 of 2: Cotton front' })).toHaveAttribute('aria-pressed', 'true')
    })
  })
})
