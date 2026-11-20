/** Generic paginated response envelope used by list endpoints. `page` is zero-based. */
export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalItems: number
  totalPages: number
}
