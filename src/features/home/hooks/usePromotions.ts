import { useQuery } from '@tanstack/react-query'
import { getPromotions } from '../api/promotionApi'
import type { PromotionResponse } from '../types/promotion'
import { homeKeys } from './homeKeys'

export function usePromotions() {
  return useQuery({
    queryKey: homeKeys.promotions(),
    queryFn: getPromotions,
    staleTime: 5 * 60_000,
    // Promotions are optional: an unexpected body (e.g. an HTML fallback page) must not break the homepage.
    select: (data: unknown): PromotionResponse[] => (Array.isArray(data) ? data : []),
  })
}
