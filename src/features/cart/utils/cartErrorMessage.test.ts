import { describe, expect, it } from 'vitest'
import { ApiError } from '@/shared/api/apiError'
import { cartError } from '@/test/cart'
import { cartErrorMessage, GENERIC_CART_ERROR } from './cartErrorMessage'

describe('cartErrorMessage', () => {
  it.each([
    ['INSUFFICIENT_STOCK', 'Not enough stock is available for the selected quantity.'],
    ['VARIANT_UNAVAILABLE', 'This option is no longer available.'],
    ['CART_CONFLICT', 'Your cart was updated at the same time. Please try again.'],
    ['CART_ITEM_NOT_FOUND', 'This item is no longer in your cart.'],
    ['CART_NOT_FOUND', GENERIC_CART_ERROR],
    ['NETWORK_ERROR', GENERIC_CART_ERROR],
  ])('maps %s', (code, message) => {
    expect(cartErrorMessage(cartError(409, code))).toBe(message)
  })

  it('uses the limit from the problem details, then the cart limit', () => {
    expect(cartErrorMessage(cartError(409, 'CART_ITEM_LIMIT_EXCEEDED', { maxItemQuantity: 5 }), 10)).toBe(
      'You can have up to 5 of this item in your cart.',
    )
    expect(cartErrorMessage(cartError(409, 'CART_ITEM_LIMIT_EXCEEDED'), 10)).toBe(
      'You can have up to 10 of this item in your cart.',
    )
    expect(cartErrorMessage(cartError(409, 'CART_ITEM_LIMIT_EXCEEDED'))).toBe(
      'You have reached the maximum quantity for this item.',
    )
  })

  it('shows the quantity field error for validation errors', () => {
    const error = new ApiError({
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Bad Request',
      fieldErrors: [
        { field: 'variantId', message: 'Variant id is required.' },
        { field: 'quantity', message: 'Quantity must be between 1 and 10.' },
      ],
    })
    expect(cartErrorMessage(error)).toBe('Quantity must be between 1 and 10.')
    expect(cartErrorMessage(new ApiError({ status: 400, code: 'VALIDATION_ERROR', message: 'Bad Request' }))).toBe(
      GENERIC_CART_ERROR,
    )
  })

  it('falls back to a generic message for non-API errors', () => {
    expect(cartErrorMessage(new Error('boom'))).toBe(GENERIC_CART_ERROR)
  })
})
