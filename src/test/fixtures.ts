import type { CategoryResponse } from '@/features/categories'
import { ApiError } from '@/shared/api/apiError'
import type { Money } from '@/shared/types/money'

export const ils = (amount: string): Money => ({ amount, currency: 'ILS' })

export function makeCategory(overrides: Partial<CategoryResponse> = {}): CategoryResponse {
  return {
    id: 'cat-1',
    slug: 'women',
    name: 'Women',
    description: 'Dresses, tops and more',
    imageUrl: 'https://cdn.example.com/women.jpg',
    displayOrder: 1,
    ...overrides,
  }
}

export const notFound = (code: string) => new ApiError({ status: 404, code, message: 'Not found' })

export const serverError = () => new ApiError({ status: 500, code: 'HTTP_500', message: 'Server error' })

/** Counts h1 elements in the rendered document (one per screen is required). */
export const countH1 = () => document.querySelectorAll('h1').length

/** A promise that can be resolved later, for asserting loading states. */
export function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}
