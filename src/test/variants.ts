import type { ProductVariant } from '@/features/product-details/types/productDetails'

const HEX: Record<string, string> = { Navy: '#1f2a44', White: '#ffffff', Red: '#b0261c' }

/** Builds a variant; `color` is a name (hex looked up, null if unknown) or null when the product has no colors. */
export function variant(id: string, color: string | null, size: string | null, available = true): ProductVariant {
  return {
    id,
    size,
    color: color === null ? null : { name: color, hexCode: HEX[color] ?? null },
    available,
  }
}
