/** Item of `GET /api/v1/promotions` (currently active promotions only, already sorted for display by the backend). */
export type PromotionResponse = {
  id: string
  title: string
  subtitle: string | null
  /** Backend-relative (e.g. `/images/promotions/x.svg`) or absolute; resolved with `resolveAssetUrl`. */
  imageUrl: string
  imageAlt: string
  ctaLabel: string | null
  /** Internal app path starting with `/` when present. */
  ctaUrl: string | null
}
