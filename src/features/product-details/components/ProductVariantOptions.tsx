import styled, { css } from 'styled-components'
import type { VariantDimension, VariantSelection } from '../hooks/useVariantSelection'
import type { ProductVariant } from '../types/productDetails'
import { missingSelectionMessage } from '../utils/missingSelectionMessage'
import { VariantSelector } from './VariantSelector'

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.md};
  min-width: 0;
`

type Tone = 'hint' | 'inStock' | 'outOfStock'

const Status = styled.p<{ $tone: Tone }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space.xs};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.text};

  ${({ $tone, theme }) =>
    $tone === 'hint' &&
    css`
      font-weight: ${theme.fontWeights.regular};
      color: ${theme.colors.textMuted};
    `}
  ${({ $tone, theme }) =>
    $tone === 'outOfStock' &&
    css`
      color: ${theme.colors.danger};
    `}
`

function statusFor(missing: VariantDimension[], variant: ProductVariant | null): { tone: Tone; message: string } {
  const missingMessage = missingSelectionMessage(missing)
  if (missingMessage) return { tone: 'hint', message: missingMessage }
  if (variant?.available) return { tone: 'inStock', message: 'In stock' }
  return { tone: 'outOfStock', message: variant ? 'Out of stock' : 'Currently unavailable' }
}

const ICONS: Partial<Record<Tone, string>> = { inStock: '✓', outOfStock: '✕' }

type ProductVariantOptionsProps = {
  /** Owned by the parent (see `useVariantSelection`) so the gallery can follow the selected color. */
  selection: VariantSelection
}

/** Variant selector plus the live availability status for the exact combination. */
export function ProductVariantOptions({ selection }: ProductVariantOptionsProps) {
  const { tone, message } = statusFor(selection.missingSelections, selection.selectedVariant)
  const icon = ICONS[tone]

  return (
    <Section aria-label="Product options">
      <VariantSelector
        colors={selection.colors}
        sizes={selection.sizes}
        selectedColor={selection.selectedColor}
        selectedSize={selection.selectedSize}
        onSelectColor={selection.selectColor}
        onSelectSize={selection.selectSize}
      />
      <Status $tone={tone} role="status" aria-live="polite">
        {icon && <span aria-hidden="true">{icon}</span>}
        {message}
      </Status>
    </Section>
  )
}
