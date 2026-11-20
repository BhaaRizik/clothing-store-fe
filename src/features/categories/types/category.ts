/** `GET /api/v1/categories` item (active categories only, already sorted by the backend). */
export type CategoryResponse = {
  id: string
  slug: string
  name: string
  description: string | null
  imageUrl: string | null
  displayOrder: number
}
