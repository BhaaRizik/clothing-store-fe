import { useMutation, useQueryClient } from '@tanstack/react-query'
import { removeCartItem } from '../api/cartApi'
import { applyCartResponse, syncCartAfterError } from './cartCache'

export function useRemoveCartItem(cartId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (variantId: string) => removeCartItem(cartId, variantId),
    onSuccess: (cart) => applyCartResponse(queryClient, cart),
    onError: (error) => syncCartAfterError(queryClient, error, cartId),
  })
}
