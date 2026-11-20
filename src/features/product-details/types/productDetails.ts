import type { ImageRef } from '@/shared/types/image'
import type { Money } from '@/shared/types/money'

/** `GET /api/v1/products/{slug}` (active products only). */
export type ProductDetailsResponse = {
  id: string
  slug: string
  name: string
  description: string | null
  brand: string | null
  images: ImageRef[]
  price: Money | null
  salePrice: Money | null
  category: {
    slug: string
    name: string
  }
}
