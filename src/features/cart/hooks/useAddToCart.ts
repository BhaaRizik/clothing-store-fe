import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api/apiError'
import { addCartItem, createCart } from '../api/cartApi'
import type { AddCartItemRequest } from '../types/cart'
import { applyCartResponse, isCartNotFound } from './cartCache'
import { cartIdStore } from './cartIdStore'
import { cartKeys } from './cartKeys'

async function createStoredCart(queryClient: QueryClient): Promise<string> {
  const cart = await createCart()
  await applyCartResponse(queryClient, cart)
  return cart.id
}

/**
 * Adds a variant to the cart, creating the cart first when there is none.
 * A stale stored id (CART_NOT_FOUND) is replaced by a new cart and the add is retried once.
 */
export function useAddToCart() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (item: AddCartItemRequest) => {
      const storedId = cartIdStore.get()
      if (storedId) {
        try {
          return await addCartItem(storedId, item)
        } catch (error) {
          if (!isCartNotFound(error)) throw error
          cartIdStore.clear(storedId)
        }
      }
      return addCartItem(await createStoredCart(queryClient), item)
    },
    onSuccess: (cart) => applyCartResponse(queryClient, cart),
    onError: (error) => {
      if (isApiError(error) && error.code === 'CART_CONFLICT') void queryClient.invalidateQueries({ queryKey: cartKeys.all })
    },
  })
}
