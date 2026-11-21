import { useQuery } from '@tanstack/react-query'
import { getCategory } from '../api/categoryApi'
import { categoryKeys } from './categoryKeys'

export function useCategory(slug: string) {
  return useQuery({
    queryKey: categoryKeys.detail(slug),
    queryFn: () => getCategory(slug),
    enabled: slug.length > 0,
    staleTime: 5 * 60_000,
  })
}
