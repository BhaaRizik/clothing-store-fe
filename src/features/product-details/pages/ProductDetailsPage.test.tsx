import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { addCartItem, createCart, getCart } from '@/features/cart/api/cartApi'
import { writeCartId } from '@/features/cart/utils/cartIdStorage'
import { CART_ID, cartError, makeCart, makeCartItem } from '@/test/cart'
import { ApiError } from '@/shared/api/apiError'
import { countH1, deferred, ils, invalidSlug, notFound, serverError } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { variant } from '@/test/variants'
import { getProductDetails } from '../api/productDetailsApi'
import type { ProductDetailsResponse } from '../types/productDetails'
import { ProductDetailsPage } from './ProductDetailsPage'

vi.mock('../api/productDetailsApi')
vi.mock('@/features/cart/api/cartApi')

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

  it('shows the not-found state for a malformed slug the backend rejects with 400', async () => {
    vi.mocked(getProductDetails).mockRejectedValue(invalidSlug())
    renderPage('Bad_Slug')

    expect(await screen.findByRole('heading', { level: 1, name: 'Product not found' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(countH1()).toBe(1)
  })

  it('shows an error with retry for other failures', async () => {
    vi.mocked(getProductDetails).mockRejectedValueOnce(serverError()).mockResolvedValueOnce(makeDetails())
    const { user } = renderPage()

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { level: 1 })).toHaveTextContent("We couldn't load this product")
    expect(alert).toHaveTextContent("There's a problem on our side. Please try again later.")
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
  
    it('offers an add-to-cart control but no buy or checkout control', async () => {
      vi.mocked(getProductDetails).mockResolvedValue(makeDetails({ variants: [variant('v1', 'Navy', 'S')] }))
      renderPage()

      expect(await screen.findByRole('radio', { name: 'Navy' })).toBeChecked()
      expect(availability()).toHaveTextContent('In stock')
      expect(screen.getByRole('button', { name: 'Add to cart' })).toBeEnabled()
      expect(screen.queryByRole('button', { name: /buy|purchase|checkout/i })).not.toBeInTheDocument()
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

  describe('add to cart', () => {
    const availability = () => within(screen.getByRole('region', { name: 'Product options' })).getByRole('status')
    const addButton = () => screen.getByRole('button', { name: 'Add to cart' })
    const quantity = () => screen.getByRole('group', { name: 'Quantity' })
    const addedCart = makeCart({ items: [makeCartItem({ variantId: 'v3', quantity: 2 })], itemCount: 2 })

    async function renderReady() {
      vi.mocked(getProductDetails).mockResolvedValue(makeDetails())
      const result = renderPage()
      await screen.findByRole('heading', { level: 1, name: 'Linen Shirt' })
      return result
    }

    it('shows the missing-selection message and sends no request when an option is missing', async () => {
      const { user } = await renderReady()

      await user.click(addButton())
      expect(screen.getByRole('alert')).toHaveTextContent('Select a color and size')

      await user.click(screen.getByRole('radio', { name: 'White' }))
      expect(screen.getByRole('alert')).toHaveTextContent('Select a size')
      await user.click(addButton())

      expect(createCart).not.toHaveBeenCalled()
      expect(addCartItem).not.toHaveBeenCalled()

      await user.click(screen.getByRole('radio', { name: 'M' }))
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })

    it('adds the selected variant and quantity, then confirms with a View cart link', async () => {
      vi.mocked(createCart).mockResolvedValue(makeCart())
      vi.mocked(addCartItem).mockResolvedValue(addedCart)
      vi.mocked(getCart).mockResolvedValue(addedCart)
      const { user } = await renderReady()

      await user.click(screen.getByRole('radio', { name: 'White' }))
      await user.click(screen.getByRole('radio', { name: 'M' }))
      expect(quantity()).toHaveTextContent('1')
      expect(within(quantity()).getByRole('button', { name: 'Decrease quantity' })).toHaveAttribute('aria-disabled', 'true')
      await user.click(within(quantity()).getByRole('button', { name: 'Increase quantity' }))
      await user.click(addButton())

      expect(addCartItem).toHaveBeenCalledWith(CART_ID, { variantId: 'v3', quantity: 2 })
      const status = await screen.findByText('Added to cart')
      expect(status.closest('[role="status"]')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View cart' })).toHaveAttribute('href', '/cart')
      expect(screen.getByRole('radio', { name: 'White' })).toBeChecked()
    })

    it('is busy while the request is pending and ignores repeated clicks', async () => {
      writeCartId(CART_ID)
      vi.mocked(getCart).mockResolvedValue(makeCart())
      const pending = deferred<ReturnType<typeof makeCart>>()
      vi.mocked(addCartItem).mockReturnValue(pending.promise)
      const { user } = await renderReady()
      await user.click(screen.getByRole('radio', { name: 'White' }))
      await user.click(screen.getByRole('radio', { name: 'M' }))

      await user.click(addButton())
      await user.click(addButton())

      expect(addButton()).toHaveAttribute('aria-busy', 'true')
      expect(addButton()).toHaveAttribute('aria-disabled', 'true')
      expect(screen.getByText('Adding to cart…')).toBeInTheDocument()
      expect(addCartItem).toHaveBeenCalledTimes(1)
      pending.resolve(addedCart)
      expect(await screen.findByText('Added to cart')).toBeInTheDocument()
    })

    it.each([
      [cartError(409, 'INSUFFICIENT_STOCK'), 'Not enough stock is available for the selected quantity.'],
      [cartError(409, 'VARIANT_UNAVAILABLE'), 'This option is no longer available.'],
      [cartError(409, 'CART_ITEM_LIMIT_EXCEEDED', { maxItemQuantity: 10 }), 'You can have up to 10 of this item in your cart.'],
      [cartError(409, 'CART_CONFLICT'), 'Your cart was updated at the same time. Please try again.'],
      [cartError(503, 'SERVICE_UNAVAILABLE'), "There's a problem on our side. Please try again later."],
      [cartError(500, 'INTERNAL_ERROR'), "There's a problem on our side. Please try again later."],
      [cartError(0, 'NETWORK_ERROR'), "We can't reach the server. Check your internet connection and try again."],
      [cartError(0, 'TIMEOUT'), 'The server took too long to respond. Please try again.'],
      [
        new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Bad Request',
          fieldErrors: [{ field: 'quantity', message: 'Quantity must be between 1 and 10.' }],
        }),
        'Quantity must be between 1 and 10.',
      ],
    ])('shows an error and keeps the selection when the add fails (%s)', async (error, message) => {
      writeCartId(CART_ID)
      vi.mocked(getCart).mockResolvedValue(makeCart())
      vi.mocked(addCartItem).mockRejectedValue(error)
      const { user } = await renderReady()
      await user.click(screen.getByRole('radio', { name: 'White' }))
      await user.click(screen.getByRole('radio', { name: 'M' }))

      await user.click(addButton())

      expect(await screen.findByRole('alert')).toHaveTextContent(message)
      expect(screen.getByRole('radio', { name: 'White' })).toBeChecked()
      expect(screen.getByRole('radio', { name: 'M' })).toBeChecked()
      expect(screen.queryByText('Added to cart')).not.toBeInTheDocument()
    })

    it('replaces "Added to cart" with the error when the next add fails', async () => {
      writeCartId(CART_ID)
      vi.mocked(getCart).mockResolvedValue(addedCart)
      vi.mocked(addCartItem).mockResolvedValueOnce(addedCart).mockRejectedValueOnce(cartError(503, 'SERVICE_UNAVAILABLE'))
      const { user } = await renderReady()
      await user.click(screen.getByRole('radio', { name: 'White' }))
      await user.click(screen.getByRole('radio', { name: 'M' }))

      await user.click(addButton())
      expect(await screen.findByText('Added to cart')).toBeInTheDocument()

      await user.click(addButton())

      expect(await screen.findByRole('alert')).toHaveTextContent("There's a problem on our side. Please try again later.")
      expect(screen.queryByText('Added to cart')).not.toBeInTheDocument()
      expect(screen.queryByRole('link', { name: 'View cart' })).not.toBeInTheDocument()
      expect(addCartItem).toHaveBeenCalledTimes(2)
    })

    it("shows the backend's quantity message when a first add exceeds the limit (no cart yet, so no max)", async () => {
      vi.mocked(createCart).mockResolvedValue(makeCart())
      vi.mocked(getCart).mockResolvedValue(makeCart())
      vi.mocked(addCartItem).mockRejectedValue(
        new ApiError({
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Bad Request',
          fieldErrors: [{ field: 'quantity', message: 'Quantity must be between 1 and 10.' }],
        }),
      )
      const { user } = await renderReady()
      await user.click(screen.getByRole('radio', { name: 'White' }))
      await user.click(screen.getByRole('radio', { name: 'M' }))
      const increase = within(quantity()).getByRole('button', { name: 'Increase quantity' })
      for (let i = 0; i < 10; i += 1) await user.click(increase)
      expect(quantity()).toHaveTextContent('11')
      expect(increase).toHaveAttribute('aria-disabled', 'false')

      await user.click(addButton())

      expect(addCartItem).toHaveBeenCalledWith(CART_ID, { variantId: 'v3', quantity: 11 })
      expect(await screen.findByRole('alert')).toHaveTextContent('Quantity must be between 1 and 10.')
      // The failed add created the cart, so its maximum is now known and the quantity is capped.
      await waitFor(() => expect(quantity()).toHaveTextContent('10'))
      expect(increase).toHaveAttribute('aria-disabled', 'true')
    })

    it('limits the quantity to the cart maximum', async () => {
      writeCartId(CART_ID)
      vi.mocked(getCart).mockResolvedValue(makeCart({ maxItemQuantity: 2 }))
      const { user } = await renderReady()
      await waitFor(() => expect(getCart).toHaveBeenCalled())

      const increase = within(quantity()).getByRole('button', { name: 'Increase quantity' })
      await user.click(increase)
      await waitFor(() => expect(increase).toHaveAttribute('aria-disabled', 'true'))
      expect(quantity()).toHaveTextContent('2')
    })

    it('disables the button for an out-of-stock variant', async () => {
      const { user } = await renderReady()

      await user.click(screen.getByRole('radio', { name: 'Navy' }))
      await user.click(screen.getByRole('radio', { name: 'M (out of stock)' }))

      expect(availability()).toHaveTextContent('Out of stock')
      expect(addButton()).toBeDisabled()
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
