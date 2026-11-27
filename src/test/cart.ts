import type { CartItem, CartResponse } from '@/features/cart'
import { ApiError } from '@/shared/api/apiError'
import { ils } from './fixtures'

export const CART_ID = '3f0c6a2e-8d1b-4a57-9e0f-2b7c1d4e5a60'

export function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    variantId: 'v1',
    productId: 'p-1',
    productSlug: 'linen-shirt',
    productName: 'Linen Shirt',
    image: { url: 'https://cdn.example.com/linen.jpg', alt: 'Linen shirt, front' },
    size: 'M',
    color: { name: 'Navy', hexCode: '#1f2a44' },
    quantity: 2,
    unitPrice: ils('149.90'),
    originalPrice: null,
    lineTotal: ils('299.80'),
    status: 'AVAILABLE',
    priceChanged: false,
    ...overrides,
  }
}

export function makeCart(overrides: Partial<CartResponse> = {}): CartResponse {
  return {
    id: CART_ID,
    items: [],
    itemCount: 0,
    subtotal: ils('0.00'),
    maxItemQuantity: 10,
    ...overrides,
  }
}

export const cartError = (status: number, code: string, extensions: Record<string, unknown> = {}) =>
  new ApiError({ status, code, message: code, extensions })
