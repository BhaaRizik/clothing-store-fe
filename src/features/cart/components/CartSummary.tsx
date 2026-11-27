import { useId } from 'react'
import styled from 'styled-components'
import { formatMoney } from '@/shared/utils/formatMoney'
import type { CartResponse } from '../types/cart'

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.sm};
  padding: ${({ theme }) => theme.space.lg};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.surface};
`

const Title = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
`

const Rows = styled.dl`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space.xs};
  margin: 0;

  div {
    display: flex;
    justify-content: space-between;
    gap: ${({ theme }) => theme.space.md};
  }

  dd {
    margin: 0;
  }
`

const Subtotal = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textMuted};
`

type CartSummaryProps = {
  cart: CartResponse
}

/** Item count and the backend-computed subtotal. There is no checkout yet, so there is no checkout action. */
export function CartSummary({ cart }: CartSummaryProps) {
  const titleId = useId()
  const hasExcluded = cart.items.some((item) => item.status === 'UNAVAILABLE')

  return (
    <Section aria-labelledby={titleId}>
      <Title id={titleId}>Summary</Title>
      <Rows>
        <div>
          <dt>Items</dt>
          <dd>{cart.itemCount}</dd>
        </div>
        <Subtotal>
          <dt>Subtotal</dt>
          <dd>{formatMoney(cart.subtotal)}</dd>
        </Subtotal>
      </Rows>
      {hasExcluded && <Note>Items that are no longer available are not included.</Note>}
      <Note>Shipping and taxes are calculated at checkout.</Note>
    </Section>
  )
}
