import { isApiError } from '@/shared/api/apiError'

export const GENERIC_CART_ERROR = 'Something went wrong. Please try again.'

const MESSAGES: Record<string, string> = {
  INSUFFICIENT_STOCK: 'Not enough stock is available for the selected quantity.',
  VARIANT_UNAVAILABLE: 'This option is no longer available.',
  CART_ITEM_NOT_FOUND: 'This item is no longer in your cart.',
  CART_CONFLICT: 'Your cart was updated at the same time. Please try again.',
}

const asLimit = (value: unknown): number | null =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null

/**
 * User-facing message for a failed cart request, by the backend's stable error code.
 * `fallbackMaxQuantity` (the cart's `maxItemQuantity`) is used when the error doesn't carry the limit.
 */
export function cartErrorMessage(error: unknown, fallbackMaxQuantity?: number | null): string {
  if (!isApiError(error)) return GENERIC_CART_ERROR

  if (error.code === 'CART_ITEM_LIMIT_EXCEEDED') {
    const limit = asLimit(error.extensions.maxItemQuantity) ?? asLimit(fallbackMaxQuantity)
    return limit
      ? `You can have up to ${limit} of this item in your cart.`
      : 'You have reached the maximum quantity for this item.'
  }
  // The backend's quantity message is a readable sentence (e.g. "Quantity must be between 1 and 10.") shown verbatim.
  if (error.code === 'VALIDATION_ERROR') {
    return error.fieldErrors.find((fieldError) => fieldError.field === 'quantity')?.message ?? GENERIC_CART_ERROR
  }
  return MESSAGES[error.code] ?? GENERIC_CART_ERROR
}
