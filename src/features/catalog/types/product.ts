import type { ImageRef } from '@/shared/types/image'
import type { Money } from '@/shared/types/money'

/** Item of `GET /api/v1/products` (active products only). */
export type ProductCardResponse = {
  id: string
  slug: string
  name: string
  primaryImage: ImageRef | null
  /** May be null if the backend cannot provide a price; the UI shows "Price unavailable". */
  price: Money | null
  salePrice: Money | null
}

export type ProductSort = 'newest' | 'name' | 'price_asc' | 'price_desc'

export type ProductListParams = {
  category?: string
  featured?: boolean
  page: number
  size: number
  sort: ProductSort
}
