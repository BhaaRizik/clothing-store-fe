import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CART_ID, cartError, makeCart, makeCartItem } from '@/test/cart'
import { countH1, deferred, ils, notFound, serverError } from '@/test/fixtures'
import { renderRoute } from '@/test/renderRoute'
import { getCart, removeCartItem, updateCartItem } from '../api/cartApi'
import type { CartResponse } from '../types/cart'
import { readCartId, writeCartId } from '../utils/cartIdStorage'
import { CartPage } from './CartPage'

vi.mock('../api/cartApi')

const shirt = makeCartItem()
const jeans = makeCartItem({
  variantId: 'v2',
  productId: 'p-2',
  productSlug: 'slim-jeans',
  productName: 'Slim Jeans',
  image: null,
  size: '32',
  color: null,
  quantity: 1,
  unitPrice: ils('199.00'),
  originalPrice: ils('249.00'),
  lineTotal: ils('199.00'),
})
const cartWith = (items = [shirt, jeans], overrides: Partial<CartResponse> = {}) =>
  // The subtotal deliberately differs from the sum of the line totals (₪498.80): only the API value may be shown.
  makeCart({ items, itemCount: items.reduce((n, i) => n + i.quantity, 0), subtotal: ils('450.00'), ...overrides })

function renderCart(cart: CartResponse | null = cartWith()) {
  if (cart) {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockResolvedValue(cart)
  }
  return renderRoute(<CartPage />, { path: '/cart' })
}

/** Renders the page and waits for the cart lines. */
async function renderLoadedCart(cart: CartResponse = cartWith()) {
  const result = renderCart(cart)
  await screen.findByRole('list', { name: 'Cart items' })
  return result
}

const line = (name: string) => {
  const heading = screen.getByRole('heading', { name })
  const row = heading.closest('li')
  if (!row) throw new Error(`No cart line for ${name}`)
  return within(row)
}

const summary = () => within(screen.getByRole('region', { name: 'Summary' }))

