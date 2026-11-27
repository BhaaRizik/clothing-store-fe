import { describe, expect, it, vi } from 'vitest'
import { httpClient } from '@/shared/api/httpClient'
import { makeCart } from '@/test/cart'
import { addCartItem, createCart, getCart, removeCartItem, updateCartItem } from './cartApi'

vi.mock('@/shared/api/httpClient', () => ({
  httpClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

const header = { headers: { 'X-Cart-Id': 'cart-1' } }

describe('cartApi', () => {
  it('calls the cart endpoints with the X-Cart-Id header and returns the cart', async () => {
    const cart = makeCart()
    for (const method of ['get', 'post', 'patch', 'delete'] as const) {
      vi.mocked(httpClient[method]).mockResolvedValue({ data: cart })
    }

    await expect(createCart()).resolves.toEqual(cart)
    expect(httpClient.post).toHaveBeenCalledWith('/cart')

    await getCart('cart-1')
    expect(httpClient.get).toHaveBeenCalledWith('/cart', header)

    await addCartItem('cart-1', { variantId: 'v1', quantity: 2 })
    expect(httpClient.post).toHaveBeenLastCalledWith('/cart/items', { variantId: 'v1', quantity: 2 }, header)

    await updateCartItem('cart-1', 'v/1 2', { quantity: 3 })
    expect(httpClient.patch).toHaveBeenCalledWith('/cart/items/v%2F1%202', { quantity: 3 }, header)

    await removeCartItem('cart-1', 'v/1')
    expect(httpClient.delete).toHaveBeenCalledWith('/cart/items/v%2F1', header)
  })
})
