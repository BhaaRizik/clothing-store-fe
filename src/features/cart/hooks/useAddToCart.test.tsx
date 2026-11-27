import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { cartError, makeCart, makeCartItem } from '@/test/cart'
import { notFound } from '@/test/fixtures'
import { addCartItem, createCart, getCart } from '../api/cartApi'
import { readCartId, writeCartId } from '../utils/cartIdStorage'
import { cartKeys } from './cartKeys'
import { useAddToCart } from './useAddToCart'
import { useCart } from './useCart'

vi.mock('../api/cartApi')

const item = { variantId: 'v1', quantity: 2 }

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(() => ({ add: useAddToCart(), cart: useCart() }), { wrapper })
  return { result, queryClient }
}

describe('useAddToCart', () => {
  it('creates a cart, stores its id and adds the item when there is no cart', async () => {
    const filled = makeCart({ id: 'new-cart', items: [makeCartItem()], itemCount: 2 })
    vi.mocked(createCart).mockResolvedValue(makeCart({ id: 'new-cart' }))
    vi.mocked(addCartItem).mockResolvedValue(filled)
    vi.mocked(getCart).mockResolvedValue(filled)
    const { result, queryClient } = setup()

    await act(() => result.current.add.mutateAsync(item))

    expect(createCart).toHaveBeenCalledTimes(1)
    expect(addCartItem).toHaveBeenCalledWith('new-cart', item)
    expect(readCartId()).toBe('new-cart')
    expect(queryClient.getQueryData(cartKeys.detail('new-cart'))).toEqual(filled)
    // Consumers (e.g. the header count) see the new cart.
    await waitFor(() => expect(result.current.cart.cart?.itemCount).toBe(2))
  })

  it('adds to the stored cart without creating one', async () => {
    writeCartId('cart-1')
    const filled = makeCart({ id: 'cart-1', items: [makeCartItem()], itemCount: 2 })
    vi.mocked(getCart).mockResolvedValue(makeCart({ id: 'cart-1' }))
    vi.mocked(addCartItem).mockResolvedValue(filled)
    const { result } = setup()

    await act(() => result.current.add.mutateAsync(item))

    expect(createCart).not.toHaveBeenCalled()
    expect(addCartItem).toHaveBeenCalledWith('cart-1', item)
    await waitFor(() => expect(result.current.cart.cart).toEqual(filled))
  })

  it('recreates the cart and retries once when the stored id is stale', async () => {
    writeCartId('stale-cart')
    const filled = makeCart({ id: 'new-cart', items: [makeCartItem()], itemCount: 2 })
    vi.mocked(getCart).mockResolvedValue(filled)
    vi.mocked(createCart).mockResolvedValue(makeCart({ id: 'new-cart' }))
    vi.mocked(addCartItem).mockRejectedValueOnce(notFound('CART_NOT_FOUND')).mockResolvedValueOnce(filled)
    const { result } = setup()

    await act(() => result.current.add.mutateAsync(item))

    expect(addCartItem).toHaveBeenNthCalledWith(1, 'stale-cart', item)
    expect(addCartItem).toHaveBeenNthCalledWith(2, 'new-cart', item)
    expect(createCart).toHaveBeenCalledTimes(1)
    expect(readCartId()).toBe('new-cart')
  })

  it('does not retry more than once', async () => {
    writeCartId('stale-cart')
    vi.mocked(getCart).mockResolvedValue(makeCart({ id: 'new-cart' }))
    vi.mocked(createCart).mockResolvedValue(makeCart({ id: 'new-cart' }))
    vi.mocked(addCartItem).mockRejectedValue(notFound('CART_NOT_FOUND'))
    const { result } = setup()

    await act(() => expect(result.current.add.mutateAsync(item)).rejects.toMatchObject({ code: 'CART_NOT_FOUND' }))

    expect(addCartItem).toHaveBeenCalledTimes(2)
    expect(createCart).toHaveBeenCalledTimes(1)
  })

  it('reloads the cart after CART_CONFLICT', async () => {
    writeCartId('cart-1')
    vi.mocked(getCart).mockResolvedValue(makeCart({ id: 'cart-1' }))
    vi.mocked(addCartItem).mockRejectedValue(cartError(409, 'CART_CONFLICT'))
    const { result } = setup()
    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(1))

    await act(() => expect(result.current.add.mutateAsync(item)).rejects.toMatchObject({ code: 'CART_CONFLICT' }))

    await waitFor(() => expect(getCart).toHaveBeenCalledTimes(2))
    expect(createCart).not.toHaveBeenCalled()
    expect(readCartId()).toBe('cart-1')
  })

  it('keeps the cart id and rejects with the API error for business failures', async () => {
    writeCartId('cart-1')
    vi.mocked(getCart).mockResolvedValue(makeCart({ id: 'cart-1' }))
    vi.mocked(addCartItem).mockRejectedValue(cartError(409, 'INSUFFICIENT_STOCK'))
    const { result } = setup()

    await act(() => expect(result.current.add.mutateAsync(item)).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK' }))

    expect(createCart).not.toHaveBeenCalled()
    expect(readCartId()).toBe('cart-1')
  })
})
