import type { VariantDimension } from '../hooks/useVariantSelection'

const MISSING_MESSAGES: Record<VariantDimension, string> = {
  color: 'Select a color',
  size: 'Select a size',
}

/** Prompt for the options still to be chosen, or null when the selection is complete. */
export function missingSelectionMessage(missing: VariantDimension[]): string | null {
  if (missing.length > 1) return 'Select a color and size'
  const [first] = missing
  return first ? MISSING_MESSAGES[first] : null
}
