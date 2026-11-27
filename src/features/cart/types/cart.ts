import type { ImageRef } from '@/shared/types/image'
import type { Money } from '@/shared/types/money'

/** `UNAVAILABLE` lines are excluded from the subtotal; `INSUFFICIENT_STOCK` lines exceed current stock. */
export type CartItemStatus = 'AVAILABLE' | 'INSUFFICIENT_STOCK' | 'UNAVAILABLE'

export type CartItemColor = {
  name: string
  hexCode: string | null
}

/** A cart line for one variant. Product fields are null only when the product/variant no longer exists. */
export type CartItem = {
  variantId: string
  productId: string
  productSlug: string | null
  productName: string | null
  image: ImageRef | null
  size: string | null
  color: CartItemColor | null
  quantity: number
  /** Sale price when on sale, otherwise the base price. */
  unitPrice: Money | null
  /** Base price when on sale, otherwise null. */
  originalPrice: Money | null
  lineTotal: Money | null
  status: CartItemStatus
  /** The current price differs from the price when the item was added. */
  priceChanged: boolean
}

/** All totals are computed by the backend; the frontend only displays them. */
export type CartResponse = {
  id: string
  items: CartItem[]
  itemCount: number
  subtotal: Money
  maxItemQuantity: number
}

export type AddCartItemRequest = {
  variantId: string
  quantity: number
}

export type UpdateCartItemRequest = {
  quantity: number
}
