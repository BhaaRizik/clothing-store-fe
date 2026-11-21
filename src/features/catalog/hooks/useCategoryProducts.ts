import { useInfiniteQuery, type InfiniteData } from '@tanstack/react-query'
import type { PageResponse } from '@/shared/types/page'
import { getProducts } from '../api/productApi'
import type { ProductCardResponse, ProductSort } from '../types/product'
import { catalogKeys } from './catalogKeys'

export const PRODUCT_PAGE_SIZE = 20
const LISTING_SORT: ProductSort = 'newest'

export type ProductListing = {
  items: ProductCardResponse[]
  totalItems: number
}

function toListing(data: InfiniteData<PageResponse<ProductCardResponse>, number>): ProductListing {
  // De-duplicate by id: offset pages can overlap if the catalog changes between "Load more" requests.
  const byId = new Map<string, ProductCardResponse>()
  for (const page of data.pages) {
    for (const item of page.items) {
      if (!byId.has(item.id)) byId.set(item.id, item)
    }
  }
  return { items: [...byId.values()], totalItems: data.pages.at(-1)?.totalItems ?? 0 }
}

/** Products of one category, newest first, loaded page by page ("Load more"). */
export function useCategoryProducts(categorySlug: string) {
  const params = { category: categorySlug, size: PRODUCT_PAGE_SIZE, sort: LISTING_SORT }
  return useInfiniteQuery({
    queryKey: catalogKeys.infiniteList(params),
    queryFn: ({ pageParam }) => getProducts({ ...params, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage.page + 1 < lastPage.totalPages ? lastPage.page + 1 : undefined),
    select: toListing,
    enabled: categorySlug.length > 0,
    staleTime: 60_000,
  })
}
