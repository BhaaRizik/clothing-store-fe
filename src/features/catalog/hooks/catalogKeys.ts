import type { ProductListParams } from '../types/product'

export const catalogKeys = {
  all: ['products'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  infiniteList: (params: Omit<ProductListParams, 'page'>) => [...catalogKeys.lists(), 'infinite', params] as const,
}
