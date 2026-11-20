import styled from 'styled-components'
import type { Money } from '@/shared/types/money'
import { formatMoney, PRICE_UNAVAILABLE } from '@/shared/utils/formatMoney'
import { VisuallyHidden } from './ui/VisuallyHidden'

type Size = 'md' | 'lg'

const Wrapper = styled.p<{ $size: Size }>`
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: ${({ theme }) => theme.space.xs};
  font-size: ${({ theme, $size }) => ($size === 'lg' ? theme.fontSizes.xl : theme.fontSizes.md)};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`

const Unavailable = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

const SaleAmount = styled.span`
  color: ${({ theme }) => theme.colors.sale};
`

const BaseAmount = styled.s`
  font-size: 0.875em;
  font-weight: ${({ theme }) => theme.fontWeights.regular};
  color: ${({ theme }) => theme.colors.textMuted};
`

type PriceProps = {
  price: Money | null
  salePrice?: Money | null
  size?: Size
}

/**
 * Displays a backend-provided price; when a sale price exists the base price is struck through.
 * A missing base price degrades to "Price unavailable" (a sale price alone is not shown without its base).
 */
export function Price({ price, salePrice, size = 'md' }: PriceProps) {
  if (!price) return <Unavailable>{PRICE_UNAVAILABLE}</Unavailable>

  if (!salePrice) {
    return <Wrapper $size={size}>{formatMoney(price)}</Wrapper>
  }
  return (
    <Wrapper $size={size}>
      <SaleAmount>
        <VisuallyHidden>Sale price: </VisuallyHidden>
        {formatMoney(salePrice)}
      </SaleAmount>
      <BaseAmount>
        <VisuallyHidden>Original price: </VisuallyHidden>
        {formatMoney(price)}
      </BaseAmount>
    </Wrapper>
  )
}
