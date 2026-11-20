import { httpClient } from '@/shared/api/httpClient'
import type { PageResponse } from '@/shared/types/page'
import type { ProductCardResponse, ProductListParams } from '../types/product'

/** Rejects with ApiError 404 / CATEGORY_NOT_FOUND for an unknown category, 400 / VALIDATION_ERROR for bad params. */
export async function getProducts(params: ProductListParams): Promise<PageResponse<ProductCardResponse>> {
  const { data } = await httpClient.get<PageResponse<ProductCardResponse>>('/products', { params })
  return data
}
