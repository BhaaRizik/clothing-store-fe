import { httpClient } from '@/shared/api/httpClient'
import type { ProductDetailsResponse } from '../types/productDetails'

/** Rejects with ApiError 404 / PRODUCT_NOT_FOUND for unknown or inactive slugs. */
export async function getProductDetails(slug: string): Promise<ProductDetailsResponse> {
  const { data } = await httpClient.get<ProductDetailsResponse>(`/products/${encodeURIComponent(slug)}`)
  return data
}
