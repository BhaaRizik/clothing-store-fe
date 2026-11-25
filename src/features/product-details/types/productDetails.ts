import type { ImageRef } from '@/shared/types/image'
import type { Money } from '@/shared/types/money'

/** A product-details image; `color` null = applies to every color, otherwise equals a variant `color.name`. */
export type ProductImage = ImageRef & {
  color: string | null
}

export type ProductColor = {
  name: string
  hexCode: string | null
}

/** An active, purchasable combination. Stock counts are never sent, only `available`. */
export type ProductVariant = {
  id: string
  size: string | null
  color: ProductColor | null
  available: boolean
}

/** `GET /api/v1/products/{slug}` (active products only). */
export type ProductDetailsResponse = {
  id: string
  slug: string
  name: string
  description: string | null
  brand: string | null
  /** The first image is the default. */
  images: ProductImage[]
  price: Money | null
  salePrice: Money | null
  category: {
    slug: string
    name: string
  }
  /** Never null; only active variants, ordered so sizes appear in size order. */
  variants: ProductVariant[]
}
