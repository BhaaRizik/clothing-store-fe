import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateCartItem } from '../api/cartApi'
import { applyCartResponse, syncCartAfterError } from './cartCache'

type UpdateCartItemVariables = {
  variantId: string
  /** The new absolute quantity. */
  quantity: number
}

/** Not optimistic: the line keeps showing the last server-confirmed quantity until the response arrives. */
export function useUpdateCartItem(cartId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ variantId, quantity }: UpdateCartItemVariables) => updateCartItem(cartId, variantId, { quantity }),
    onSuccess: (cart) => applyCartResponse(queryClient, cart),
    onError: (error) => syncCartAfterError(queryClient, error, cartId),
  })
}
