import type { ProductListParams } from '@/features/catalog'

export const homeKeys = {
  all: ['home'] as const,
  promotions: () => [...homeKeys.all, 'promotions'] as const,
  featuredProducts: (params: ProductListParams) => [...homeKeys.all, 'featured-products', params] as const,
}
