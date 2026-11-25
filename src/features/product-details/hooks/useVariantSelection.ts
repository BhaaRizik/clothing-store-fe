import { useMemo, useState } from 'react'
import type { ProductVariant } from '../types/productDetails'

export type VariantDimension = 'color' | 'size'

export type VariantOption = {
  value: string
  /** The combination with the current selection is not defined (native `disabled`). */
  disabled: boolean
  /** At least one matching variant is in stock; `false` is shown as "out of stock" but stays selectable. */
  available: boolean
}

export type ColorOption = VariantOption & { hexCode: string | null }

export type VariantSelection = {
  colors: ColorOption[]
  sizes: VariantOption[]
  selectedColor: string | null
  selectedSize: string | null
  selectColor: (color: string) => void
  selectSize: (size: string) => void
  /** The exact variant for the current selection, or null while a selection is missing. */
  selectedVariant: ProductVariant | null
  /** Dimensions still to be chosen, in display order. */
  missingSelections: VariantDimension[]
}

type Dimensions = {
  colors: { value: string; hexCode: string | null }[]
  sizes: string[]
}

/** Distinct colors (by name) and sizes in first-appearance order; a dimension absent on every variant is empty. */
function deriveDimensions(variants: ProductVariant[]): Dimensions {
  const colors = new Map<string, string | null>()
  const sizes = new Set<string>()
  for (const variant of variants) {
    if (variant.color && !colors.has(variant.color.name)) colors.set(variant.color.name, variant.color.hexCode)
    if (variant.size !== null) sizes.add(variant.size)
  }
  return {
    colors: [...colors].map(([value, hexCode]) => ({ value, hexCode })),
    sizes: [...sizes],
  }
}

const onlyValue = <T>(values: T[]): T | null => (values.length === 1 ? (values[0] ?? null) : null)

/**
 * Color/size selection for a product's variants. Color is the primary dimension: colors are never disabled,
 * and once a color is chosen (or there is no color dimension) sizes not defined for it are disabled.
 * Callers should remount (key by product id) to reset the selection for another product.
 */
export function useVariantSelection(variants: ProductVariant[]): VariantSelection {
  const dimensions = useMemo(() => deriveDimensions(variants), [variants])
  const hasColor = dimensions.colors.length > 0
  const hasSize = dimensions.sizes.length > 0

  const [chosenColor, setChosenColor] = useState<string | null>(null)
  const [chosenSize, setChosenSize] = useState<string | null>(null)

  // A chosen color that is no longer offered (e.g. deactivated before a refetch) is dropped.
  // A dimension with exactly one value is preselected.
  const isColorOffered = chosenColor !== null && dimensions.colors.some((c) => c.value === chosenColor)
  const selectedColor = hasColor ? (isColorOffered ? chosenColor : (onlyValue(dimensions.colors)?.value ?? null)) : null

  const variantsForColor = (color: string | null) =>
    hasColor && color !== null ? variants.filter((v) => v.color?.name === color) : variants

  const sizeCandidates = variantsForColor(selectedColor)
  const colorScoped = !hasColor || selectedColor !== null

  const sizes: VariantOption[] = dimensions.sizes.map((value) => {
    const matches = sizeCandidates.filter((v) => v.size === value)
    return { value, disabled: colorScoped && matches.length === 0, available: matches.some((v) => v.available) }
  })

  const isSizeDefined = (size: string) => sizes.some((option) => option.value === size && !option.disabled)
  const singleSize = onlyValue(dimensions.sizes)
  const selectedSize = !hasSize
    ? null
    : chosenSize !== null && isSizeDefined(chosenSize)
      ? chosenSize
      : singleSize !== null && isSizeDefined(singleSize)
        ? singleSize
        : null

  const colors: ColorOption[] = dimensions.colors.map(({ value, hexCode }) => ({
    value,
    hexCode,
    disabled: false,
    available: variants.some((v) => v.color?.name === value && v.available),
  }))

  const missingSelections: VariantDimension[] = []
  if (hasColor && selectedColor === null) missingSelections.push('color')
  if (hasSize && selectedSize === null) missingSelections.push('size')

  const selectedVariant =
    missingSelections.length > 0
      ? null
      : (variants.find(
          (v) => (!hasColor || v.color?.name === selectedColor) && (!hasSize || v.size === selectedSize),
        ) ?? null)

  const selectColor = (color: string) => {
    setChosenColor(color)
    // Changing color clears a size that isn't defined for the new color.
    if (chosenSize !== null && !variantsForColor(color).some((v) => v.size === chosenSize)) setChosenSize(null)
  }

  return {
    colors,
    sizes,
    selectedColor,
    selectedSize,
    selectColor,
    selectSize: setChosenSize,
    selectedVariant,
    missingSelections,
  }
}
