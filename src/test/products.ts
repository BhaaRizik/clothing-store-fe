import type { ProductCardResponse } from '@/features/catalog/types/product'
import type { PageResponse } from '@/shared/types/page'
import { ils } from './fixtures'

export function makeProduct(overrides: Partial<ProductCardResponse> = {}): ProductCardResponse {
  return {
    id: 'p-1',
    slug: 'linen-shirt',
    name: 'Linen Shirt',
    primaryImage: { url: 'https://cdn.example.com/linen.jpg', alt: 'White linen shirt, front view' },
    price: ils('149.90'),
    salePrice: null,
    ...overrides,
  }
}

export function makeProducts(from: number, count: number): ProductCardResponse[] {
  return Array.from({ length: count }, (_, i) => {
    const n = from + i
    return makeProduct({ id: `p-${n}`, slug: `product-${n}`, name: `Product ${n}`, primaryImage: null, price: ils('50.00') })
  })
}

export function productPage(items: ProductCardResponse[], pageIndex: number, totalItems: number, size = 20): PageResponse<ProductCardResponse> {
  return { items, page: pageIndex, size, totalItems, totalPages: Math.ceil(totalItems / size) }
}
