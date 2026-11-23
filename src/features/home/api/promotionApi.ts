import { httpClient } from '@/shared/api/httpClient'
import type { PromotionResponse } from '../types/promotion'

/** Resolves with `[]` when no promotion is currently active. */
export async function getPromotions(): Promise<PromotionResponse[]> {
  const { data } = await httpClient.get<PromotionResponse[]>('/promotions')
  return data
}
