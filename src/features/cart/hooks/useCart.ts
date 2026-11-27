import { skipToken, useQuery } from '@tanstack/react-query'
import { getCart } from '../api/cartApi'
import type { CartResponse } from '../types/cart'
import { isCartNotFound } from './cartCache'
import { cartIdStore, useCartId } from './cartIdStore'
import { cartKeys } from './cartKeys'

/** An unknown or expired cart is not an error: the stored id is dropped and the cart is empty. */
async function fetchCart(cartId: string): Promise<CartResponse | null> {
  try {
    return await getCart(cartId)
  } catch (error) {
    if (!isCartNotFound(error)) throw error
    cartIdStore.clear(cartId)
    return null
  }
}

/** The current cart. Without a stored cart id no request is made and the cart is empty (`cart: null`). */
export function useCart() {
  const cartId = useCartId()
  const query = useQuery({
    queryKey: cartKeys.detail(cartId),
    queryFn: cartId ? () => fetchCart(cartId) : skipToken,
    // Line status and prices must be current, and the cart may change in another tab.
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

  return {
    cart: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    isError: query.isError,
    isRefetchError: query.isRefetchError,
    refetch: query.refetch,
  }
}
