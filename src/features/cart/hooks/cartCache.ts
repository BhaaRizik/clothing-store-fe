import type { QueryClient } from '@tanstack/react-query'
import { isApiError } from '@/shared/api/apiError'
import { isOutcomeUnknown } from '@/shared/api/errorCopy'
import type { CartResponse } from '../types/cart'
import { cartIdStore } from './cartIdStore'
import { cartKeys } from './cartKeys'

export const isCartNotFound = (error: unknown): boolean => isApiError(error) && error.code === 'CART_NOT_FOUND'

/** Stores a server-confirmed cart. An in-flight refetch is cancelled so it cannot overwrite the newer response. */
export async function applyCartResponse(queryClient: QueryClient, cart: CartResponse): Promise<void> {
  await queryClient.cancelQueries({ queryKey: cartKeys.detail(cart.id) })
  queryClient.setQueryData(cartKeys.detail(cart.id), cart)
  cartIdStore.set(cart.id)
}

/**
 * After a failed cart mutation: an expired cart is dropped (the cart shows as empty);
 * other 404/409 answers mean the cart changed on the server, so it is refetched. After a network, timeout or
 * server failure the server may still have applied the change, so the cart is refetched to show confirmed state.
 */
export function syncCartAfterError(queryClient: QueryClient, error: unknown, cartId: string): void {
  if (!isApiError(error)) return
  if (isCartNotFound(error)) {
    cartIdStore.clear(cartId)
    return
  }
  if (error.status === 404 || error.status === 409 || isOutcomeUnknown(error)) {
    void queryClient.invalidateQueries({ queryKey: cartKeys.detail(cartId) })
  }
}
