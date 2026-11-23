import { useQuery } from '@tanstack/react-query'
import { getProducts, type ProductCardResponse, type ProductListParams } from '@/features/catalog'
import type { PageResponse } from '@/shared/types/page'
import { homeKeys } from './homeKeys'

export const FEATURED_PRODUCTS_LIMIT = 8

const FEATURED_PARAMS: ProductListParams = {
  featured: true,
  page: 0,
  size: FEATURED_PRODUCTS_LIMIT,
  sort: 'newest',
}

const toItems = (page: PageResponse<ProductCardResponse>) => page.items

/** The newest featured products shown on the homepage (first page only). */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: homeKeys.featuredProducts(FEATURED_PARAMS),
    queryFn: () => getProducts(FEATURED_PARAMS),
    select: toItems,
    staleTime: 60_000,
  })
}
