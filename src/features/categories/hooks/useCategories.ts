import { useQuery } from '@tanstack/react-query'
import { getCategories } from '../api/categoryApi'
import { categoryKeys } from './categoryKeys'

export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.list(),
    queryFn: getCategories,
    staleTime: 5 * 60_000,
  })
}
