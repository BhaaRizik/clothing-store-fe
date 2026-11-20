import { httpClient } from '@/shared/api/httpClient'
import type { CategoryResponse } from '../types/category'

export async function getCategories(): Promise<CategoryResponse[]> {
  const { data } = await httpClient.get<CategoryResponse[]>('/categories')
  return data
}

/** Rejects with ApiError 404 / CATEGORY_NOT_FOUND for unknown or inactive slugs. */
export async function getCategory(slug: string): Promise<CategoryResponse> {
  const { data } = await httpClient.get<CategoryResponse>(`/categories/${encodeURIComponent(slug)}`)
  return data
}
