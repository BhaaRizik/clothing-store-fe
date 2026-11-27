import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { CART_ID, makeCart, makeCartItem } from '@/test/cart'
import { notFound, serverError } from '@/test/fixtures'
import { getCart } from '../api/cartApi'
import { readCartId, writeCartId } from '../utils/cartIdStorage'
import { useCart } from './useCart'

vi.mock('../api/cartApi')

function renderUseCart() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return renderHook(() => useCart(), { wrapper })
}

describe('useCart', () => {
  it('makes no request and is an empty cart without a stored id', () => {
    const { result } = renderUseCart()

    expect(result.current).toMatchObject({ cart: null, isLoading: false, isError: false })
    expect(getCart).not.toHaveBeenCalled()
  })

  it('loads the cart for the stored id', async () => {
    writeCartId(CART_ID)
    const cart = makeCart({ items: [makeCartItem()], itemCount: 2 })
    vi.mocked(getCart).mockResolvedValue(cart)
    const { result } = renderUseCart()

    await waitFor(() => expect(result.current.cart).toEqual(cart))
    expect(getCart).toHaveBeenCalledWith(CART_ID)
  })

  it('clears the stored id and treats CART_NOT_FOUND as an empty cart', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockRejectedValue(notFound('CART_NOT_FOUND'))
    const { result } = renderUseCart()

    await waitFor(() => expect(readCartId()).toBeNull())
    expect(result.current).toMatchObject({ cart: null, isLoading: false, isError: false })
    expect(getCart).toHaveBeenCalledTimes(1)
  })

  it('reports other failures as errors and keeps the id', async () => {
    writeCartId(CART_ID)
    vi.mocked(getCart).mockRejectedValue(serverError())
    const { result } = renderUseCart()

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(readCartId()).toBe(CART_ID)
  })
})
