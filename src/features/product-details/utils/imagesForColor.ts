import type { ProductImage } from '../types/productDetails'

/**
 * Gallery images for the selected color: images tagged with that color, then untagged images, in API order.
 * With no color selected, or no image tagged with it, the full default gallery is returned (never emptied).
 */
export function imagesForColor(images: ProductImage[], color: string | null): ProductImage[] {
  if (color === null) return images
  const tagged = images.filter((image) => image.color === color)
  if (tagged.length === 0) return images
  return [...tagged, ...images.filter((image) => image.color === null)]
}
