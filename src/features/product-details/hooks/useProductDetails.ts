import { useQuery } from '@tanstack/react-query'
import { getProductDetails } from '../api/productDetailsApi'

export const productDetailsKeys = {
  all: ['product-details'] as const,
  detail: (slug: string) => [...productDetailsKeys.all, slug] as const,
}

export function useProductDetails(slug: string) {
  return useQuery({
    queryKey: productDetailsKeys.detail(slug),
    queryFn: () => getProductDetails(slug),
    enabled: slug.length > 0,
    staleTime: 60_000,
  })
}