describe('CartPage', () => {
  it('shows a loading state while the cart loads', async () => {
    writeCartId(CART_ID)
    const pending = deferred<CartResponse>()
    vi.mocked(getCart).mockReturnValue(pending.promise)
    renderRoute(<CartPage />, { path: '/cart' })

    expect(screen.getByRole('status')).toHaveTextContent('Loading cart')
    pending.resolve(cartWith())
    expect(await screen.findByRole('heading', { level: 1, name: 'Your cart' })).toBeInTheDocument()
  })

  it('shows an error with retry', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockRejectedValueOnce(serverError()).mockResolvedValueOnce(cartWith())
    const { user } = renderRoute(<CartPage />, { path: '/cart' })

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByRole('heading', { level: 1 })).toHaveTextContent("We couldn't load your cart")
    await user.click(within(alert).getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { name: 'Linen Shirt' })).toBeInTheDocument()
    expect(getCart).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['there is no cart', null],
    ['the cart has no items', makeCart()],
  ])('shows the empty state when %s', async (_label, cart) => {
    renderCart(cart)

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Your cart' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/categories')
    expect(screen.queryByRole('region', { name: 'Summary' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument()
    expect(countH1()).toBe(1)
  })

  it('shows the empty state and drops the stored id when the cart has expired', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockRejectedValue(notFound('CART_NOT_FOUND'))
    renderRoute(<CartPage />, { path: '/cart' })

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute('href', '/categories')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(readCartId()).toBeNull()
    expect(getCart).toHaveBeenCalledTimes(1)
  })

  it('lists the lines with options, prices and line totals, and the API subtotal', async () => {
    renderCart()

    expect(await screen.findByRole('list', { name: 'Cart items' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
    expect(countH1()).toBe(1)

    const shirtLine = line('Linen Shirt')
    expect(shirtLine.getByRole('link', { name: 'Linen Shirt' })).toHaveAttribute('href', '/products/linen-shirt')
    expect(shirtLine.getByRole('img', { name: 'Linen shirt, front' })).toHaveAttribute('src', 'https://cdn.example.com/linen.jpg')
    expect(shirtLine.getByText('Size:').nextElementSibling).toHaveTextContent('M')
    expect(shirtLine.getByText('Color:').nextElementSibling).toHaveTextContent('Navy')
    expect(shirtLine.getByText('₪149.90')).toBeVisible()
    expect(shirtLine.getByText(/^Total:/)).toHaveTextContent('Total: ₪299.80')
    expect(shirtLine.getByRole('group', { name: 'Quantity for Linen Shirt' })).toHaveTextContent('2')

    // On sale: sale price with the original struck through; no color label when there is no color.
    const jeansLine = line('Slim Jeans')
    expect(jeansLine.getByText('Sale price:').parentElement).toHaveTextContent('₪199.00')
    expect(jeansLine.getByText('Original price:').parentElement?.tagName).toBe('S')
    expect(jeansLine.getByText('Original price:').parentElement).toHaveTextContent('₪249.00')
    expect(jeansLine.queryByText('Color:')).not.toBeInTheDocument()
    expect(jeansLine.getByRole('img', { name: 'No image available for Slim Jeans' })).toBeInTheDocument()

    expect(summary().getByText('Subtotal').nextElementSibling).toHaveTextContent('₪450.00')
    expect(screen.queryByText('₪498.80')).not.toBeInTheDocument()
    expect(summary().getByText('Items').nextElementSibling).toHaveTextContent('3')
    expect(summary().getByText('Shipping and taxes are calculated at checkout.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /checkout/i })).not.toBeInTheDocument()
  })

  it('marks unavailable, out-of-stock and repriced lines', async () => {
    renderCart(
      cartWith([
        makeCartItem({ variantId: 'v1', productName: 'Linen Shirt', status: 'UNAVAILABLE' }),
        makeCartItem({ variantId: 'v2', productName: 'Wool Scarf', productSlug: 'wool-scarf', status: 'INSUFFICIENT_STOCK' }),
        makeCartItem({ variantId: 'v3', productName: 'Silk Tie', productSlug: 'silk-tie', priceChanged: true }),
      ]),
    )

    await screen.findByRole('list', { name: 'Cart items' })
    const unavailable = line('Linen Shirt')
    expect(unavailable.getByText(/No longer available/).parentElement).toHaveTextContent('No longer available. Not included in the subtotal.')
    expect(unavailable.getByRole('button', { name: 'Increase quantity' })).toHaveAttribute('aria-disabled', 'true')
    expect(unavailable.getByRole('button', { name: 'Decrease quantity' })).toHaveAttribute('aria-disabled', 'true')
    expect(unavailable.getByRole('button', { name: 'Remove Linen Shirt' })).toHaveAttribute('aria-disabled', 'false')

    expect(
      line('Wool Scarf').getByText('Not enough stock for this quantity. Lower the quantity or remove the item.'),
    ).toBeInTheDocument()
    expect(line('Silk Tie').getByText('The price has changed since you added this item.')).toBeInTheDocument()
    expect(line('Wool Scarf').queryByText(/price has changed/)).not.toBeInTheDocument()
  })

  it('shows an unavailable line without a line total as excluded with price unavailable', async () => {
    await renderLoadedCart(
      cartWith([makeCartItem({ status: 'UNAVAILABLE', unitPrice: null, lineTotal: null }), jeans]),
    )

    const unavailable = line('Linen Shirt')
    expect(unavailable.getByText(/^Excluded:/)).toHaveTextContent('Excluded: Price unavailable')
    expect(unavailable.getByText(/No longer available/).parentElement).toHaveTextContent('Not included in the subtotal.')
    expect(unavailable.queryByText(/^Total:/)).not.toBeInTheDocument()
    expect(line('Slim Jeans').getByText(/^Total:/)).toHaveTextContent('Total: ₪199.00')
  })

  it('shows a placeholder name without a link when the product no longer exists', async () => {
    renderCart(
      cartWith([
        makeCartItem({
          productName: null,
          productSlug: null,
          image: null,
          size: null,
          color: null,
          unitPrice: null,
          lineTotal: null,
          status: 'UNAVAILABLE',
        }),
      ]),
    )

    const heading = await screen.findByRole('heading', { name: 'Item no longer available' })
    expect(within(heading).queryByRole('link')).not.toBeInTheDocument()
    const row = line('Item no longer available')
    expect(row.queryByText('Size:')).not.toBeInTheDocument()
    expect(row.queryByText(/null/)).not.toBeInTheDocument()
    expect(row.getByRole('button', { name: 'Remove Item no longer available' })).toBeInTheDocument()
  })

  it('sends the absolute quantity when increasing or decreasing', async () => {
    const { user } = await renderLoadedCart()
    vi.mocked(updateCartItem).mockResolvedValueOnce(
      cartWith([{ ...shirt, quantity: 3, lineTotal: ils('449.70') }, jeans], { subtotal: ils('648.70') }),
    )

    await user.click(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' }))

    expect(updateCartItem).toHaveBeenCalledWith(CART_ID, 'v1', { quantity: 3 })
    await waitFor(() => expect(line('Linen Shirt').getByRole('group', { name: /Quantity/ })).toHaveTextContent('3'))
    expect(line('Linen Shirt').getByText(/^Total:/)).toHaveTextContent('₪449.70')
    expect(summary().getByText('Subtotal').nextElementSibling).toHaveTextContent('₪648.70')

    vi.mocked(updateCartItem).mockResolvedValueOnce(cartWith())
    await user.click(line('Linen Shirt').getByRole('button', { name: 'Decrease quantity' }))
    expect(updateCartItem).toHaveBeenLastCalledWith(CART_ID, 'v1', { quantity: 2 })
  })

  it('disables decrease at 1 and increase at the cart maximum', async () => {
    const { user } = await renderLoadedCart(cartWith([shirt, { ...jeans, quantity: 10 }], { maxItemQuantity: 10 }))

    const increase = line('Slim Jeans').getByRole('button', { name: 'Increase quantity' })
    expect(increase).toHaveAttribute('aria-disabled', 'true')
    expect(line('Slim Jeans').getByRole('button', { name: 'Decrease quantity' })).toHaveAttribute('aria-disabled', 'false')
    expect(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' })).toHaveAttribute('aria-disabled', 'false')
    await user.click(increase)
    expect(updateCartItem).not.toHaveBeenCalled()
  })

  it('never removes a line when decreasing at quantity 1', async () => {
    const { user } = await renderLoadedCart(cartWith([{ ...shirt, quantity: 1 }]))

    const decrease = line('Linen Shirt').getByRole('button', { name: 'Decrease quantity' })
    expect(decrease).toHaveAttribute('aria-disabled', 'true')
    await user.click(decrease)
    expect(updateCartItem).not.toHaveBeenCalled()
    expect(removeCartItem).not.toHaveBeenCalled()
  })

  it('removes lines and shows the empty state after the last removal', async () => {
    const { user } = await renderLoadedCart()
    vi.mocked(removeCartItem)
      .mockResolvedValueOnce(cartWith([jeans], { subtotal: ils('199.00') }))
      .mockResolvedValueOnce(makeCart())

    await user.click(await screen.getByRole('button', { name: 'Remove Linen Shirt' }))
    expect(removeCartItem).toHaveBeenCalledWith(CART_ID, 'v1')
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Linen Shirt' })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1, name: 'Your cart' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Remove Slim Jeans' }))
    expect(removeCartItem).toHaveBeenLastCalledWith(CART_ID, 'v2')
    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
  })

  it('keeps the server quantity and shows an error when an update fails', async () => {
    const { user } = await renderLoadedCart()
    vi.mocked(updateCartItem).mockRejectedValue(cartError(409, 'INSUFFICIENT_STOCK'))

    await user.click(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' }))

    expect(await line('Linen Shirt').findByRole('alert')).toHaveTextContent(
      'Not enough stock is available for the selected quantity.',
    )
    expect(line('Linen Shirt').getByRole('group', { name: /Quantity/ })).toHaveTextContent('2')
    expect(line('Slim Jeans').queryByRole('alert')).not.toBeInTheDocument()
  })

  it('refetches the cart after a conflict', async () => {
    const { user } = await renderLoadedCart()
    vi.mocked(updateCartItem).mockRejectedValue(cartError(409, 'CART_CONFLICT'))

    await user.click(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' }))

    expect(await line('Linen Shirt').findByRole('alert')).toHaveTextContent(
      'Your cart was updated at the same time. Please try again.',
    )
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(2))
  })

  it.each([
    ['an update', 'Increase quantity'],
    ['a removal', 'Remove Linen Shirt'],
  ])('drops the expired cart and shows the empty state when %s returns CART_NOT_FOUND', async (_label, button) => {
    const { user } = await renderLoadedCart()
    vi.mocked(updateCartItem).mockRejectedValue(notFound('CART_NOT_FOUND'))
    vi.mocked(removeCartItem).mockRejectedValue(notFound('CART_NOT_FOUND'))

    await user.click(line('Linen Shirt').getByRole('button', { name: button }))

    expect(await screen.findByRole('heading', { name: 'Your cart is empty' })).toBeInTheDocument()
    expect(readCartId()).toBeNull()
    expect(getCart).toHaveBeenCalledTimes(1)
  })

  it.each([
    [notFound('CART_ITEM_NOT_FOUND'), 'This item is no longer in your cart.'],
    [cartError(409, 'CART_CONFLICT'), 'Your cart was updated at the same time. Please try again.'],
  ])('shows an alert and refetches the cart when a removal fails (%s)', async (error, message) => {
    const { user } = await renderLoadedCart()
    vi.mocked(removeCartItem).mockRejectedValue(error)

    await user.click(line('Linen Shirt').getByRole('button', { name: 'Remove Linen Shirt' }))

    expect(removeCartItem).toHaveBeenCalledWith(CART_ID, 'v1')
    expect(await line('Linen Shirt').findByRole('alert')).toHaveTextContent(message)
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(2))
    expect(readCartId()).toBe(CART_ID)
  })

  it('marks the line busy and ignores further clicks while an update is pending', async () => {
    const { user } = await renderLoadedCart()
    const pending = deferred<CartResponse>()
    vi.mocked(updateCartItem).mockReturnValue(pending.promise)

    await user.click(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' }))
    await user.click(line('Linen Shirt').getByRole('button', { name: 'Increase quantity' }))
    await user.click(line('Linen Shirt').getByRole('button', { name: 'Remove Linen Shirt' }))

    expect(screen.getByRole('heading', { name: 'Linen Shirt' }).closest('li')).toHaveAttribute('aria-busy', 'true')
    expect(updateCartItem).toHaveBeenCalledTimes(1)
    expect(removeCartItem).not.toHaveBeenCalled()
    pending.resolve(cartWith())
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: 'Linen Shirt' }).closest('li')).toHaveAttribute('aria-busy', 'false'),
    )
  })
})
